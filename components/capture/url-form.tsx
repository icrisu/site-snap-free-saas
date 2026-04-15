"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurnstileWidget } from "@/components/turnstile/turnstile-widget";
import { Spinner } from "@/components/ui/spinner";


const urlFormSchema = z.object({
	url: z.string().min(1).url(),
});

type UrlFormValues = z.infer<typeof urlFormSchema>;

interface UrlFormProps {
	onPdfGenerated: (pdfBytes: ArrayBuffer) => void;
	turnstileSiteKey?: string;
	cancelTurnstile?: boolean;
	useInternalPdfApi?: boolean;
	disableTurnstileForPdfGenerate?: boolean;
	initialUrl?: string;
}

export function UrlForm({ onPdfGenerated, turnstileSiteKey, cancelTurnstile, useInternalPdfApi, disableTurnstileForPdfGenerate, initialUrl }: UrlFormProps) {
	let turnstileEnabled = !!turnstileSiteKey && !cancelTurnstile;
	if (disableTurnstileForPdfGenerate) {
		turnstileEnabled = false;
	}
	const t = useTranslations("form");
	const tErrors = useTranslations("errors");
	const [turnstileToken, setTurnstileToken] = useState<string>("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string>("");

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<UrlFormValues>({
		resolver: zodResolver(urlFormSchema),
		defaultValues: { url: initialUrl ?? "" },
	});

	useEffect(() => {
		if (initialUrl) {
			handleSubmit(onSubmit)();
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const handleTurnstileVerify = useCallback((token: string) => {
		setTurnstileToken(token);
	}, []);

	const handleTurnstileExpire = useCallback(() => {
		setTurnstileToken("");
	}, []);

	async function onSubmit(data: UrlFormValues) {
		if (turnstileEnabled && !turnstileToken) {
			setError(t("errors.turnstileRequired"));
			return;
		}

		setIsGenerating(true);
		setError("");

		const apiUrl = useInternalPdfApi ? "/api/pdf/internal" : "/api/pdf";

		try {
			const response = await fetch(apiUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					url: data.url,
					turnstileToken,
					mode: "download",
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				if (response.status === 413) {
					setError(tErrors("pdfTooLarge"));
				} else if (response.status === 403) {
					setError(tErrors("turnstileFailed"));
				} else {
					setError(errorData.error || tErrors("generic"));
				}
				return;
			}

			const pdfBytes = await response.arrayBuffer();
			onPdfGenerated(pdfBytes);
		} catch {
			setError(tErrors("generic"));
		} finally {
			setIsGenerating(false);
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
			{isGenerating && (
				<div className="flex items-center gap-2 justify-center" style={{ color: "lab(45 63.03 -84.97)" }}>
					<Spinner />
					<span className="font-bold">{t("generating")}</span>
				</div>
			)}
			<div>
				<label
					htmlFor="url"
					className="block text-sm font-medium mb-1.5"
				>
					{t("urlLabel")}
				</label>
				<Input
					id="url"
					type="url"
					placeholder={t("urlPlaceholder")}
					error={errors.url ? t("errors.urlInvalid") : undefined}
					{...register("url")}
				/>
			</div>

			{turnstileEnabled && (
				<TurnstileWidget
					siteKey={turnstileSiteKey!}
					onVerify={handleTurnstileVerify}
					onExpire={handleTurnstileExpire}
				/>
			)}

			{error && <p className="text-sm text-red-500">{error}</p>}

			<Button
				type="submit" 
				isLoading={isGenerating}
				className="w-full"
				disabled={isGenerating}
			>
				{isGenerating ? t("generating") : t("submit")}
			</Button>
		</form>
	);
}
