"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";
import { updateAppSettings } from "@/lib/actions/settings";
import type { AppSettings } from "@/lib/settings/types";

type AppSettingsFormProps = {
	settings: AppSettings;
};


export function AppSettingsForm({ settings }: AppSettingsFormProps) {
	const t = useTranslations("dashboard.appSettings");
	const [toast, setToast] = useState<{ message: string } | null>(null);
	const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});


	const {
		register,
		handleSubmit,
		control,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<SettingsInput>({
		resolver: zodResolver(settingsSchema),
		defaultValues: {
			turnstileSiteKey: settings.turnstileSiteKey,
			turnstileSecretKey: settings.turnstileSecretKey,
			disableTurnstileForPdfGenerate: settings.disableTurnstileForPdfGenerate,
			resendApiKey: settings.resendApiKey,
			emailFrom: settings.emailFrom,
			maxPdfFileSizeMb: settings.maxPdfFileSizeMb,
			pdfStorage: settings.pdfStorage,
			awsS3Bucket: settings.awsS3Bucket,
			awsS3Region: settings.awsS3Region,
			awsAccessKeyId: settings.awsAccessKeyId,
			awsSecretAccessKey: settings.awsSecretAccessKey,
			paddleApiKey: settings.paddleApiKey,
			paddleClientToken: settings.paddleClientToken,
			paddleWebhookSecret: settings.paddleWebhookSecret,
			paddleEnvironment: settings.paddleEnvironment,
			helpCenterUrl: settings.helpCenterUrl,
			termsUrl: settings.termsUrl,
			adsenseClientId: settings.adsenseClientId,
			disableSignup: settings.disableSignup,
			disableSubscriptions: settings.disableSubscriptions,
		},
	});

	const pdfStorage = useWatch({ control, name: "pdfStorage" });
	const paddleEnvironment = useWatch({ control, name: "paddleEnvironment" });

	const toggleVisibility = (field: string) => {
		setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }));
	};

	const onSubmit = async (data: SettingsInput) => {
		const result = await updateAppSettings(data);
		if (result.success) {
			setToast({ message: t("success") });
		} else {
			setToast({ message: result.error || t("error") });
		}
	};

	const passwordField = (name: keyof SettingsInput, label: string) => (
		<div className="space-y-2">
			<Label htmlFor={name}>{label}</Label>
			<div className="relative">
				<Input
					id={name}
					type={visibleFields[name] ? "text" : "password"}
					{...register(name)}
					error={errors[name]?.message}
					className="pr-10"
				/>
				<button
					type="button"
					onClick={() => toggleVisibility(name)}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
				>
					{visibleFields[name] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
				</button>
			</div>
		</div>
	);

	const renderSubmit = () => {
		return (
			<div className="mt-5 flex flex-row-reverse">
				<Button type="submit" isLoading={isSubmitting}>
					{isSubmitting ? t("saving") : t("save")}
				</Button>
			</div>
		)
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
			{/* Security (Turnstile) */}
			<Card>
				<h2 className="text-lg font-semibold mb-4">{t("security")}</h2>
				<div className="space-y-4">
					{passwordField("turnstileSiteKey", t("turnstileSiteKey"))}
					{passwordField("turnstileSecretKey", t("turnstileSecretKey"))}
					<div className="flex items-center gap-2">
						<Checkbox
							id="disableTurnstileForPdfGenerate"
							checked={useWatch({ control, name: "disableTurnstileForPdfGenerate" })}
							onCheckedChange={(checked) => setValue("disableTurnstileForPdfGenerate", checked === true)}
						/>
						<Label htmlFor="disableTurnstileForPdfGenerate">{t("disableTurnstileForPdfGenerate")}</Label>
					</div>
				</div>
				{renderSubmit()}
			</Card>

			{/* Email (Resend) */}
			<Card>
				<h2 className="text-lg font-semibold mb-4">{t("email")}</h2>
				<div className="space-y-4">
					{passwordField("resendApiKey", t("apiKey"))}
					<div className="space-y-2">
						<Label htmlFor="emailFrom">{t("fromAddress")}</Label>
						<Input
							id="emailFrom"
							{...register("emailFrom")}
							error={errors.emailFrom?.message}
						/>
					</div>
					{renderSubmit()}
				</div>
			</Card>

			{/* PDF Generation */}
			<Card>
				<h2 className="text-lg font-semibold mb-4">{t("pdfGeneration")}</h2>
				<div className="space-y-2">
					<Label htmlFor="maxPdfFileSizeMb">{t("maxFileSizeMb")}</Label>
					<Input
						id="maxPdfFileSizeMb"
						type="number"
						min={1}
						max={100}
						{...register("maxPdfFileSizeMb", { valueAsNumber: true })}
						error={errors.maxPdfFileSizeMb?.message}
					/>
					{renderSubmit()}
				</div>
			</Card>

			{/* File Storage */}
			<Card>
				<h2 className="text-lg font-semibold mb-4">{t("fileStorage")}</h2>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="pdfStorage">{t("storageType")}</Label>
						<Select
							value={pdfStorage}
							onValueChange={(val) => setValue("pdfStorage", val as "local" | "s3")}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="local">{t("storageLocal")}</SelectItem>
								<SelectItem value="s3">{t("storageS3")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{pdfStorage === "s3" && (
						<>
							<div className="space-y-2">
								<Label htmlFor="awsS3Bucket">{t("s3Bucket")}</Label>
								<Input
									id="awsS3Bucket"
									{...register("awsS3Bucket")}
									error={errors.awsS3Bucket?.message}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="awsS3Region">{t("s3Region")}</Label>
								<Input
									id="awsS3Region"
									{...register("awsS3Region")}
									error={errors.awsS3Region?.message}
								/>
							</div>
							{passwordField("awsAccessKeyId", t("accessKeyId"))}
							{passwordField("awsSecretAccessKey", t("secretAccessKey"))}
						</>
					)}
					{renderSubmit()}
				</div>
			</Card>

			{/* Paddle Billing */}
			<Card>
				<h2 className="text-lg font-semibold mb-4">{t("paddleBilling")}</h2>
				<div className="space-y-4">
					{passwordField("paddleApiKey", t("paddleApiKey"))}
					{passwordField("paddleClientToken", t("paddleClientToken"))}
					{passwordField("paddleWebhookSecret", t("paddleWebhookSecret"))}
					<div className="space-y-2">
						<Label htmlFor="paddleEnvironment">{t("paddleEnvironment")}</Label>
						<Select
							value={paddleEnvironment}
							onValueChange={(val) => setValue("paddleEnvironment", val as "sandbox" | "production")}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="sandbox">{t("paddleSandbox")}</SelectItem>
								<SelectItem value="production">{t("paddleProduction")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{renderSubmit()}
				</div>
			</Card>

			{/* Dynamic Links */}
			<Card>
				<h2 className="text-lg font-semibold mb-4">{t("dynamicLinks")}</h2>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="helpCenterUrl">{t("helpCenterUrl")}</Label>
						<Input
							id="helpCenterUrl"
							type="url"
							placeholder="https://help.example.com"
							{...register("helpCenterUrl")}
							error={errors.helpCenterUrl?.message}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="termsUrl">{t("termsUrl")}</Label>
						<Input
							id="termsUrl"
							type="url"
							placeholder="https://example.com/terms"
							{...register("termsUrl")}
							error={errors.termsUrl?.message}
						/>
					</div>
					{renderSubmit()}
				</div>
			</Card>

			{/* Advertising (AdSense) */}
			<Card>
				<h2 className="text-lg font-semibold mb-4">{t("advertising")}</h2>
				<div className="space-y-2">
					<Label htmlFor="adsenseClientId">{t("adsenseClientId")}</Label>
					<Input
						id="adsenseClientId"
						placeholder="ca-pub-XXXXXXXXXXXXXXXX"
						{...register("adsenseClientId")}
						error={errors.adsenseClientId?.message}
					/>
					{renderSubmit()}
				</div>
			</Card>

			{/* Developer settings */}
			<Card>
				<h2 className="text-lg font-semibold mb-4">Developer settings</h2>
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Checkbox
							id="disableSignup"
							checked={useWatch({ control, name: "disableSignup" })}
							onCheckedChange={(checked) => setValue("disableSignup", checked === true)}
						/>
						<Label htmlFor="disableSignup">{t("disableSignup")}</Label>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox
							id="disableSubscriptions"
							checked={useWatch({ control, name: "disableSubscriptions" })}
							onCheckedChange={(checked) => setValue("disableSubscriptions", checked === true)}
						/>
						<Label htmlFor="disableSubscriptions">{t("disableSubscriptions")}</Label>
					</div>
				</div>
				{renderSubmit()}
			</Card>

			{toast && (
				<Toast message={toast.message} onClose={() => setToast(null)} />
			)}
		</form>
	);
}
