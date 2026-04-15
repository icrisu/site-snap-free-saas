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
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  external?: boolean;
};

type MobileSidebarProps = {
  helpCenterUrl: string;
};

export function MobileSidebar({ helpCenterUrl }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const t = useTranslations("dashboard.sidebar");

  const role = session?.user?.role;

  // Close on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const menuItems: MenuItem[] = [
    { label: t("myProjects"), href: "/dashboard", icon: FolderOpen },
    { label: t("myAccount"), href: "/dashboard/my-account", icon: User },
    { label: t("subscription"), href: "/dashboard/subscription", icon: CreditCard, roles: ["CUSTOMER"] },
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
    <div className="md:hidden">
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 start-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        aria-label={t("expand")}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Slide-in panel */}
          <div className="relative z-10 flex h-full w-72 flex-col bg-sidebar-background shadow-xl animate-in slide-in-from-start duration-200">
            <div className="flex items-center justify-between border-b border-sidebar-border p-4">
              <span className="text-sm font-semibold text-sidebar-foreground">
                SiteSnap
              </span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-sidebar-foreground hover:bg-sidebar-accent/50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-2">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = item.external ? false : isActive(item.href);
                const className = cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                );
                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={className}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={className}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-sidebar-border p-2">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>{t("logOut")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
