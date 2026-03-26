import { google } from "googleapis";

type GmailEmail = {
  provider: "google";
  emailId: string;
  threadId: string | null | undefined;
  subject: string;
  bodyText: string;
  from: string;
  snippet: string;
};

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const buf = Buffer.from(base64, "base64");
  return buf.toString("utf8");
}

function extractTextFromPayload(payload: unknown): string {
  if (!payload) return "";

  const p = payload as
    | {
        body?: { data?: string };
        parts?: unknown[];
        mimeType?: string;
      }
    | undefined;

  // Direct text body
  if (typeof p?.body?.data === "string") {
    try {
      return decodeBase64Url(p.body.data);
    } catch {
      return "";
    }
  }

  const parts = p?.parts;
  if (!parts?.length) return "";

  // Prefer plain text, but fall back to html if needed.
  const texts: string[] = [];
  for (const part of parts) {
    const partObj = part as { mimeType?: string } | undefined;
    const mimeType = partObj?.mimeType;
    const text = extractTextFromPayload(part);
    if (text) {
      texts.push(text);
      if (mimeType?.startsWith("text/plain")) break;
    }
  }

  const joined = texts.join("\n");
  if (!joined) return "";

  // Strip basic HTML tags if we ended up with html.
  return joined.replace(/<[^>]*>/g, " ");
}

function headerValue(headers: Array<{ name: string; value?: string }>, name: string) {
  const h = headers.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

export async function fetchRelevantGmailEmails(params: {
  accessToken: string;
  refreshToken: string;
  sinceIsoDate: string; // e.g., 2026-02-15
  maxResults?: number;
}): Promise<GmailEmail[]> {
  const {
    accessToken,
    refreshToken,
    sinceIsoDate,
    maxResults = 50,
  } = params;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Refresh access token if needed.
  try {
    const refreshed = await oAuth2Client.refreshAccessToken();
    const newAccessToken = refreshed.credentials.access_token;
    if (newAccessToken) oAuth2Client.setCredentials({ access_token: newAccessToken });
  } catch {
    // If refresh fails, attempt with existing access token.
  }

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // Using `newer_than` keeps the query aligned with the last 30 days requirement.
  // We also include key phrases to reduce message volume where possible.
  const q =
    `after:${sinceIsoDate} ` +
    `( "application received" OR "thank you for applying" OR "interview invitation" OR "we regret to inform you" OR "job offer" OR "offer letter" )`;

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults,
  });

  const ids = listRes.data.messages?.map((m) => m.id).filter(Boolean) as string[];
  const results: GmailEmail[] = [];

  for (const id of ids) {
    const msgRes = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });

    const message = msgRes.data;
    const headers = (message.payload?.headers ?? []) as Array<{
      name: string;
      value?: string;
    }>;

    const subject = headerValue(headers, "Subject");
    const from = headerValue(headers, "From");
    const snippet = message.snippet ?? "";
    const bodyText = extractTextFromPayload(message.payload);

    results.push({
      provider: "google",
      emailId: message.id ?? id,
      threadId: (message.threadId as string | undefined) ?? null,
      subject,
      bodyText,
      from,
      snippet,
    });
  }

  return results;
}

