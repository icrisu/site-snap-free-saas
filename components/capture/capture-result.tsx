"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { savePdf } from "@/lib/pdf-store";

interface CaptureResultProps {
	pdfBytes: ArrayBuffer;
	onReset: () => void;
}

export function CaptureResult({ pdfBytes, onReset }: CaptureResultProps) {
	const t = useTranslations("result");
	const router = useRouter();

	const handleDownload = useCallback(() => {
		const blob = new Blob([pdfBytes], { type: "application/pdf" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "sitesnap.pdf";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [pdfBytes]);

	const handleEdit = useCallback(async () => {
		await savePdf(pdfBytes);
		router.push("/edit");
	}, [pdfBytes, router]);

	return (
		<Card className="w-full text-center space-y-4">
			<h2 className="text-xl font-semibold">{t("title")}</h2>
			<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
				<Button variant="secondary" onClick={handleDownload}>{t("download")}</Button>
				<Button onClick={handleEdit}>
					{t("edit")}
				</Button>
			</div>
			<button
				onClick={onReset}
				className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
			>
				{t("generateAnother")}
			</button>
		</Card>
	);
}
