import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "missingToken" },
        { status: 400 },
      );
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "invalidToken" },
        { status: 400 },
      );
    }

    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: "tokenExpired" },
        { status: 400 },
      );
    }

    // identifier format: "email-verify:user@example.com"
    const email = verificationToken.identifier.replace("email-verify:", "");

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({ message: "emailVerifiedSuccess" });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "somethingWentWrong" },
      { status: 500 },
    );
  }
}
