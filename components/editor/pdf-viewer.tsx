"use client";

import { useState, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import type { PageDimensions } from "@/types/annotations";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
	pdfData: Uint8Array;
	currentPage: number;
	onLoadSuccess: (numPages: number) => void;
	onPageDimensions?: (dims: PageDimensions) => void;
}

export function PdfViewer({
	pdfData,
	currentPage,
	onLoadSuccess,
	onPageDimensions,
}: PdfViewerProps) {
	const [, setLoading] = useState(true);

	const fileRef = useRef<{ data: Uint8Array } | null>(null);
	const prevPdfDataRef = useRef<Uint8Array | null>(null);
	if (prevPdfDataRef.current !== pdfData) {
		prevPdfDataRef.current = pdfData;
		fileRef.current = { data: new Uint8Array(pdfData) };
	}
	const file = fileRef.current!;

	const handleLoadSuccess = useCallback(
		({ numPages }: { numPages: number }) => {
			setLoading(false);
			onLoadSuccess(numPages);
		},
		[onLoadSuccess],
	);

	const handleRenderSuccess = useCallback(
		(page: {
			width: number;
			height: number;
			originalWidth: number;
			originalHeight: number;
		}) => {
			onPageDimensions?.({
				displayWidth: page.width,
				displayHeight: page.height,
				pdfWidth: page.originalWidth,
				pdfHeight: page.originalHeight,
			});
		},
		[onPageDimensions],
	);

	return (
		<Document
			file={file}
			onLoadSuccess={handleLoadSuccess}
			loading={
				<div className="flex items-center justify-center h-[600px]">
					<div className="animate-spin h-8 w-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full" />
				</div>
			}
		>
			<Page
				pageNumber={currentPage}
				width={900}
				renderTextLayer={false}
				renderAnnotationLayer={false}
				onRenderSuccess={handleRenderSuccess}
			/>
		</Document>
	);
}