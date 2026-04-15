"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createUserSchema,
  type CreateUserInput,
} from "@/lib/validations/create-user";
import {
  updateUserSchema,
  type UpdateUserInput,
} from "@/lib/validations/update-user";
import bcrypt from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";
import { assignFreePlan } from "@/lib/billing/assign-free-plan";
import { deleteProjectFiles } from "@/lib/projects/storage";
import { getPaddleClient } from "@/lib/paddle/client";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  role: "ADMIN" | "CUSTOMER";
  planName: string | null;
  planSlug: string | null;
  overrideMaxProjects: number | null;
  overrideMaxStorageMB: number | null;
  overrideReason: string | null;
  createdAt: Date;
};

type GetUsersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  planSlug?: string;
  sortOrder?: "asc" | "desc";
};

export async function getUsers(params: GetUsersParams = {}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const {
    page = 1,
    pageSize = 20,
    search,
    planSlug,
    sortOrder = "desc",
  } = params;

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (planSlug) {
    where.subscription = { plan: { slug: planSlug } };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            plan: { select: { name: true, slug: true } },
          },
        },
        limitOverride: {
          select: {
            maxProjects: true,
            maxStorageMB: true,
            reason: true,
          },
        },
      },
      orderBy: { createdAt: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      role: u.role,
      planName: u.subscription?.plan.name ?? null,
      planSlug: u.subscription?.plan.slug ?? null,
      overrideMaxProjects: u.limitOverride?.maxProjects ?? null,
      overrideMaxStorageMB: u.limitOverride?.maxStorageMB ?? null,
      overrideReason: u.limitOverride?.reason ?? null,
      createdAt: u.createdAt,
    })) as UserRow[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createUser(data: CreateUserInput) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { success: false, error: "A user with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: parsed.data.role,
      emailVerified: new Date(),
    },
  });

  await assignFreePlan(user.id);

  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (session.user.id === userId) {
    return { success: false, error: "You cannot delete your own account" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: { select: { id: true } },
      subscription: { include: { plan: true } },
    },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (user.subscription?.paddleSubscriptionId && !user.subscription.plan.isFree) {
    try {
      const paddle = await getPaddleClient();
      if (paddle) {
        try {
          const paddleSub = await paddle.subscriptions.get(
            user.subscription.paddleSubscriptionId,
          );
          if (paddleSub.scheduledChange) {
            await paddle.subscriptions.update(
              user.subscription.paddleSubscriptionId,
              { scheduledChange: null },
            );
          }

          await paddle.subscriptions.cancel(
            user.subscription.paddleSubscriptionId,
            { effectiveFrom: "immediately" },
          );
        } catch (error: unknown) {
          const isAlreadyCanceled =
            error instanceof Error &&
            "code" in error &&
            (error as { code: string }).code ===
              "subscription_update_when_canceled";
          if (!isAlreadyCanceled) {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Failed to cancel Paddle subscription:", error);
      return { success: false, error: "cancelSubscriptionFailed" };
    }
  }

  // Delete all project files (PDF + thumbnail) before removing from DB
  await Promise.all(
    user.projects.map((project) => deleteProjectFiles(project.id)),
  );

  await prisma.user.delete({ where: { id: userId } });

  return { success: true };
}

export async function updateUser(userId: string, data: UpdateUserInput) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (parsed.data.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return { success: false, error: "A user with this email already exists" };
    }
  }

  // Update user base fields
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      emailVerified: parsed.data.emailVerified ? new Date() : null,
      role: parsed.data.role,
      ...(parsed.data.newPassword
        ? { password: await bcrypt.hash(parsed.data.newPassword, 12) }
        : {}),
    },
  });

  // Update plan assignment if provided
  if (parsed.data.planId) {
    const plan = await prisma.plan.findUnique({
      where: { id: parsed.data.planId },
    });
    if (plan) {
      await prisma.subscription.upsert({
        where: { userId },
        update: { planId: plan.id },
        create: {
          userId,
          planId: plan.id,
          status: "ACTIVE",
        },
      });
    }
  }

  // Handle limit overrides
  const hasOverride =
    parsed.data.overrideMaxProjects != null ||
    parsed.data.overrideMaxStorageMB != null;

  if (hasOverride) {
    await prisma.userLimitOverride.upsert({
      where: { userId },
      update: {
        maxProjects: parsed.data.overrideMaxProjects ?? null,
        maxStorageMB: parsed.data.overrideMaxStorageMB ?? null,
        reason: parsed.data.overrideReason || null,
      },
      create: {
        userId,
        maxProjects: parsed.data.overrideMaxProjects ?? null,
        maxStorageMB: parsed.data.overrideMaxStorageMB ?? null,
        reason: parsed.data.overrideReason || null,
      },
    });
  } else {
    // Remove override if all fields are null/empty
    await prisma.userLimitOverride.deleteMany({ where: { userId } });
  }

  return { success: true };
}
