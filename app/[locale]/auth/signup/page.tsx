import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getSettings } from "@/lib/settings";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {

  const session = await auth();

  if (session?.user) {
    redirect('/dashboard')
  }
  
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signUp") };
}

export default async function SignUpPage() {
  const settings = await getSettings();
  return <SignUpForm turnstileSiteKey={settings.turnstileSiteKey} disableSignup={settings.disableSignup} termsUrl={settings.termsUrl} />;
}
