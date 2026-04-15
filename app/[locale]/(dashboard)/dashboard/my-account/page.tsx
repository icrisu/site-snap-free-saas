import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MyAccountForm } from "@/components/dashboard/my-account-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.pages" });
  return { title: t("myAccount") };
}

export default async function MyAccountPage() {
  
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const t = await getTranslations("dashboard.pages");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, role: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("myAccount")}</h1>
      <MyAccountForm
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
        hasPassword={!!user?.password}
        role={user?.role ?? "CUSTOMER"}
      />
    </div>
  );
}
