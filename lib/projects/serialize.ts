import type { Annotation, PageDimensions } from "@/types/annotations";

export interface ProjectData {
	annotations: Record<string, Annotation[]>;
	pageDimensions: Record<string, PageDimensions>;
}

export function serializeAnnotations(
	map: Map<number, Annotation[]>,
	pageDims?: Map<number, PageDimensions>,
): ProjectData {
	const annotations: Record<string, Annotation[]> = {};
	for (const [key, value] of map) {
		annotations[String(key)] = value;
	}

	const pageDimensions: Record<string, PageDimensions> = {};
	if (pageDims) {
		for (const [key, value] of pageDims) {
			pageDimensions[String(key)] = value;
		}
	}

	return { annotations, pageDimensions };
}

export function deserializeAnnotations(
	data: ProjectData | null | undefined,
): { annotations: Map<number, Annotation[]>; pageDimensions: Map<number, PageDimensions> } {
	const annotations = new Map<number, Annotation[]>();
	const pageDimensions = new Map<number, PageDimensions>();

	if (!data) return { annotations, pageDimensions };

	if (data.annotations) {
		for (const [key, value] of Object.entries(data.annotations)) {
			annotations.set(Number(key), value);
		}
	}

	if (data.pageDimensions) {
		for (const [key, value] of Object.entries(data.pageDimensions)) {
			pageDimensions.set(Number(key), value);
		}
	}

	return { annotations, pageDimensions };
}
