"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export type ActivePlan = {
  id: string;
  name: string;
  slug: string;
  paddlePriceId: string | null;
  maxProjects: number;
  maxStorageMB: number;
  maxFileSizeMB: number;
  features: string[];
  monthlyPrice: number;
  currency: string;
  isFree: boolean;
};

export async function getActivePlans(): Promise<ActivePlan[]> {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    paddlePriceId: p.paddlePriceId,
    maxProjects: p.maxProjects,
    maxStorageMB: p.maxStorageMB,
    maxFileSizeMB: p.maxFileSizeMB,
    features: (p.features as string[]) || [],
    monthlyPrice: p.monthlyPrice,
    currency: p.currency,
    isFree: p.isFree,
  }));
}

export type MySubscription = {
  planSlug: string;
  planName: string;
  status: string;
  paddleSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
} | null;

export async function getMySubscription(): Promise<MySubscription> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });

  if (!sub) return null;

  return {
    planSlug: sub.plan.slug,
    planName: sub.plan.name,
    status: sub.status,
    paddleSubscriptionId: sub.paddleSubscriptionId,
    currentPeriodEnd: sub.currentPeriodEnd,
    canceledAt: sub.canceledAt,
  };
}
