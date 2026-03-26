import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyEmail, filterEmailByKeywords } from "@/lib/emailClassifier";
import { getToken } from "next-auth/jwt";
import { decryptString, encryptString } from "@/lib/encryption";
import { inferCompanyAndRoleFromEmail } from "@/lib/email/infer";
import { fetchRelevantGmailEmails } from "@/lib/email/providers/gmail";
import { fetchRelevantMicrosoftEmails } from "@/lib/email/providers/microsoft";

// Fallback user for local dev before auth + DB are fully configured.
const DEMO_USER_EMAIL = "demo@applyflow.local";

async function getUserForSync(userEmail: string) {
  try {
    return await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        name: userEmail === DEMO_USER_EMAIL ? "Demo User" : "User",
      },
    });
  } catch {
    return null;
  }
}

async function refreshMicrosoftAccessToken(params: {
  refreshToken: string;
  account: { providerUserId: string };
}): Promise<{ accessToken: string; expiresAt?: Date; refreshToken?: string }> {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Missing Microsoft OAuth env vars");
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    scope: "Mail.Read offline_access",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Microsoft token refresh failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    access_token?: string;
    expires_on?: string;
    refresh_token?: string;
  };

  const accessToken = json.access_token;
  const expiresAtRaw = json.expires_on;
  const refreshToken = json.refresh_token;

  if (!accessToken) {
    throw new Error("Microsoft token refresh response missing access_token");
  }

  // expires_on is often a unix timestamp string.
  const expiresAt = expiresAtRaw ? new Date(Number(expiresAtRaw) * 1000) : undefined;

  return { accessToken, expiresAt, refreshToken };
}

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const userEmail = token?.email ?? DEMO_USER_EMAIL;
  const user = await getUserForSync(userEmail as string);
  if (!user) return NextResponse.json({ count: 0 });

  let connectedAccounts: Array<{
    id: string;
    provider: string;
    accessTokenEncrypted: string;
    refreshTokenEncrypted: string | null;
    providerUserId: string;
    email: string | null;
  }> = [];

  try {
    connectedAccounts = await prisma.connectedAccount.findMany({
      where: { userId: user.id },
    });
  } catch {
    return NextResponse.json({ count: 0 });
  }

  if (!connectedAccounts.length) return NextResponse.json({ count: 0 });

  // Rebuild auto-synced email cards each run so updated classifier rules
  // remove previous false positives (e.g. promo "offer" emails).
  await prisma.application.deleteMany({
    where: {
      userId: user.id,
      source: { in: ["gmail", "outlook", "email"] },
    },
  });

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sinceIsoDate = since.toISOString().slice(0, 10); // YYYY-MM-DD
  const sinceIsoDateTime = since.toISOString(); // full ISO

  const now = new Date();
  const ops: Array<ReturnType<typeof prisma.application.upsert>> = [];
  let appUpsertCount = 0;

  for (const account of connectedAccounts) {
    if (account.provider === "google") {
      if (!account.refreshTokenEncrypted) continue;

      const accessToken = decryptString(account.accessTokenEncrypted);
      const refreshToken = decryptString(account.refreshTokenEncrypted);

      const emails = await fetchRelevantGmailEmails({
        accessToken,
        refreshToken,
        sinceIsoDate,
      });

      for (const email of emails) {
        const text = `${email.subject}\n${email.bodyText}\n${email.from}\n${email.snippet}`;
        if (!filterEmailByKeywords(text)) continue;
        const status = classifyEmail(text);
        if (!status) continue;

        const inferred = inferCompanyAndRoleFromEmail(email.subject, email.from);

        ops.push(
          prisma.application.upsert({
            where: {
              userId_company_role: {
                userId: user.id,
                company: inferred.company,
                role: inferred.role,
              },
            },
            update: {
              status,
              source: "gmail",
              lastEmailAt: now,
            },
            create: {
              userId: user.id,
              company: inferred.company,
              role: inferred.role,
              status,
              source: "gmail",
              lastEmailAt: now,
              emailId: email.emailId,
              threadId: email.threadId ?? undefined,
              ...(status === "APPLIED" ? { appliedAt: now } : {}),
              ...(status === "INTERVIEW" ? { interviewAt: now } : {}),
              ...(status === "REJECTED" ? { rejectedAt: now } : {}),
              ...(status === "OFFER" ? { offerAt: now } : {}),
            },
          }),
        );
        appUpsertCount += 1;
      }
    } else if (account.provider === "azure-ad") {
      if (!account.refreshTokenEncrypted) continue;

      const refreshToken = decryptString(account.refreshTokenEncrypted);

      try {
        const refreshed = await refreshMicrosoftAccessToken({
          refreshToken,
          account,
        });

        await prisma.connectedAccount.update({
          where: { id: account.id },
          data: {
            accessTokenEncrypted: encryptString(refreshed.accessToken),
            refreshTokenEncrypted: refreshed.refreshToken
              ? encryptString(refreshed.refreshToken)
              : undefined,
            expiresAt: refreshed.expiresAt ?? undefined,
          },
        });

        const emails = await fetchRelevantMicrosoftEmails({
          accessToken: refreshed.accessToken,
          sinceIsoDateTime,
        });

        for (const email of emails) {
          const text = `${email.subject}\n${email.bodyText}\n${email.from}\n${email.snippet}`;
          if (!filterEmailByKeywords(text)) continue;
          const status = classifyEmail(text);
          if (!status) continue;

          const inferred = inferCompanyAndRoleFromEmail(
            email.subject,
            email.from,
          );

          ops.push(
            prisma.application.upsert({
              where: {
                userId_company_role: {
                  userId: user.id,
                  company: inferred.company,
                  role: inferred.role,
                },
              },
              update: {
                status,
                source: "outlook",
                lastEmailAt: now,
              },
              create: {
                userId: user.id,
                company: inferred.company,
                role: inferred.role,
                status,
                source: "outlook",
                lastEmailAt: now,
                emailId: email.emailId,
                threadId: email.threadId ?? undefined,
                ...(status === "APPLIED" ? { appliedAt: now } : {}),
                ...(status === "INTERVIEW" ? { interviewAt: now } : {}),
                ...(status === "REJECTED" ? { rejectedAt: now } : {}),
                ...(status === "OFFER" ? { offerAt: now } : {}),
              },
            }),
          );
          appUpsertCount += 1;
        }
      } catch {
        // If refresh fails for a single account, continue syncing others.
      }
    }
  }

  if (!ops.length) return NextResponse.json({ count: 0 });

  // Filter out undefined ops if any (e.g. refreshTokenEncrypted update).
  await prisma.$transaction(ops);

  return NextResponse.json({ count: appUpsertCount });
}

