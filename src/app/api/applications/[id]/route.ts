import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// TODO: replace with real user from auth session
const DEMO_USER_EMAIL = "demo@applyflow.local";

async function getUserForRequest(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const userEmail = (token?.email as string | undefined) ?? DEMO_USER_EMAIL;

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

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getUserForRequest(request);
  if (!user) return NextResponse.json({ error: "DB not available" }, { status: 503 });
  const { id } = await params;

  const deleted = await prisma.application.deleteMany({
    where: { id, userId: user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

