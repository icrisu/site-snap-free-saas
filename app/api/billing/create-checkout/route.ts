import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId } = await request.json();
    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    // Verify the price maps to an active plan
    const plan = await prisma.plan.findUnique({
      where: { paddlePriceId: priceId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const settings = await getSettings();
    if (!settings.paddleClientToken) {
      return NextResponse.json(
        { error: "Paddle not configured" },
        { status: 500 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    return NextResponse.json({
      clientToken: settings.paddleClientToken,
      environment: settings.paddleEnvironment,
      priceId,
      customData: { userId: session.user.id },
      customerEmail: user?.email,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 },
    );
  }
}
