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

export async function GET(request: NextRequest) {
  const user = await getUserForRequest(request);
  if (!user) return NextResponse.json([]);
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(applications);
}

export async function POST(request: NextRequest) {
  const user = await getUserForRequest(request);
  if (!user) return NextResponse.json({ error: "DB not available" }, { status: 503 });
  const body = await request.json();

  const application = await prisma.application.create({
    data: {
      userId: user.id,
      company: body.company,
      role: body.role,
      status: body.status ?? "APPLIED",
      source: body.source ?? "manual",
    },
  });

  return NextResponse.json(application, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getUserForRequest(request);
  if (!user) return NextResponse.json({ error: "DB not available" }, { status: 503 });
  const body = await request.json();

  const now = new Date();
  const status = body.status as string | undefined;
  const company = body.company as string | undefined;
  const role = body.role as string | undefined;

  const data: Record<string, unknown> = {};
  if (status) {
    data.status = status;
    if (status === "APPLIED") data.appliedAt = now;
    if (status === "INTERVIEW") data.interviewAt = now;
    if (status === "REJECTED") data.rejectedAt = now;
    if (status === "OFFER") data.offerAt = now;
  }
  if (typeof company === "string") data.company = company;
  if (typeof role === "string") data.role = role;

  const updated = await prisma.application.updateMany({
    where: { id: body.id, userId: user.id },
    data,
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const app = await prisma.application.findFirst({
    where: { id: body.id, userId: user.id },
  });

  return NextResponse.json(app);
}

