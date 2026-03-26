import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;
  const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  if (!microsoftClientId || !microsoftClientSecret || !tenantId) {
    const url = new URL(`/accounts?error=missing_microsoft_oauth`, request.url);
    url.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(url);
  }

  // NextAuth's Microsoft provider is `azure-ad`.
  const url = new URL("/api/auth/signin/azure-ad", request.url);
  url.searchParams.set("callbackUrl", callbackUrl);

  return NextResponse.redirect(url);
}

