import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalidInput" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;
    const locale: string = body.locale || "en";

    const turnstileValid = await verifyTurnstileToken(body.turnstileToken ?? "");
    if (!turnstileValid) {
      return NextResponse.json(
        { error: "turnstileFailed" },
        { status: 403 },
      );
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = await generatePasswordResetToken(email);
      await sendPasswordResetEmail(email, resetToken.token, locale);
    }

    return NextResponse.json({
      message: "resetLinkSent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "somethingWentWrong" },
      { status: 500 },
    );
  }
}
