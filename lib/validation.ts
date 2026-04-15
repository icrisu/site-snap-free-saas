import { z } from "zod";

export const pdfRequestSchema = z.object({
	url: z
		.string()
		.min(1, "URL is required")
		.url("Invalid URL format")
		.refine(
			(url) => {
				try {
					const parsed = new URL(url);
					return (
						parsed.protocol === "https:" ||
						parsed.protocol === "http:"
					);
				} catch {
					return false;
				}
			},
			{ message: "URL must use http or https protocol" },
		),
	turnstileToken: z.string().optional().default(""),
	mode: z.enum(["download", "inline"]).optional().default("download"),
});

export type PdfRequestInput = z.infer<typeof pdfRequestSchema>;
