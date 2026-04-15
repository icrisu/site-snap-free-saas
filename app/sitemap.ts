import type { MetadataRoute } from "next";
import { locales, routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

	const entries: MetadataRoute.Sitemap = [];

	for (const locale of locales) {
		const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

		entries.push({
			url: `${baseUrl}${prefix || "/"}`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		});
	}

	return entries;
}
