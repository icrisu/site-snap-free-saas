import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import type { Annotation, PageDimensions } from "@/types/annotations";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const clean = hex.replace("#", "").slice(0, 6);
	const num = parseInt(clean, 16);
	return {
		r: ((num >> 16) & 255) / 255,
		g: ((num >> 8) & 255) / 255,
		b: (num & 255) / 255,
	};
}

export async function exportAnnotatedPdf(
	pdfBytes: Uint8Array,
	annotations: Map<number, Annotation[]>,
	pageDimensions: Map<number, PageDimensions>,
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.load(pdfBytes);
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
	const pages = pdfDoc.getPages();

	for (const [pageIndex, pageAnns] of annotations) {
		if (pageIndex >= pages.length) continue;
		const page = pages[pageIndex];
		const dims = pageDimensions.get(pageIndex);
		if (!dims) continue;

		const scale = dims.pdfWidth / dims.displayWidth;
		const pdfPageHeight = dims.pdfHeight;

		for (const ann of pageAnns) {
			switch (ann.type) {
				case "text": {
					const c = hexToRgb(ann.fill);
					const pdfX = ann.x * scale;
					const pdfY = pdfPageHeight - ann.y * scale - ann.fontSize * scale;
					page.drawText(ann.text, {
						x: pdfX,
						y: pdfY,
						size: ann.fontSize * scale,
						font: ann.bold ? fontBold : font,
						color: rgb(c.r, c.g, c.b),
						rotate: degrees(-(ann.rotation ?? 0)),
					});
					break;
				}
				case "rect": {
					const fc = hexToRgb(ann.fill);
					const sc = hexToRgb(ann.stroke);
					const pdfX = ann.x * scale;
					const pdfY = pdfPageHeight - (ann.y + ann.height) * scale;
					page.drawRectangle({
						x: pdfX,
						y: pdfY,
						width: ann.width * scale,
						height: ann.height * scale,
						color: rgb(fc.r, fc.g, fc.b),
						opacity: 0.2,
						borderColor: rgb(sc.r, sc.g, sc.b),
						borderWidth: ann.strokeWidth * scale,
						rotate: degrees(-(ann.rotation ?? 0)),
					});
					break;
				}
				case "ellipse": {
					const fc = hexToRgb(ann.fill);
					const sc = hexToRgb(ann.stroke);
					const pdfX = ann.x * scale;
					const pdfY = pdfPageHeight - ann.y * scale;
					page.drawEllipse({
						x: pdfX,
						y: pdfY,
						xScale: ann.radiusX * scale,
						yScale: ann.radiusY * scale,
						color: rgb(fc.r, fc.g, fc.b),
						opacity: 0.2,
						borderColor: rgb(sc.r, sc.g, sc.b),
						borderWidth: ann.strokeWidth * scale,
						rotate: degrees(-(ann.rotation ?? 0)),
					});
					break;
				}
				case "arrow": {
					const sc = hexToRgb(ann.stroke);
					const x1 = (ann.x + ann.points[0]) * scale;
					const y1 = pdfPageHeight - (ann.y + ann.points[1]) * scale;
					const x2 = (ann.x + ann.points[2]) * scale;
					const y2 = pdfPageHeight - (ann.y + ann.points[3]) * scale;
					const color = rgb(sc.r, sc.g, sc.b);
					const sw = ann.strokeWidth * scale;

					// Main line
					page.drawLine({
						start: { x: x1, y: y1 },
						end: { x: x2, y: y2 },
						color,
						thickness: sw,
					});

					// Arrowhead
					const angle = Math.atan2(y2 - y1, x2 - x1);
					const headLen = 10 * scale;
					const headAngle = Math.PI / 6;

					page.drawLine({
						start: { x: x2, y: y2 },
						end: {
							x: x2 - headLen * Math.cos(angle - headAngle),
							y: y2 - headLen * Math.sin(angle - headAngle),
						},
						color,
						thickness: sw,
					});
					page.drawLine({
						start: { x: x2, y: y2 },
						end: {
							x: x2 - headLen * Math.cos(angle + headAngle),
							y: y2 - headLen * Math.sin(angle + headAngle),
						},
						color,
						thickness: sw,
					});
					break;
				}
				case "draw": {
					const sc = hexToRgb(ann.stroke);
					const color = rgb(sc.r, sc.g, sc.b);
					const sw = ann.strokeWidth * scale;
					const pts = ann.points;

					for (let i = 0; i < pts.length - 2; i += 2) {
						const x1 = (ann.x + pts[i]) * scale;
						const y1 = pdfPageHeight - (ann.y + pts[i + 1]) * scale;
						const x2 = (ann.x + pts[i + 2]) * scale;
						const y2 = pdfPageHeight - (ann.y + pts[i + 3]) * scale;
						page.drawLine({
							start: { x: x1, y: y1 },
							end: { x: x2, y: y2 },
							color,
							thickness: sw,
						});
					}
					break;
				}
			}
		}
	}

	return pdfDoc.save();
}
