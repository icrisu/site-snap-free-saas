"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  User,
  CreditCard,
  Users,
  LayoutList,
  Settings,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  external?: boolean;
};

type DashboardSidebarProps = {
  helpCenterUrl: string;
};

export function DashboardSidebar({ helpCenterUrl }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const t = useTranslations("dashboard.sidebar");

  const role = session?.user?.role;

  const menuItems: MenuItem[] = [
    { label: t("myProjects"), href: "/dashboard", icon: FolderOpen },
    { label: t("myAccount"), href: "/dashboard/my-account", icon: User },
    { label: t("subscription"), href: "/dashboard/subscription", icon: CreditCard, roles: ["CUSTOMER"] },
    { label: t("plans"), href: "/dashboard/plans", icon: LayoutList, roles: ["ADMIN"] },
    { label: t("users"), href: "/dashboard/users", icon: Users, roles: ["ADMIN"] },
    { label: t("appSettings"), href: "/dashboard/app-settings", icon: Settings, roles: ["ADMIN"] },
    ...(helpCenterUrl ? [{ label: t("helpCenter"), href: helpCenterUrl, icon: HelpCircle, external: true }] : []),
  ];

  const visibleItems = menuItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "sticky top-14 hidden h-[calc(100vh-3.5rem)] flex-col border-e border-sidebar-border bg-sidebar-background transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <nav className="flex flex-1 flex-col gap-1 p-2 pt-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = item.external ? false : isActive(item.href);
          const className = cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            active
              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            collapsed && "justify-center px-0",
          );
          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </a>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={className}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? t("logOut") : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t("logOut")}</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? t("expand") : t("collapse")}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" />
              <span>{t("collapse")}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
