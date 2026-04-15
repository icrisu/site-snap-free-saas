"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/header";
import { Spinner } from "@/components/ui/spinner";
import type { PageDimensions } from "@/types/annotations";
import { deserializeAnnotations, type ProjectData } from "@/lib/projects/serialize";
import { Footer } from "../layout/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PdfViewer = dynamic(
	() => import("@/components/editor/pdf-viewer").then((mod) => mod.PdfViewer),
	{ ssr: false },
);

const AnnotationCanvas = dynamic(
	() =>
		import("@/components/editor/annotation-canvas").then(
			(mod) => mod.AnnotationCanvas,
		),
	{ ssr: false },
);

interface ProjectPreviewProps {
	project: {
		id: string;
		name: string;
		localPdfFileName: string | null;
		pdfUrl: string | null;
		data: ProjectData | null;
	};
	isLoggedInAndProjectOwner?: boolean
}

export default function ProjectPreview({ project, isLoggedInAndProjectOwner }: ProjectPreviewProps) {
	const tProjects = useTranslations("projects");

	const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
	const [, setTotalPages] = useState(0);
	const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 });

	const currentPage = 1;

	const { annotations } = useMemo(
		() => deserializeAnnotations(project.data),
		[project.data],
	);

	const pageAnnotations = useMemo(
		() => annotations.get(currentPage - 1) ?? [],
		[annotations, currentPage],
	);

	const pdfUrl = useMemo(() => {
		return (
			project.pdfUrl ??
			(project.localPdfFileName
				? `/uploads/pdfs/${project.id}.pdf`
				: null)
		);
	}, [project.pdfUrl, project.localPdfFileName, project.id]);

	useEffect(() => {
		// reset old PDF when project changes
		setPdfData(null);

		if (!pdfUrl) return;

		const controller = new AbortController();

		const loadPdf = async () => {
			try {
				const res = await fetch(pdfUrl, { signal: controller.signal });

				if (!res.ok) throw new Error("Failed to load PDF");

				const buf = await res.arrayBuffer();
				setPdfData(new Uint8Array(buf));
			} catch (err: unknown) {
				if (err instanceof Error) {
					if (err.name !== "AbortError") {
					console.error("PDF load error:", err.message);
					}
				} else {
					console.error("Unknown PDF load error:", err);
				}
			}
		};

		loadPdf();

		return () => {
			controller.abort();
		};
	}, [pdfUrl]);

	const handleLoadSuccess = useCallback((numPages: number) => {
		setTotalPages(numPages);
	}, []);

	const handlePageDimensions = useCallback((dims: PageDimensions) => {
		setCanvasSize({
			width: dims.displayWidth,
			height: dims.displayHeight,
		});
	}, []);

	const loading = !!pdfUrl && !pdfData;

	if (loading) {
		return (
			<div className="flex min-h-screen flex-col">
				<Header />
				<main className="flex flex-1 items-center justify-center">
					<Spinner />
				</main>
			</div>
		);
	}

	if (!pdfData) {
		return (
			<div className="flex min-h-screen flex-col">
				<Header />
				<main className="flex flex-1 items-center justify-center">
					<p className="text-zinc-600 dark:text-zinc-400">
						{tProjects("noPdf")}
					</p>
				</main>
			</div>
		);
	}

	const paddingTop = isLoggedInAndProjectOwner ? `pt-20` : 'pt-28';
	return (
		<div className="flex min-h-screen flex-col">
			<Header />

			<main className={`w-full bg-blue-50 ${paddingTop} dark:bg-zinc-900`}>
				{ isLoggedInAndProjectOwner && (
					<div className="flex justify-center pb-6">
						<Link href={`/dashboard/projects/${project.id}`}>
							<Button>{tProjects("editPdf")}</Button>
						</Link>
					</div>
				) }
				<div className="flex justify-center">
					<div className="relative inline-block">
						<PdfViewer
							pdfData={pdfData}
							currentPage={currentPage}
							onLoadSuccess={handleLoadSuccess}
							onPageDimensions={handlePageDimensions}
						/>

						<AnnotationCanvas
							width={canvasSize.width}
							height={canvasSize.height}
							pageIndex={currentPage - 1}
							annotations={pageAnnotations}
							activeTool="select"
							selectedId={null}
							fillColor=""
							strokeColor=""
							strokeWidth={0}
							onSelect={() => { }}
							dispatch={() => { }}
							onStartTextEdit={() => { }}
							onEditText={() => { }}
							onToolChange={() => { }}
						/>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
