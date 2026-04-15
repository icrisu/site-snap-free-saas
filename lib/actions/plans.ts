"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createPlanSchema,
  updatePlanSchema,
  type CreatePlanInput,
  type UpdatePlanInput,
} from "@/lib/validations/plan";

export type PlanRow = {
  id: string;
  name: string;
  slug: string;
  paddlePriceId: string | null;
  maxProjects: number;
  maxStorageMB: number;
  maxFileSizeMB: number;
  features: string[];
  displayOrder: number;
  monthlyPrice: number;
  currency: string;
  isActive: boolean;
  isFree: boolean;
  _count: { subscriptions: number };
};

export async function getPlans(): Promise<PlanRow[]> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const plans = await prisma.plan.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { subscriptions: true } } },
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
    displayOrder: p.displayOrder,
    monthlyPrice: p.monthlyPrice,
    currency: p.currency,
    isActive: p.isActive,
    isFree: p.isFree,
    _count: p._count,
  }));
}

export async function createPlan(data: CreatePlanInput) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createPlanSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const existing = await prisma.plan.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { success: false, error: "A plan with this slug already exists" };
  }

  await prisma.plan.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      paddlePriceId: parsed.data.paddlePriceId || null,
      maxProjects: parsed.data.maxProjects,
      maxStorageMB: parsed.data.maxStorageMB,
      maxFileSizeMB: parsed.data.maxFileSizeMB,
      features: parsed.data.features,
      displayOrder: parsed.data.displayOrder,
      monthlyPrice: parsed.data.monthlyPrice,
      currency: parsed.data.currency,
      isFree: parsed.data.isFree,
    },
  });

  return { success: true };
}

export async function updatePlan(planId: string, data: UpdatePlanInput) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updatePlanSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    return { success: false, error: "Plan not found" };
  }

  await prisma.plan.update({
    where: { id: planId },
    data: {
      ...parsed.data,
      paddlePriceId: parsed.data.paddlePriceId || null,
      features: parsed.data.features,
    },
  });

  return { success: true };
}

export async function retirePlan(planId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    return { success: false, error: "Plan not found" };
  }

  if (plan.isFree) {
    return { success: false, error: "Cannot retire the free plan" };
  }

  await prisma.plan.update({
    where: { id: planId },
    data: { isActive: false },
  });

  return { success: true };
}
