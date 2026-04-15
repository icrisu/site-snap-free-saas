import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { getSettings } from "@/lib/settings";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const helpCenterUrl = settings.helpCenterUrl;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 pt-16">
        <DashboardSidebar helpCenterUrl={helpCenterUrl} />
        <MobileSidebar helpCenterUrl={helpCenterUrl} />
        <main className="flex-1 overflow-y-auto px-5 py-3">{children}</main>
      </div>
    </div>
  );
}
