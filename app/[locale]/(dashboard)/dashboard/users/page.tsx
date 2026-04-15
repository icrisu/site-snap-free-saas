import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { UsersClient } from "@/components/dashboard/users/users-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pages" });
  return { title: t("users") };
}

export default async function UsersPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");

  if (session?.user?.role !== "ADMIN") {
    return (
      <div>
        <h1 className="text-2xl font-bold">{t("pages.users")}</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {t("roleRestricted")}
        </p>
      </div>
    );
  }

  return <UsersClient />;
}
