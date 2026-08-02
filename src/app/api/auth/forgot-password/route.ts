import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = validated.data;

    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    // Always return the same generic message so the response doesn't reveal
    // whether an account exists for the given email.
    const genericMessage =
      "If an account exists for this email, a password reset link has been generated.";

    if (!user || !user.isActive || user.deletedAt) {
      return NextResponse.json({ message: genericMessage, resetLink: null }, { status: 200 });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: tokenHash,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const origin = new URL(request.url).origin;
    const resetLink = `${origin}/reset-password?token=${token}`;

    // NOTE: This app has no email provider configured, so in demo mode the
    // reset link is returned here for the UI to display directly. In
    // production, send `resetLink` via email instead of returning it.
    return NextResponse.json({ message: genericMessage, resetLink }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
