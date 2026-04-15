import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getSettings } from "@/lib/settings";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const disableSignupPayments = process.env.DISABLE_SIGNUP_PAYMENTS === "true";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {

  if (disableSignupPayments) {
    redirect('/');
  }

  const session = await auth();

  if (session?.user) {
    redirect('/dashboard')
  }

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signIn") };
}

export default async function SignInPage() {
  const settings = await getSettings();
  const showGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return <SignInForm showGoogleSignIn={showGoogle} turnstileSiteKey={settings.turnstileSiteKey} disableSignup={settings.disableSignup} />;
}
