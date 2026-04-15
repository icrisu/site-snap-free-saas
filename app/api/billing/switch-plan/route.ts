import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPaddleClient } from "@/lib/paddle/client";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const targetPlan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!targetPlan || !targetPlan.isActive) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    // Free -> Paid: need checkout flow
    if (subscription.plan.isFree && !targetPlan.isFree) {
      if (!targetPlan.paddlePriceId) {
        return NextResponse.json(
          { error: "Plan not linked to Paddle" },
          { status: 400 },
        );
      }
      return NextResponse.json({
        action: "checkout",
        priceId: targetPlan.paddlePriceId,
      });
    }

    // Paid -> Free: cancel subscription
    if (!subscription.plan.isFree && targetPlan.isFree) {
      if (subscription.paddleSubscriptionId) {
        const paddle = await getPaddleClient();
        if (paddle) {
          // Remove any pending scheduled changes before canceling
          const paddleSub = await paddle.subscriptions.get(subscription.paddleSubscriptionId);
          if (paddleSub.scheduledChange) {
            await paddle.subscriptions.update(subscription.paddleSubscriptionId, {
              scheduledChange: null,
            });
          }
          await paddle.subscriptions.cancel(subscription.paddleSubscriptionId, {
            effectiveFrom: "immediately",
          });
        }
      }

      // Immediately switch to free plan in our DB
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          planId: targetPlan.id,
          status: "ACTIVE",
          paddleSubscriptionId: null,
          paddleCustomerId: null,
          canceledAt: new Date(),
          currentPeriodStart: null,
          currentPeriodEnd: null,
        },
      });

      return NextResponse.json({ action: "switched", planSlug: targetPlan.slug });
    }

    // Paid -> Paid: must cancel current plan first
    if (!subscription.plan.isFree && !targetPlan.isFree) {
      return NextResponse.json({ action: "cancel_required" });
    }

    return NextResponse.json({ error: "Cannot switch plan" }, { status: 400 });
  } catch (error) {
    console.error("Switch plan error:", error);
    return NextResponse.json(
      { error: "Failed to switch plan" },
      { status: 500 },
    );
  }
}
