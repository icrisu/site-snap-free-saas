import { defineRouting } from "next-intl/routing";
import languagesMeta from "@/messages/languages-meta";

export type Locale = string;

export const rtlLocales: Locale[] = languagesMeta.filter(entry => entry.isRtl).map(entry => entry.fileName);

export const locales: Locale[] = languagesMeta.map((entry) => {
	return entry.fileName;
});

export const defaultLocale = Array.isArray(locales) && locales.length > 0 ? locales[0] : '';

export const routing = defineRouting({
	locales: locales,
	defaultLocale,
	// localePrefix: "as-needed",
	// localeDetection: true
});