import { prisma } from "@/lib/db";
import { type AppSettings, defaultSettings } from "./types";

let cache: AppSettings | null = null;

export async function getSettings(): Promise<AppSettings> {

  try {
    const row = await prisma.settings.findFirst();
    if (row) {
      const data = row.data as Record<string, unknown>;
      cache = { ...defaultSettings, ...data } as AppSettings;
      return cache;
    }
  } catch {
    // DB not available yet — fall through to defaults
  }

  cache = { ...defaultSettings };
  return cache;
}

export async function updateSettings(data: AppSettings): Promise<void> {
  const existing = await prisma.settings.findFirst();
  const jsonData = JSON.parse(JSON.stringify(data));

  if (existing) {
    await prisma.settings.update({
      where: { id: existing.id },
      data: { data: jsonData },
    });
  } else {
    await prisma.settings.create({
      data: { data: jsonData },
    });
  }

  cache = data;
}

export function invalidateSettingsCache(): void {
  cache = null;
}
