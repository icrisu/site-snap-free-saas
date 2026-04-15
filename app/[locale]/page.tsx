import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CaptureFlow } from "@/components/capture/capture-flow";
import { TestimonialSlider } from "@/components/homepage/testimonials/TestimonialsSlider";
import { HowItWorksSection } from "@/components/homepage/howitworks/HowItWorksSection";
import { MainHero } from "@/components/homepage/MainHero";
import PricingTable from "@/components/homepage/PricingTable";
import Features from "@/components/homepage/Features";
import { getSettings } from "@/lib/settings";


const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const siteName = process.env.SITE_NAME ?? "SiteSnap";
const disableSignupPayments = process.env.DISABLE_SIGNUP_PAYMENTS === "true";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "metadata" });
	const url =
		locale === routing.defaultLocale ? baseUrl : `${baseUrl}/${locale}`;

	return {
		title: t("title"),
		description: t("description"),
		openGraph: {
			title: t("title"),
			description: t("description"),
			url,
		},
		alternates: {
			canonical: url,
		},
	};
}

export default async function HomePage({
	searchParams,
}: {
	params?: Promise<{ locale: string }>;
	searchParams?: Promise<{ site?: string }>;
}) {
	const t = await getTranslations();
	const settings = await getSettings();
	const { site } = (await searchParams) ?? {};

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: siteName,
		description: t("metadata.description"),
		url: baseUrl,
		applicationCategory: "UtilitiesApplication",
		operatingSystem: "Any"
	};

	return (
		<div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			<Header disableSignupPayments={disableSignupPayments} />

			<main className="flex-1">

				<MainHero turnstileSiteKey={settings.turnstileSiteKey} disableTurnstileForPdfGenerate={settings.disableTurnstileForPdfGenerate} initialUrl={site} />

				<HowItWorksSection />

				<Features />

				{!disableSignupPayments && <PricingTable />}

				<TestimonialSlider />


				{/* ================= FINAL CTA ================= */}
				<section className="py-24 text-center">
					<div className="mx-auto max-w-3xl px-4">
						<h2 className="text-4xl font-bold">
							{t("homepage.cta.title")}
						</h2>
						<p className="mt-4 text-zinc-600 dark:text-zinc-400">
							{t("homepage.cta.subtitle")}
						</p>

						<div className="mt-8 max-w-md mx-auto">
							<CaptureFlow turnstileSiteKey={settings.turnstileSiteKey} disableTurnstileForPdfGenerate={settings.disableTurnstileForPdfGenerate} initialUrl={site} />
						</div>
					</div>
				</section>

			</main>

			<Footer />
		</div>
	);
}
