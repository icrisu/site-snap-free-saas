import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalidInput", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    const turnstileValid = await verifyTurnstileToken(body.turnstileToken ?? "");
    if (!turnstileValid) {
      return NextResponse.json(
        { error: "turnstileFailed" },
        { status: 403 },
      );
    }

    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "invalidToken" },
        { status: 400 },
      );
    }

    if (new Date() > resetToken.expires) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "tokenExpired" },
        { status: 400 },
      );
    }

    // identifier format: "password-reset:user@example.com"
    const email = resetToken.identifier.replace("password-reset:", "");

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ message: "passwordResetSuccess" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "somethingWentWrong" },
      { status: 500 },
    );
  }
}
