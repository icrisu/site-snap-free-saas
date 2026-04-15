"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateNameSchema, changePasswordSchema } from "@/lib/validations/auth";
import { getPaddleClient } from "@/lib/paddle/client";
import { deleteProjectFiles } from "@/lib/projects/storage";

export async function updateName(data: { name: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  const parsed = updateNameSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  return { success: true };
}

export async function changePassword(data: {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  if (process.env.PREVENT_CUSTOMER_PASS_CHANGE && session?.user.role === 'CUSTOMER') {
    return { success: false, error: "passwordChangeRestricted" };
  }

  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "invalidInput" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user) {
    return { success: false, error: "unauthorized" };
  }

  // User has existing password — must verify current password
  if (user.password) {
    if (!parsed.data.currentPassword) {
      return { success: false, error: "wrongPassword" };
    }
    const isValid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password,
    );
    if (!isValid) {
      return { success: false, error: "wrongPassword" };
    }
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  return { success: true };
}

export async function deleteAccount(): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      projects: { select: { id: true } },
      subscription: { include: { plan: true } },
    },
  });

  if (!user) {
    return { success: false, error: "unauthorized" };
  }

  if (user.role === "ADMIN") {
    return { success: false, error: "adminCannotDelete" };
  }

  if (process.env.PREVENT_CUSTOMER_PASS_CHANGE && session?.user.role === 'CUSTOMER') {
    return { success: false, error: "passwordChangeRestricted" };
  }

  // Cancel Paddle subscription if active (immediate cancellation)
  if (
    user.subscription?.paddleSubscriptionId &&
    !user.subscription.plan.isFree
  ) {
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

  // Delete all project files (local/S3)
  try {
    await Promise.all(
      user.projects.map((project) => deleteProjectFiles(project.id)),
    );
  } catch (error) {
    console.error("Failed to delete project files:", error);
    return { success: false, error: "deleteFilesFailed" };
  }

  // Delete user — cascade handles accounts, projects, sessions, subscription, limitOverride
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: user.id } });
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "deleteFailed" };
  }

  return { success: true };
}
