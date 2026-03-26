import { Client } from "@microsoft/microsoft-graph-client";

type GraphEmail = {
  provider: "azure-ad";
  emailId: string;
  threadId: string | null;
  subject: string;
  bodyText: string;
  from: string;
  snippet: string;
};

export async function fetchRelevantMicrosoftEmails(params: {
  accessToken: string;
  sinceIsoDateTime: string; // full ISO with timezone, e.g. 2026-02-15T00:00:00Z
  maxResults?: number;
}): Promise<GraphEmail[]> {
  const { accessToken, sinceIsoDateTime, maxResults = 50 } = params;

  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  // Graph filtering is on the server side: last 30 days requirement.
  const res = await client
    .api("/me/messages")
    .top(maxResults)
    .select("id,subject,bodyPreview,receivedDateTime,from")
    .filter(`receivedDateTime ge ${sinceIsoDateTime}`)
    .get();

  type GraphMessage = {
    id?: string;
    subject?: string;
    bodyPreview?: string;
    from?: { emailAddress?: { address?: string; name?: string } };
  };

  type GraphResponse = { value?: GraphMessage[] };

  const data = res as GraphResponse;
  const messages = data.value ?? [];
  if (!messages.length) return [];

  return messages.map((m) => {
    const subject = typeof m.subject === "string" ? m.subject : "";
    const snippet = typeof m.bodyPreview === "string" ? m.bodyPreview : "";
    const bodyText = snippet;
    const from =
      m.from?.emailAddress?.address ??
      m.from?.emailAddress?.name ??
      "";

    return {
      provider: "azure-ad",
      emailId: m.id ?? "",
      threadId: null,
      subject,
      bodyText,
      from,
      snippet,
    };
  });
}

