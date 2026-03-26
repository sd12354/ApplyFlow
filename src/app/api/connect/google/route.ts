import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!googleClientId || !googleClientSecret) {
    const url = new URL(`/accounts?error=missing_google_oauth`, request.url);
    url.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(url);
  }

  const url = new URL("/api/auth/signin/google", request.url);
  url.searchParams.set("callbackUrl", callbackUrl);

  return NextResponse.redirect(url);
}

