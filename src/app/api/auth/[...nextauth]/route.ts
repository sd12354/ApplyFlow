import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { encryptString } from "@/lib/encryption";

type OAuthTokens = {
  provider?: string;
  providerAccountId?: string;
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  expires_at?: number;
};

const authHandler = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          // Request offline access so we can refresh tokens during /api/sync-emails.
          access_type: "offline",
          prompt: "consent",
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Persist user + connected account tokens.
      try {
        if (!user?.email || !account) return true;

        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
          create: {
            email: user.email,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
        });

        const acc = account as unknown as OAuthTokens;
        const provider = acc.provider;
        const providerUserId = acc.providerAccountId;
        const accessToken = acc.access_token;
        const refreshToken = acc.refresh_token;
        const scope = acc.scope;
        const expiresAtRaw = acc.expires_at;

        if (!provider || !providerUserId || !accessToken) return true;

        await prisma.connectedAccount.upsert({
          where: {
            userId_provider_providerUserId: {
              userId: dbUser.id,
              provider,
              providerUserId,
            },
          },
          update: {
            email: user.email,
            accessTokenEncrypted: encryptString(accessToken),
            refreshTokenEncrypted: refreshToken
              ? encryptString(refreshToken)
              : null,
            scope,
            expiresAt: expiresAtRaw ? new Date(expiresAtRaw * 1000) : null,
          },
          create: {
            userId: dbUser.id,
            provider,
            providerUserId,
            email: user.email,
            accessTokenEncrypted: encryptString(accessToken),
            refreshTokenEncrypted: refreshToken
              ? encryptString(refreshToken)
              : null,
            scope,
            expiresAt: expiresAtRaw ? new Date(expiresAtRaw * 1000) : null,
          },
        });
      } catch {
        // Don't block sign-in if token persistence fails; /api/sync-emails can be retried.
      }

      return true;
    },
  },
  // Add a predictable secret to sign JWTs.
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    // We don't define custom pages for now.
  },
});

export { authHandler as GET, authHandler as POST };

