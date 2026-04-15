import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPaddleClient } from "@/lib/paddle/client";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    if (subscription.plan.isFree) {
      return NextResponse.json(
        { error: "Cannot cancel a free plan" },
        { status: 400 },
      );
    }

    if (!subscription.paddleSubscriptionId) {
      return NextResponse.json(
        { error: "No Paddle subscription to cancel" },
        { status: 400 },
      );
    }

    const paddle = await getPaddleClient();
    if (!paddle) {
      return NextResponse.json(
        { error: "Paddle not configured" },
        { status: 500 },
      );
    }

    // Cancel on Paddle — if already canceled, swallow the error and proceed with DB downgrade
    try {
      const paddleSub = await paddle.subscriptions.get(subscription.paddleSubscriptionId);
      if (paddleSub.scheduledChange) {
        await paddle.subscriptions.update(subscription.paddleSubscriptionId, {
          scheduledChange: null,
        });
      }

      await paddle.subscriptions.cancel(subscription.paddleSubscriptionId, {
        effectiveFrom: "immediately",
      });
      
    } catch (err: unknown) {
      const isAlreadyCanceled =
        err instanceof Error &&
        "code" in err &&
        (err as { code: string }).code === "subscription_update_when_canceled";
      if (!isAlreadyCanceled) {
        throw err;
      }
    }


    // Immediately downgrade to free plan in our DB
    const freePlan = await prisma.plan.findFirst({
      where: { isFree: true, isActive: true },
    });

    if (freePlan) {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          planId: freePlan.id,
          status: "ACTIVE",
          paddleSubscriptionId: null,
          paddleCustomerId: null,
          canceledAt: new Date(),
          currentPeriodStart: null,
          currentPeriodEnd: null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
