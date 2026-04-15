import { NextRequest, NextResponse } from "next/server";
import { pdfRequestSchema } from "@/lib/validation";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { generatePdf } from "@/lib/pdf/generator";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
	try {
		// 1. Parse and validate input
		const body = await request.json();
		const parsed = pdfRequestSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Invalid input",
					details: parsed.error.flatten().fieldErrors,
				},
				{ status: 400 },
			);
		}

		const { url, turnstileToken, mode } = parsed.data;

		// 2. Verify Turnstile token (cheapest check first)
		const turnstileValid = await verifyTurnstileToken(turnstileToken, true);
		if (!turnstileValid) {
			return NextResponse.json(
				{ error: "Security verification failed" },
				{ status: 403 },
			);
		}

		// 3. Generate PDF in memory
		const pdfBuffer = await generatePdf(url);

		// 5. Return PDF with appropriate headers
		const disposition =
			mode === "inline"
				? "inline"
				: 'attachment; filename="sitesnap.pdf"';

		return new Response(new Uint8Array(pdfBuffer), {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": disposition,
				"Content-Length": String(pdfBuffer.byteLength),
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("PDF generation error:", error);

		const message =
			error instanceof Error ? error.message : "PDF generation failed";

		if (message.includes("internal/private")) {
			return NextResponse.json({ error: message }, { status: 400 });
		}

		if (message.includes("maximum size")) {
			return NextResponse.json({ error: message }, { status: 413 });
		}

		if (message.includes("Navigation")) {
			return NextResponse.json(
				{
					error: "Failed to load the website. Please check the URL and try again.",
				},
				{ status: 422 },
			);
		}

		return NextResponse.json(
			{ error: "PDF generation failed. Please try again." },
			{ status: 500 },
		);
	}
}
