"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UrlForm } from "@/components/capture/url-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateThumbnail } from "@/lib/projects/thumbnail";

type Step = "url" | "name";

type NewProjectFlowProps = {
	onCreated?: () => void;
};

export function NewProjectFlow({ onCreated }: NewProjectFlowProps) {
	const t = useTranslations("projects");
	const router = useRouter();
	const [step, setStep] = useState<Step>("url");
	const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
	const [sourceUrl, setSourceUrl] = useState("");
	const [projectName, setProjectName] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	const handlePdfGenerated = useCallback((bytes: ArrayBuffer) => {
		setPdfBytes(bytes);
		setStep("name");
	}, []);

	const handleBack = useCallback(() => {
		setStep("url");
		setPdfBytes(null);
		setProjectName("");
		setError("");
	}, []);

	const handleSave = useCallback(async () => {
		if (!pdfBytes || !projectName.trim()) return;

		setIsSaving(true);
		setError("");

		try {
			const pdfData = new Uint8Array(pdfBytes);
			const thumbnailBlob = await generateThumbnail(pdfData);

			const formData = new FormData();
			formData.append("name", projectName.trim());
			if (sourceUrl) formData.append("sourceUrl", sourceUrl);
			formData.append("pdf", new Blob([pdfBytes], { type: "application/pdf" }), "capture.pdf");
			formData.append("thumbnail", thumbnailBlob, "thumbnail.png");

			const res = await fetch("/api/projects", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error || t("error"));
				return;
			}

			const data = await res.json();
			if (onCreated) {
				onCreated();
			} else {
				router.push(`/dashboard/projects/${data.id}`);
			}
		} catch {
			setError(t("error"));
		} finally {
			setIsSaving(false);
		}
	}, [pdfBytes, projectName, sourceUrl, router, t, onCreated]);

	if (step === "name") {
		return (
			<div className="mt-6 max-w-md space-y-4">
				<div>
					<label htmlFor="project-name" className="block text-sm font-medium mb-1.5">
						{t("projectName")}
					</label>
					<Input
						id="project-name"
						value={projectName}
						onChange={(e) => setProjectName(e.target.value)}
						placeholder={t("projectNamePlaceholder")}
					/>
				</div>

				{error && <p className="text-sm text-red-500">{error}</p>}

				<div className="flex gap-3">
					<Button variant="outline" onClick={handleBack} disabled={isSaving}>
						{t("back")}
					</Button>
					<Button
						onClick={handleSave}
						disabled={!projectName.trim() || isSaving}
						isLoading={isSaving}
					>
						{isSaving ? t("saving") : t("createProject")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="mt-6 max-w-md">
			<UrlFormWithCapture
				onPdfGenerated={handlePdfGenerated}
				onUrlChange={setSourceUrl}
			/>
		</div>
	);
}

function UrlFormWithCapture({
	onPdfGenerated,
	onUrlChange,
}: {
	onPdfGenerated: (bytes: ArrayBuffer) => void;
	onUrlChange: (url: string) => void;
}) {
	return (
		<UrlFormTracked
			onPdfGenerated={onPdfGenerated}
			onUrlChange={onUrlChange}
		/>
	);
}

function UrlFormTracked({
	onPdfGenerated,
	onUrlChange,
}: {
	onPdfGenerated: (bytes: ArrayBuffer) => void;
	onUrlChange: (url: string) => void;
}) {
	const handlePdfGenerated = useCallback(
		(bytes: ArrayBuffer) => {
			// Extract URL from the form input before callback
			const urlInput = document.querySelector<HTMLInputElement>("#url");
			if (urlInput) onUrlChange(urlInput.value);
			onPdfGenerated(bytes);
		},
		[onPdfGenerated, onUrlChange],
	);

	return <UrlForm useInternalPdfApi cancelTurnstile onPdfGenerated={handlePdfGenerated} />;
}
