import type { Annotation } from "@/types/annotations";

const THUMBNAIL_WIDTH = 600;

interface ThumbnailOptions {
	annotations?: Annotation[];
	displaySize?: { width: number; height: number };
}

export async function generateThumbnail(
	pdfData: Uint8Array,
	options: ThumbnailOptions = {},
): Promise<Blob> {
	const { pdfjs } = await import("react-pdf");
	pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

	const loadingTask = pdfjs.getDocument({ data: pdfData.slice() });
	const pdf = await loadingTask.promise;
	const page = await pdf.getPage(1);

	const viewport = page.getViewport({ scale: 1 });
	const scale = THUMBNAIL_WIDTH / viewport.width;
	const scaledViewport = page.getViewport({ scale });

	const canvas = document.createElement("canvas");
	canvas.width = scaledViewport.width;
	canvas.height = scaledViewport.height;

	const ctx = canvas.getContext("2d")!;

	// Save clean state before pdfjs render — pdfjs may leave transforms,
	// clip regions, or composite operations on the context.
	ctx.save();
	await page.render({ canvasContext: ctx, canvas, viewport: scaledViewport } as Parameters<typeof page.render>[0]).promise;
	ctx.restore();

	const { annotations = [], displaySize } = options;
	if (annotations.length > 0 && displaySize && displaySize.width > 0) {
		const s = scaledViewport.width / displaySize.width;
		drawAnnotations(ctx, annotations, s);
	}

	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error("Failed to generate thumbnail"));
			},
			"image/png",
		);
	});
}

function drawAnnotations(ctx: CanvasRenderingContext2D, annotations: Annotation[], s: number) {
	for (const ann of annotations) {
		ctx.save();
		const rotation = ((ann.rotation ?? 0) * Math.PI) / 180;

		switch (ann.type) {
			case "rect": {
				ctx.translate(ann.x * s, ann.y * s);
				if (rotation) ctx.rotate(rotation);
				ctx.fillStyle = ann.fill;
				ctx.fillRect(0, 0, ann.width * s, ann.height * s);
				ctx.strokeStyle = ann.stroke;
				ctx.lineWidth = ann.strokeWidth * s;
				ctx.strokeRect(0, 0, ann.width * s, ann.height * s);
				break;
			}
			case "ellipse": {
				ctx.translate(ann.x * s, ann.y * s);
				if (rotation) ctx.rotate(rotation);
				ctx.beginPath();
				ctx.ellipse(0, 0, ann.radiusX * s, ann.radiusY * s, 0, 0, Math.PI * 2);
				ctx.fillStyle = ann.fill;
				ctx.fill();
				ctx.strokeStyle = ann.stroke;
				ctx.lineWidth = ann.strokeWidth * s;
				ctx.stroke();
				break;
			}
			case "arrow": {
				ctx.translate(ann.x * s, ann.y * s);
				if (rotation) ctx.rotate(rotation);
				const pts = ann.points;
				const x1 = pts[0] * s;
				const y1 = pts[1] * s;
				const x2 = pts[2] * s;
				const y2 = pts[3] * s;
				ctx.strokeStyle = ann.stroke;
				ctx.lineWidth = ann.strokeWidth * s;
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
				// arrowhead
				const angle = Math.atan2(y2 - y1, x2 - x1);
				const headLen = 10 * s;
				ctx.fillStyle = ann.stroke;
				ctx.beginPath();
				ctx.moveTo(x2, y2);
				ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
				ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
				ctx.closePath();
				ctx.fill();
				break;
			}
			case "draw": {
				ctx.translate(ann.x * s, ann.y * s);
				if (rotation) ctx.rotate(rotation);
				ctx.strokeStyle = ann.stroke;
				ctx.lineWidth = ann.strokeWidth * s;
				ctx.lineCap = "round";
				ctx.lineJoin = "round";
				const dp = ann.points;
				if (dp.length >= 2) {
					ctx.beginPath();
					ctx.moveTo(dp[0] * s, dp[1] * s);
					for (let i = 2; i < dp.length; i += 2) {
						ctx.lineTo(dp[i] * s, dp[i + 1] * s);
					}
					ctx.stroke();
				}
				break;
			}
			case "text": {
				ctx.translate(ann.x * s, ann.y * s);
				if (rotation) ctx.rotate(rotation);
				const fontSize = ann.fontSize * s;
				ctx.font = `${ann.bold ? "bold " : ""}${fontSize}px sans-serif`;
				ctx.fillStyle = ann.fill;
				ctx.textBaseline = "top";
				ctx.fillText(ann.text, 0, 0);
				break;
			}
		}

		ctx.restore();
	}
}
