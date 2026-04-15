import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("forgotPassword") };
}

export default async function ForgotPasswordPage() {
  const settings = await getSettings();
  return (
    <ForgotPasswordForm
      turnstileSiteKey={settings.turnstileSiteKey}
      disableSignup={settings.disableSignup}
    />
  );
}
