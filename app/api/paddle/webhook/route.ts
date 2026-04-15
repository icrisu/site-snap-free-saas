import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { verifyPaddleWebhook } from "@/lib/paddle/webhook";
import type { SubscriptionStatus } from "@/generated/prisma/client";

const PADDLE_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  paused: "PAUSED",
  canceled: "CANCELED",
};

export async function POST(request: Request) {

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("Paddle-Signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const settings = await getSettings();
    if (!settings.paddleWebhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    if (!verifyPaddleWebhook(rawBody, signature, settings.paddleWebhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type as string;

    switch (eventType) {
      case "subscription.created":
      case "subscription.updated": {
        const data = event.data;
        const paddleSubscriptionId = data.id as string;
        const paddleCustomerId = data.customer_id as string;
        const paddleStatus = data.status as string;
        const userId = data.custom_data?.userId as string | undefined;

        if (!userId) {
          console.error("Webhook missing userId in custom_data");
          return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const status = PADDLE_STATUS_MAP[paddleStatus] || "ACTIVE";

        // Find plan by paddle price ID
        const priceId = data.items?.[0]?.price?.id as string | undefined;
        let planId: string | undefined;

        if (priceId) {
          const plan = await prisma.plan.findUnique({
            where: { paddlePriceId: priceId },
          });
          if (plan) planId = plan.id;
        }

        const existingSub = await prisma.subscription.findUnique({
          where: { userId },
        });

        if (existingSub) {
          await prisma.subscription.update({
            where: { userId },
            data: {
              paddleSubscriptionId,
              paddleCustomerId,
              status,
              ...(planId ? { planId } : {}),
              currentPeriodStart: data.current_billing_period?.starts_at
                ? new Date(data.current_billing_period.starts_at)
                : undefined,
              currentPeriodEnd: data.current_billing_period?.ends_at
                ? new Date(data.current_billing_period.ends_at)
                : undefined,
            },
          });
        } else if (planId) {
          await prisma.subscription.create({
            data: {
              userId,
              planId,
              paddleSubscriptionId,
              paddleCustomerId,
              status,
              currentPeriodStart: data.current_billing_period?.starts_at
                ? new Date(data.current_billing_period.starts_at)
                : undefined,
              currentPeriodEnd: data.current_billing_period?.ends_at
                ? new Date(data.current_billing_period.ends_at)
                : undefined,
            },
          });
        }
        break;
      }

      case "subscription.canceled": {
        const data = event.data;
        const userId = data.custom_data?.userId as string | undefined;

        if (userId) {
          // Revert to free plan
          const freePlan = await prisma.plan.findFirst({
            where: { isFree: true, isActive: true },
          });

          if (freePlan) {
            await prisma.subscription.update({
              where: { userId },
              data: {
                planId: freePlan.id,
                status: "CANCELED",
                paddleSubscriptionId: null,
                paddleCustomerId: null,
                canceledAt: new Date(),
                currentPeriodStart: null,
                currentPeriodEnd: null,
              },
            });
          }
        }
        break;
      }

      case "transaction.completed": {
        // Log or handle completed transactions if needed
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paddle webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
