"use client";

import { useState } from "react";
import { UrlForm } from "./url-form";
import { CaptureResult } from "./capture-result";

interface CaptureFlowProps {
	turnstileSiteKey?: string;
	disableTurnstileForPdfGenerate?: boolean;
	initialUrl?: string;
}

export function CaptureFlow({ turnstileSiteKey, disableTurnstileForPdfGenerate, initialUrl }: CaptureFlowProps) {
	const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
	const [activeInitialUrl, setActiveInitialUrl] = useState(initialUrl);

	if (pdfBytes) {
		return (
			<CaptureResult
				pdfBytes={pdfBytes}
				onReset={() => setPdfBytes(null)}
			/>
		);
	}

	return <UrlForm turnstileSiteKey={turnstileSiteKey} disableTurnstileForPdfGenerate={disableTurnstileForPdfGenerate} initialUrl={activeInitialUrl} onPdfGenerated={(bytes) => {
		setActiveInitialUrl(undefined);
		setPdfBytes(bytes);
	}} />;
}
