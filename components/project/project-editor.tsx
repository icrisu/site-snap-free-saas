"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { v4 as uuid } from "uuid";
import { Header } from "@/components/layout/header";
import { AnnotationToolbar } from "@/components/editor/annotation-toolbar";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { TextEditorOverlay } from "@/components/editor/text-editor-overlay";
import { useAnnotations } from "@/lib/annotations/use-annotations";
import { Menu } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Toast } from "@/components/ui/toast";
import type { PageDimensions, TextAnnotation } from "@/types/annotations";
import AnnotationsLayers from "@/components/editor/annotation-layers";
import TopToolbar from "@/components/editor/top-toolbar";
import { exportAnnotatedPdf } from "@/lib/annotations/export-annotations";
import { deserializeAnnotations, serializeAnnotations, type ProjectData } from "@/lib/projects/serialize";
import Link from "next/link";

const PdfViewer = dynamic(
	() => import("@/components/editor/pdf-viewer").then((mod) => mod.PdfViewer),
	{ ssr: false },
);

const AnnotationCanvas = dynamic(
	() => import("@/components/editor/annotation-canvas").then((mod) => mod.AnnotationCanvas),
	{ ssr: false },
);

interface ProjectEditorProps {
	project: {
		id: string;
		name: string;
		sourceUrl: string | null;
		localPdfFileName: string | null;
		pdfUrl: string | null;
		data: ProjectData | null;
	};
}

// TBD - implement OpenAI, AI - anlyze website PDF look and feel, suggest options
export default function ProjectEditor({ project }: ProjectEditorProps) {
	const tProjects = useTranslations("projects");
	const tBreadcrumbs = useTranslations("breadcrumbs");
	const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
	const [loading, setLoading] = useState(true);
	const [, setTotalPages] = useState(0);
	const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 });
	const pageDimsRef = useRef<Map<number, PageDimensions>>(new Map());
	const currentPage = 1;
	const [textEdit, setTextEdit] = useState<{
		x: number;
		y: number;
		editing?: TextAnnotation;
	} | null>(null);
	const [leftToolbarOpen, setLeftToolbarOpen] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [, setHasSaved] = useState(false);
	const [showToast, setShowToast] = useState(false);
	const changeCountRef = useRef(0);

	const initial = useMemo(() => deserializeAnnotations(project.data), [project.data]);

	const ann = useAnnotations(initial.annotations);

	// Initialize pageDimensions from project data
	useEffect(() => {
		if (initial.pageDimensions.size > 0) {
			pageDimsRef.current = initial.pageDimensions;
		}
	}, [initial.pageDimensions]);

	// Track dirty state by counting dispatches
	const originalDispatch = ann.dispatch;
	const wrappedDispatch = useCallback(
		(action: Parameters<typeof originalDispatch>[0]) => {
			changeCountRef.current++;
			setIsDirty(true);
			originalDispatch(action);
		},
		[originalDispatch],
	);

	useEffect(() => {
		const url = project.pdfUrl ?? (project.localPdfFileName ? `/uploads/pdfs/${project.id}.pdf` : null);
		if (!url) {
			setLoading(false);
			return;
		}
		fetch(url)
			.then((res) => {
				if (!res.ok) throw new Error("Failed to load PDF");
				return res.arrayBuffer();
			})
			.then((buf) => setPdfData(new Uint8Array(buf)))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [project.pdfUrl, project.localPdfFileName, project.id]);

	const handleLoadSuccess = useCallback((numPages: number) => {
		setTotalPages(numPages);
	}, []);

	const handlePageDimensions = useCallback((dims: PageDimensions) => {
		setCanvasSize({ width: dims.displayWidth, height: dims.displayHeight });
		pageDimsRef.current.set(currentPage - 1, dims);
	}, [currentPage]);

	const handleSave = useCallback(async () => {
		if (!pdfData) return;
		setIsSaving(true);

		try {
			const serialized = serializeAnnotations(ann.annotations, pageDimsRef.current);
			const { generateThumbnail } = await import("@/lib/projects/thumbnail");
			const thumbnailBlob = await generateThumbnail(pdfData, {
				annotations: ann.getPageAnnotations(currentPage - 1),
				displaySize: canvasSize,
			});

			const formData = new FormData();
			formData.append("annotations", JSON.stringify(serialized));
			formData.append("thumbnail", thumbnailBlob, "thumbnail.png");

			const res = await fetch(`/api/projects/${project.id}`, {
				method: "PUT",
				body: formData,
			});

			if (res.ok) {
				setIsDirty(false);
				setHasSaved(true);
				setShowToast(true);
			}
		} catch (err) {
			console.error("Save failed:", err);
		} finally {
			setIsSaving(false);
		}
	}, [pdfData, ann, canvasSize, currentPage, project.id]);

	const handleDownload = useCallback(async () => {
		if (!pdfData) return;
		const exportedPdf = await exportAnnotatedPdf(
			pdfData,
			ann.annotations,
			pageDimsRef.current,
		);
		const blob = new Blob([new Uint8Array(exportedPdf)], {
			type: "application/pdf",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		const filename = project.name ? `${project.name}.pdf` : process.env.NEXT_PUBLIC_PDF_DOWNLOAD_FILENAME || 'sitesnap-edited.pdf';
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [pdfData, ann.annotations, project.name]);

	const handleShare = useCallback(() => {
		window.open(`/projects/${project.id}`, "_blank");
	}, [project.id]);

	const handleStartTextEdit = useCallback((x: number, y: number) => {
		setTextEdit({ x, y });
	}, []);

	const handleEditText = useCallback((annotation: TextAnnotation) => {
		ann.setSelectedId(annotation.id);
		setTextEdit({ x: annotation.x, y: annotation.y, editing: annotation });
	}, [ann]);

	const handleTextConfirm = useCallback(
		(text: string) => {
			if (!textEdit) return;
			if (textEdit.editing) {
				wrappedDispatch({
					type: "UPDATE",
					annotation: { ...textEdit.editing, text },
				});
			} else {
				const id = uuid();
				wrappedDispatch({
					type: "ADD",
					annotation: {
						id,
						type: "text",
						pageIndex: currentPage - 1,
						x: textEdit.x,
						y: textEdit.y,
						text,
						fontSize: ann.fontSize,
						fill: ann.fillColor,
						bold: ann.bold,
					},
				});
				ann.setSelectedId(id);
				ann.setActiveTool("select");
			}
			setTextEdit(null);
		},
		[textEdit, currentPage, ann, wrappedDispatch],
	);

	const handleTextCancel = useCallback(() => {
		setTextEdit(null);
	}, []);

	const closeMobileToolbar = useCallback(() => setLeftToolbarOpen(false), []);

	const selectedAnnotation = ann.selectedId
		? ann.getPageAnnotations(currentPage - 1).find((a) => a.id === ann.selectedId) ?? null
		: null;

	if (loading) {
		return (
			<div className="flex min-h-screen flex-col">
				<Header />
				<main className="flex-1 flex items-center justify-center">
					<Spinner />
				</main>
			</div>
		);
	}

	if (!pdfData) {
		return (
			<div className="flex min-h-screen flex-col">
				<Header />
				<main className="flex-1 flex items-center justify-center">
					<p className="text-zinc-600 dark:text-zinc-400">{tProjects("noPdf")}</p>
				</main>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col">
			<Header breadcrumbs={
				<Link className="underline font-semibold text-zinc-600" href="/dashboard">{tBreadcrumbs('dashboard')}</Link>
			} />
			{leftToolbarOpen && (
				<div
					onClick={() => setLeftToolbarOpen(false)}
					className="fixed inset-0 z-18 bg-black/50 md:hidden"
				/>
			)}
			<div className={`fixed left-0 w-[300px] md:w-1/5 overflow-y-auto bg-white dark:bg-zinc-900 h-screen pt-18 z-20 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-200 ${leftToolbarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
				<AnnotationToolbar
					activeTool={ann.activeTool}
					onToolChange={(tool) => { ann.setActiveTool(tool); closeMobileToolbar(); }}
					onUndo={ann.undo}
					onRedo={ann.redo}
					canUndo={ann.canUndo}
					canRedo={ann.canRedo}
				/>

				<div className="px-3"><hr className="border-zinc-300 dark:border-zinc-600" /></div>

				<PropertiesPanel
					selectedAnnotation={selectedAnnotation}
					fillColor={ann.fillColor}
					strokeColor={ann.strokeColor}
					strokeWidth={ann.strokeWidth}
					fontSize={ann.fontSize}
					bold={ann.bold}
					onFillColorChange={(c) => { ann.setFillColor(c); closeMobileToolbar(); }}
					onStrokeColorChange={(c) => { ann.setStrokeColor(c); closeMobileToolbar(); }}
					onStrokeWidthChange={(w) => { ann.setStrokeWidth(w); closeMobileToolbar(); }}
					onFontSizeChange={(s) => { ann.setFontSize(s); closeMobileToolbar(); }}
					onBoldChange={(b) => { ann.setBold(b); closeMobileToolbar(); }}
					dispatch={wrappedDispatch}
				/>

				<AnnotationsLayers
					annotations={ann.annotations}
					pageIndex={currentPage - 1}
					selectedId={ann.selectedId}
					onSelect={ann.setSelectedId}
					dispatch={wrappedDispatch}
				/>
			</div>

			<TopToolbar
				onSave={handleSave}
				onShare={handleShare}
				onDownload={handleDownload}
				isSaving={isSaving}
				isSaveEnabled={isDirty}
				isShareEnabled
			/>

			<main className="w-full bg-blue-50 dark:bg-zinc-900 pt-32 md:pl-[20%]">
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
							annotations={ann.getPageAnnotations(currentPage - 1)}
							activeTool={ann.activeTool}
							selectedId={ann.selectedId}
							fillColor={ann.fillColor}
							strokeColor={ann.strokeColor}
							strokeWidth={ann.strokeWidth}
							onSelect={ann.setSelectedId}
							dispatch={wrappedDispatch}
							onStartTextEdit={handleStartTextEdit}
							onEditText={handleEditText}
							onToolChange={ann.setActiveTool}
						/>
						{textEdit && (
							<TextEditorOverlay
								x={textEdit.x}
								y={textEdit.y}
								initialText={textEdit.editing?.text}
								fontSize={textEdit.editing?.fontSize ?? ann.fontSize}
								color={textEdit.editing?.fill ?? ann.fillColor}
								bold={textEdit.editing?.bold ?? ann.bold}
								onConfirm={handleTextConfirm}
								onCancel={handleTextCancel}
							/>
						)}
					</div>
				</div>
			</main>
			{showToast && (
				<Toast
					message={tProjects("savedSuccessfully")}
					onClose={() => setShowToast(false)}
				/>
			)}
			{!leftToolbarOpen && (
				<button
					onClick={() => setLeftToolbarOpen(true)}
					className="fixed bottom-10 start-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 md:hidden"
					aria-label="Open toolbar"
				>
					<Menu className="h-5 w-5" />
				</button>
			)}
		</div>
	);
}
