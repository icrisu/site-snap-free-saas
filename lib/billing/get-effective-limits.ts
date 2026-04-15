import { prisma } from "@/lib/db";

export type EffectiveLimits = {
  maxProjects: number;
  maxStorageMB: number;
  maxFileSizeMB: number;
  planName: string;
  planSlug: string;
  subscriptionStatus: string;
  isPaid: boolean;
};

const FALLBACK_LIMITS: EffectiveLimits = {
  maxProjects: 5,
  maxStorageMB: 50,
  maxFileSizeMB: 10,
  planName: "Free",
  planSlug: "free",
  subscriptionStatus: "ACTIVE",
  isPaid: false,
};

export async function getEffectiveLimits(
  userId: string,
): Promise<EffectiveLimits> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!subscription) return FALLBACK_LIMITS;

  const override = await prisma.userLimitOverride.findUnique({
    where: { userId },
  });

  return {
    maxProjects: override?.maxProjects ?? subscription.plan.maxProjects,
    maxStorageMB: override?.maxStorageMB ?? subscription.plan.maxStorageMB,
    maxFileSizeMB: subscription.plan.maxFileSizeMB,
    planName: subscription.plan.name,
    planSlug: subscription.plan.slug,
    subscriptionStatus: subscription.status,
    isPaid: !subscription.plan.isFree,
  };
}
