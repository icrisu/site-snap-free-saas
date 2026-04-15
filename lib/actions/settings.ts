"use server";

import { auth } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/settings";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";
import type { AppSettings } from "@/lib/settings/types";

export async function getAppSettings(): Promise<AppSettings> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return getSettings();
}

export async function updateAppSettings(
  data: SettingsInput,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const previous = await getSettings();

  await updateSettings(parsed.data);

  // Re-initialize Paddle client if API key changed
  if (parsed.data.paddleApiKey !== previous.paddleApiKey) {
    const { invalidatePaddleClient } = await import("@/lib/paddle/client");
    invalidatePaddleClient();
  }

  return { success: true };
}
