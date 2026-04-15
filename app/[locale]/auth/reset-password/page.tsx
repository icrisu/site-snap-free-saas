import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("resetPassword") };
}

export default async function ResetPasswordPage() {
  const settings = await getSettings();
  return <ResetPasswordForm turnstileSiteKey={settings.turnstileSiteKey} />;
}
