import { prisma } from "@/lib/db";

export async function assignFreePlan(userId: string): Promise<void> {
  const freePlan = await prisma.plan.findFirst({
    where: { isFree: true, isActive: true },
  });

  if (!freePlan) {
    console.error("No active free plan found — skipping subscription assignment");
    return;
  }

  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (existing) return;

  await prisma.subscription.create({
    data: {
      userId,
      planId: freePlan.id,
      status: "ACTIVE",
    },
  });
}
