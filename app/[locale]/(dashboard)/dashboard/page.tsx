import { getTranslations } from "next-intl/server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getUserProjects } from "@/lib/actions/projects";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pages" });
  return { title: t("myProjects") };
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard.pages");
  const projects = await getUserProjects();

  return (
    <div>
      <h1 className="text-xl font-bold">{t("myProjects")}</h1>
      <div className="mt-4">
        <DashboardContent projects={projects} />
      </div>
    </div>
  );
}
