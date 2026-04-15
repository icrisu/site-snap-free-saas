import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveProjectFile, getFileSize } from "@/lib/projects/storage";
import { getEffectiveLimits } from "@/lib/billing/get-effective-limits";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> },
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { projectId } = await params;

		const project = await prisma.project.findUnique({
			where: { id: projectId },
		});

		if (!project || project.userId !== session.user.id) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		return NextResponse.json({
			id: project.id,
			name: project.name,
			sourceUrl: project.sourceUrl,
			localPdfFileName: project.localPdfFileName,
			localThumbnailFileName: project.localThumbnailFileName,
			pdfUrl: project.pdfUrl,
			thumbnailUrl: project.thumbnailUrl,
			data: project.data,
			createdAt: project.createdAt,
			updatedAt: project.updatedAt,
		});
	} catch (error) {
		console.error("Get project error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch project" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> },
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { projectId } = await params;

		const project = await prisma.project.findUnique({
			where: { id: projectId },
		});

		if (!project || project.userId !== session.user.id) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		const formData = await request.formData();
		const annotationsJson = formData.get("annotations") as string | null;
		const thumbnailFile = formData.get("thumbnail") as File | null;

		const updateData: Record<string, unknown> = {};

		if (annotationsJson) {
			try {
				updateData.data = JSON.parse(annotationsJson);
			} catch {
				return NextResponse.json({ error: "Invalid annotations JSON" }, { status: 400 });
			}
		}

		if (thumbnailFile) {
			const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());

			// Enforce storage quota for thumbnail replacement
			const pdfSize = await getFileSize(projectId, "pdf");
			const newFileSize = pdfSize + thumbBuffer.length;
			const oldFileSize = Number(project.fileSize ?? 0);

			const limits = await getEffectiveLimits(session.user.id);
			const storageAgg = await prisma.project.aggregate({
				where: { userId: session.user.id },
				_sum: { fileSize: true },
			});
			const existingTotal = Number(storageAgg._sum.fileSize ?? 0);
			const newTotal = existingTotal - oldFileSize + newFileSize;
			if (newTotal > limits.maxStorageMB * 1024 * 1024) {
				return NextResponse.json(
					{ error: "Storage quota exceeded" },
					{ status: 403 },
				);
			}

			const thumbResult = await saveProjectFile(projectId, "thumbnail", thumbBuffer);
			updateData.localThumbnailFileName = thumbResult.fileName;
			updateData.thumbnailUrl = thumbResult.url;
			updateData.fileSize = BigInt(newFileSize);
		}

		await prisma.project.update({
			where: { id: projectId },
			data: updateData,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Update project error:", error);
		return NextResponse.json(
			{ error: "Failed to update project" },
			{ status: 500 },
		);
	}
}
