import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("verifyEmail") };
}

export default function VerifyEmailPage() {
  return <VerifyEmailStatus />;
}
