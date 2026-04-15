import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SubscriptionClient } from "@/components/dashboard/subscription/subscription-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pages" });
  return { title: t("subscription") };
}

export default async function SubscriptionPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");

  if (session?.user?.role === "ADMIN") {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("pages.subscription")}</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {t("adminNoSubscription")}
        </p>
      </div>
    );
  }

  const settings = await getSettings();

  return (
    <SubscriptionClient
      paddleClientToken={settings.paddleClientToken}
      paddleEnvironment={settings.paddleEnvironment}
      disableSubscriptions={settings.disableSubscriptions}
    />
  );
}
