import { writeFile, unlink, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectsCommand,
	HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSettings } from "@/lib/settings";

// --- Config ---

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PDF_DIR = path.join(UPLOAD_DIR, "pdfs");
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, "thumbnails");

function getS3Client(region: string, accessKeyId: string, secretAccessKey: string) {
	return new S3Client({
		region,
		credentials: { accessKeyId, secretAccessKey },
	});
}

// --- Types ---

export interface SaveResult {
	fileName: string;
	url: string | null;
}

// --- Local backend ---

async function ensureDir(dir: string) {
	await mkdir(dir, { recursive: true });
}

async function saveLocal(
	projectId: string,
	type: "pdf" | "thumbnail",
	data: Buffer | Uint8Array,
): Promise<SaveResult> {
	const dir = type === "pdf" ? PDF_DIR : THUMBNAIL_DIR;
	await ensureDir(dir);

	const ext = type === "pdf" ? ".pdf" : ".png";
	const fileName = `${projectId}${ext}`;
	const filePath = path.join(dir, fileName);

	await writeFile(filePath, data);
	return { fileName, url: null };
}

async function deleteLocal(projectId: string) {
	const pdfPath = path.join(PDF_DIR, `${projectId}.pdf`);
	const thumbPath = path.join(THUMBNAIL_DIR, `${projectId}.png`);
	await Promise.allSettled([unlink(pdfPath), unlink(thumbPath)]);
}

// --- S3 backend ---

function s3Key(projectId: string, type: "pdf" | "thumbnail") {
	const ext = type === "pdf" ? ".pdf" : ".png";
	const folder = type === "pdf" ? "pdfs" : "thumbnails";
	return `${folder}/${projectId}${ext}`;
}

function s3Url(key: string, bucket: string, region: string) {
	return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function saveS3(
	projectId: string,
	type: "pdf" | "thumbnail",
	data: Buffer | Uint8Array,
	bucket: string,
	region: string,
	accessKeyId: string,
	secretAccessKey: string,
): Promise<SaveResult> {
	const client = getS3Client(region, accessKeyId, secretAccessKey);
	const key = s3Key(projectId, type);
	const contentType = type === "pdf" ? "application/pdf" : "image/png";
	const ext = type === "pdf" ? ".pdf" : ".png";
	const fileName = `${projectId}${ext}`;

	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: data,
			ContentType: contentType,
		}),
	);

	return { fileName, url: s3Url(key, bucket, region) };
}

async function deleteS3(
	projectId: string,
	bucket: string,
	region: string,
	accessKeyId: string,
	secretAccessKey: string,
) {
	const client = getS3Client(region, accessKeyId, secretAccessKey);
	await client.send(
		new DeleteObjectsCommand({
			Bucket: bucket,
			Delete: {
				Objects: [
					{ Key: s3Key(projectId, "pdf") },
					{ Key: s3Key(projectId, "thumbnail") },
				],
			},
		}),
	);
}

// --- Public API ---

export async function saveProjectFile(
	projectId: string,
	type: "pdf" | "thumbnail",
	data: Buffer | Uint8Array,
): Promise<SaveResult> {
	const settings = await getSettings();
	if (settings.pdfStorage === "s3") {
		return saveS3(
			projectId, type, data,
			settings.awsS3Bucket, settings.awsS3Region,
			settings.awsAccessKeyId, settings.awsSecretAccessKey,
		);
	}
	return saveLocal(projectId, type, data);
}

export async function deleteProjectFiles(projectId: string) {
	const settings = await getSettings();
	if (settings.pdfStorage === "s3") {
		return deleteS3(
			projectId,
			settings.awsS3Bucket, settings.awsS3Region,
			settings.awsAccessKeyId, settings.awsSecretAccessKey,
		);
	}
	return deleteLocal(projectId);
}

export async function getFileSize(
	projectId: string,
	type: "pdf" | "thumbnail",
): Promise<number> {
	try {
		const settings = await getSettings();
		if (settings.pdfStorage === "s3") {
			const client = getS3Client(
				settings.awsS3Region, settings.awsAccessKeyId, settings.awsSecretAccessKey,
			);
			const res = await client.send(
				new HeadObjectCommand({
					Bucket: settings.awsS3Bucket,
					Key: s3Key(projectId, type),
				}),
			);
			return res.ContentLength ?? 0;
		}
		const dir = type === "pdf" ? PDF_DIR : THUMBNAIL_DIR;
		const ext = type === "pdf" ? ".pdf" : ".png";
		const filePath = path.join(dir, `${projectId}${ext}`);
		const fileStat = await stat(filePath);
		return fileStat.size;
	} catch {
		return 0;
	}
}

export function getFileUrl(project: {
	id: string;
	pdfUrl: string | null;
	localPdfFileName: string | null;
}): string | null {
	if (project.pdfUrl) return project.pdfUrl;
	if (project.localPdfFileName) return `/uploads/pdfs/${project.id}.pdf`;
	return null;
}
