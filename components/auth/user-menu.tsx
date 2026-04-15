"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export function UserMenu() {
  const { data: session } = useSession();
  const t = useTranslations("auth");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) {
    return;
  }

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session.user.email?.[0]?.toUpperCase() || "?";

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
        aria-label="User menu"
        aria-expanded={open}
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 min-w-[180px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
            <p className="text-sm font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex w-full items-center px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("dashboard")}
          </Link>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut({ redirect: false });
              router.push('/auth/signin');
            }}
            className="flex w-full items-center px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
