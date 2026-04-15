"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LocaleMeta } from "@/i18n/locale-meta";

const LocaleMetaContext = createContext<Record<string, LocaleMeta>>({});

export const useLocaleMeta = () => useContext(LocaleMetaContext);

export function LocaleMetaProvider({
	meta,
	children,
}: {
	meta: Record<string, LocaleMeta>;
	children: ReactNode;
}) {
	return (
		<LocaleMetaContext value={meta}>{children}</LocaleMetaContext>
	);
}
