"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const t = useTranslations("errors");

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
			<h1 className="text-2xl font-bold">{t("generic")}</h1>
			<Button onClick={reset}>Try again</Button>
		</div>
	);
}
