import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveProjectFile } from "@/lib/projects/storage";
import { getSettings } from "@/lib/settings";
import { getEffectiveLimits } from "@/lib/billing/get-effective-limits";
import { getUsage } from "@/lib/billing/get-usage";

const createSchema = z.object({
	name: z.string().min(1).max(255),
	sourceUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const isAdmin = session?.user?.role === 'ADMIN';
		const [limits, usage] = await Promise.all([
			getEffectiveLimits(session.user.id),
			getUsage(session.user.id),
		]);

		if (!isAdmin) {
			if (usage.projectCount >= limits.maxProjects) {
				return NextResponse.json(
					{ error: "Project limit reached" },
					{ status: 403 },
				);
			}
		}


		const formData = await request.formData();
		const name = formData.get("name") as string;
		const sourceUrl = formData.get("sourceUrl") as string | null;
		const pdfFile = formData.get("pdf") as File | null;
		const thumbnailFile = formData.get("thumbnail") as File | null;

		const parsed = createSchema.safeParse({
			name,
			sourceUrl: sourceUrl || undefined,
		});

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid input", details: parsed.error.flatten().fieldErrors },
				{ status: 400 },
			);
		}

		if (!pdfFile) {
			return NextResponse.json({ error: "PDF file required" }, { status: 400 });
		}

		const settings = await getSettings();
		const maxPdfSize = settings.maxPdfFileSizeMb * 1024 * 1024;

		if (pdfFile.size > maxPdfSize) {
			return NextResponse.json({ error: "PDF too large" }, { status: 413 });
		}

		// Parse buffers to compute total size
		const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
		let thumbBuffer: Buffer | null = null;
		if (thumbnailFile) {
			thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
		}
		const newFileSize = pdfBuffer.length + (thumbBuffer?.length ?? 0);

		// Enforce storage quota
		const storageBytes = usage.storageMB * 1024 * 1024;
		if (storageBytes + newFileSize > limits.maxStorageMB * 1024 * 1024) {
			return NextResponse.json(
				{ error: "Storage quota exceeded" },
				{ status: 403 },
			);
		}

		// Create the project record first to get the ID
		const project = await prisma.project.create({
			data: {
				userId: session.user.id,
				name: parsed.data.name,
				sourceUrl: parsed.data.sourceUrl ?? null,
			},
		});

		// Save PDF file
		const pdfResult = await saveProjectFile(project.id, "pdf", pdfBuffer);

		// Save thumbnail if provided
		let thumbResult: { fileName: string; url: string | null } | null = null;
		if (thumbBuffer) {
			thumbResult = await saveProjectFile(project.id, "thumbnail", thumbBuffer);
		}

		// Update project with file paths, URLs, and tracked fileSize
		await prisma.project.update({
			where: { id: project.id },
			data: {
				localPdfFileName: pdfResult.fileName,
				pdfUrl: pdfResult.url,
				localThumbnailFileName: thumbResult?.fileName ?? null,
				thumbnailUrl: thumbResult?.url ?? null,
				fileSize: BigInt(newFileSize),
			},
		});

		return NextResponse.json({ id: project.id }, { status: 201 });
	} catch (error) {
		console.error("Create project error:", error);
		return NextResponse.json(
			{ error: "Failed to create project" },
			{ status: 500 },
		);
	}
}
