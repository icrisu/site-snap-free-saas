"use client";

import { useState, useRef, useEffect, createElement, type ComponentType, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocaleMeta } from "@/components/providers/locale-meta-provider";
import * as Flags from "country-flag-icons/react/1x1";

type LocaleMeta = Record<string, { countryCode?: string }>;

function renderFlag(loc: string, meta: LocaleMeta, className?: string): ReactNode {
	const code = meta[loc]?.countryCode;
	if (!code) return null;
	const Flag = (Flags as Record<string, ComponentType<{ className?: string }>>)[code];
	if (!Flag) return null;
	return createElement(Flag, { className });
}

export function LocaleSwitcher() {
	const locale = useLocale();
	const pathname = usePathname();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const meta = useLocaleMeta();

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	function handleSelect(newLocale: string) {
		setOpen(false);
		if (newLocale !== locale) {
			router.replace(pathname, { locale: newLocale });
		}
	}

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => setOpen(!open)}
				className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
				aria-expanded={open}
				aria-haspopup="listbox"
			>
				{renderFlag(locale, meta, "h-4 w-4")}
				<span>{locale.toUpperCase()}</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className={`transition-transform ${open ? "rotate-180" : ""}`}
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>

			{open && (
				<div
					className="absolute end-0 mt-1 min-w-[80px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
					role="listbox"
					aria-activedescendant={locale}
				>
					{routing.locales.map((loc) => (
						<button
							key={loc}
							id={loc}
							role="option"
							aria-selected={locale === loc}
							onClick={() => handleSelect(loc)}
							className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors ${
								locale === loc
									? "bg-zinc-100 dark:bg-zinc-800"
									: "hover:bg-zinc-50 dark:hover:bg-zinc-800"
							}`}
						>
							{renderFlag(loc, meta, "h-4 w-4")}
							<span>{loc.toUpperCase()}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
