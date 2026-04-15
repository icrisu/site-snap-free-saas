import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getAppSettings } from "@/lib/actions/settings";
import { AppSettingsForm } from "@/components/dashboard/app-settings/app-settings-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pages" });
  return { title: t("appSettings") };
}

export default async function AppSettingsPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("pages.appSettings")}</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {t("roleRestricted")}
        </p>
      </div>
    );
  }

  const settings = await getAppSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("pages.appSettings")}</h1>
      <AppSettingsForm settings={settings} />
    </div>
  );
}
