import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, locales, rtlLocales, type Locale } from "@/i18n/routing";
import { getAllLocaleMeta } from "@/i18n/locale-meta";
import { LocaleMetaProvider } from "@/components/providers/locale-meta-provider";
import { AdProvider } from "@/components/ads/ad-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SessionProvider } from "next-auth/react";
import { getSettings } from "@/lib/settings";
import Script from "next/script";
import CookieBanner from "@/components/CookieBanner";
import "../globals.css";

const themeKey = process.env.NEXT_PUBLIC_THEME_STORAGE_KEY || "sitesnap-theme";
const themeScript = `(function(){try{var t=localStorage.getItem("${themeKey}");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const consentInitScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});`;

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const siteName = process.env.SITE_NAME ?? "SiteSnap";

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "metadata" });

	const languages: Record<string, string> = {};
	for (const l of locales) {
		languages[l] = l === routing.defaultLocale ? `${baseUrl}` : `${baseUrl}/${l}`;
	}

	return {
		metadataBase: new URL(baseUrl),
		title: {
			template: `%s | ${siteName}`,
			default: t("title"),
		},
		description: t("description"),
		openGraph: {
			type: "website",
			locale,
			siteName,
			images: [{ url: "/og.png", width: 1200, height: 630 }],
		},
		twitter: {
			card: "summary_large_image",
			images: ["/og.png"],
		},
		alternates: {
			languages,
		},
		robots: { index: true, follow: true },
	};
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	const messages = await getMessages();
	const localeMeta = await getAllLocaleMeta();
	const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";

	const settings = await getSettings();

	return (
		<html lang={locale} dir={dir} suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: consentInitScript }} />
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
				{gaId && (
					<>
						<Script
							id="ga-script"
							strategy="afterInteractive"
							src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
						/>
						<Script
							id="ga-init"
							strategy="afterInteractive"
							dangerouslySetInnerHTML={{
								__html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
							}}
						/>
					</>
				)}
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
			>
			<SessionProvider>
					<NextIntlClientProvider messages={messages}>
						<LocaleMetaProvider meta={localeMeta}>
							<ThemeProvider>
								<AdProvider clientId={settings.adsenseClientId} />
								{children}
							</ThemeProvider>
						</LocaleMetaProvider>
					</NextIntlClientProvider>
				</SessionProvider>
				<CookieBanner />
			</body>
		</html>
	);
}
