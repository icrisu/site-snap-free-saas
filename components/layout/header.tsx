"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import languagesMeta from "@/messages/languages-meta";
import { UserMenu } from "@/components/auth/user-menu";
import { useSession } from "next-auth/react";
import React from "react";

type BaseHeaderProps = {
	breadcrumbs?: React.ReactNode;
	disableSignupPayments?: boolean;
};

export function Header({ breadcrumbs, disableSignupPayments }: BaseHeaderProps) {
	const t = useTranslations("header");
	const tAuth = useTranslations("auth");
	const pathname = usePathname();
	const isDashboard = pathname.startsWith("/dashboard");
	const isEditNoUser = pathname.startsWith("/edit");

	const showLocaleSwitcher = languagesMeta.length > 1;

	const [menuOpen, setMenuOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const { data: session } = useSession();

	/* Scroll detection for background */
	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};

		window.addEventListener("scroll", handleScroll);
		handleScroll();

		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	/* Close mobile menu on outside click */
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const mainClasses = `fixed top-0 z-50 transition-all duration-300 left-0 w-full border-b border-transparent`;
	let defaultClasses = `${mainClasses} bg-white/0 dark:bg-zinc-950/0 backdrop-blur-xl`;

	if (scrolled) {
		defaultClasses = `${mainClasses} bg-white/60 dark:bg-zinc-950/10 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800`
	}

	if (isDashboard || isEditNoUser) {
		defaultClasses = `${defaultClasses} border-b border-zinc-200 dark:border-zinc-800`
	}

	const wideClass = isDashboard || isEditNoUser ? '' : 'max-w-7xl';

	const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
	// Only intercept if we are already on the home page
	if (pathname === "/") {
		e.preventDefault();
		const href = e.currentTarget.href;
		const targetId = href.replace(/.*\#/, "");
		const elem = document.getElementById(targetId);
		elem?.scrollIntoView({
		behavior: "smooth",
		});
	}
	};

	return (
		<header className={defaultClasses}>
			<div className={`mx-auto px-4 ${wideClass}`}>
				<div className="flex h-16 items-center justify-between">

					{/* Left Side */}
					<div className="flex items-center justify-center gap-2">
						<Link
							href="/"
							className="text-2xl md:text-3xl font-bold tracking-tight bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent"
						>
							{t("brand")}
						</Link>
						{ breadcrumbs && (
							<>
							<span className="text-zinc-900 font-semibold">:</span>
							{breadcrumbs}
							</>
						) }
					</div>

					{/* Right Side */}
					<div className="hidden md:flex items-center gap-4">
						{!isDashboard && !session && (

							<>
								<Link
									href="/"
									className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
								>
									{t("home")}
								</Link>
								{!disableSignupPayments && (
									<Link onClick={handleScroll}
										href="/#pricing"
										className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
									>
										{t("pricing")}
									</Link>
								)}
							</>
						)}

						
						{ !session && !disableSignupPayments && (
							<Link
								href="/auth/signin"
								className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
							>
								{tAuth("signIn")}
							</Link>
						) }

						<ThemeSwitcher />
						{showLocaleSwitcher && <LocaleSwitcher />}
						<UserMenu />
					</div>

					{/* Mobile */}
					<div className="md:hidden flex items-center gap-2">
						<ThemeSwitcher />
						{showLocaleSwitcher && <LocaleSwitcher />}
						<UserMenu />

						{!isDashboard && !session && (
							<div ref={menuRef} className="relative">
								<button
									onClick={() => setMenuOpen(!menuOpen)}
									className="rounded-lg p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="22"
										height="22"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<line x1="3" x2="21" y1="6" y2="6" />
										<line x1="3" x2="21" y1="12" y2="12" />
										<line x1="3" x2="21" y1="18" y2="18" />
									</svg>
								</button>

								{menuOpen && (
									<div className="absolute right-0 mt-3 w-56 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-2">
										<Link
											href="/"
											onClick={() => setMenuOpen(false)}
											className="block px-4 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
										>
											{t("home")}
										</Link>
										{!disableSignupPayments && (
											<Link
												href="/#pricing"
												onClick={() => setMenuOpen(false)}
												className="block px-4 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
											>
												{t("pricing")}
											</Link>
										)}


										{!disableSignupPayments && (
											<Link
												href="/auth/signin"
												onClick={() => setMenuOpen(false)}
												className="block px-4 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
											>
												{tAuth("signIn")}
											</Link>
										)}

									{!disableSignupPayments && (
										<div className="mt-2 border-t border-zinc-200 dark:border-zinc-800 pt-2">
											<Link
												href="/auth/signup"
												onClick={() => setMenuOpen(false)}
												className="block text-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
											>
												{t("getStarted")}
											</Link>
										</div>
									)}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
