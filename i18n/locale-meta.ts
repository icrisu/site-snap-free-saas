
import languagesMeta from "@/messages/languages-meta";

export type LocaleMeta = { countryCode: string };

export async function getAllLocaleMeta(): Promise<Record<string, LocaleMeta>> {
	const meta: Record<string, LocaleMeta> = {};
	languagesMeta.map((entry) => {
		meta[entry.fileName] = { countryCode: entry.countryCode.toUpperCase() };
	})
	return meta;
}
