import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signUpSchema } from "@/lib/validations/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { assignFreePlan } from "@/lib/billing/assign-free-plan";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getSettings } from "@/lib/settings";

export async function POST(request: Request) {
  try {
    const settings = await getSettings();
    if (settings.disableSignup) {
      return NextResponse.json(
        { error: "signupDisabled" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalidInput", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email, password, termsAccepted } = parsed.data;
    const locale: string = body.locale || "en";

    const turnstileValid = await verifyTurnstileToken(body.turnstileToken ?? "");
    if (!turnstileValid) {
      return NextResponse.json(
        { error: "turnstileFailed" },
        { status: 403 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "emailInUse" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        termsAccepted,
      },
    });

    await assignFreePlan(user.id);

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(email, verificationToken.token, locale);

    return NextResponse.json(
      { message: "accountCreated" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "somethingWentWrong" },
      { status: 500 },
    );
  }
}
