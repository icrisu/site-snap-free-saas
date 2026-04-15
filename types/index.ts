export interface PdfRequest {
	url: string;
	turnstileToken: string;
	mode?: "download" | "inline";
}

export interface PdfGenerationResult {
	buffer: Buffer;
	pageCount: number;
}
