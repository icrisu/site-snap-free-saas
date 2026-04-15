"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import { v4 as uuid } from "uuid";
import { Menu } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const PdfViewer = dynamic(
	() =>
		import("@/components/editor/pdf-viewer").then((mod) => mod.PdfViewer),
	{ ssr: false },
);
import { AnnotationToolbar } from "@/components/editor/annotation-toolbar";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { TextEditorOverlay } from "@/components/editor/text-editor-overlay";
import { exportAnnotatedPdf } from "@/lib/annotations/export-annotations";
import { useAnnotations } from "@/lib/annotations/use-annotations";
import { loadPdf } from "@/lib/pdf-store";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import type { PageDimensions, TextAnnotation } from "@/types/annotations";
import AnnotationsLayers from "./annotation-layers";
import TopToolbar from "@/components/editor/top-toolbar";

const AnnotationCanvas = dynamic(
	() =>
		import("@/components/editor/annotation-canvas").then(
			(mod) => mod.AnnotationCanvas,
		),
	{ ssr: false },
);

export default function EditPageClient({ disableSignupPayments }: { disableSignupPayments?: boolean }) {
	const t = useTranslations("edit");
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
	const ann = useAnnotations();

	useEffect(() => {
		loadPdf()
			.then((data) => {
				if (data) {
					setPdfData(new Uint8Array(data));
				}
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, []);

	const handleLoadSuccess = useCallback((numPages: number) => {
		setTotalPages(numPages);
	}, []);

	const handlePageDimensions = useCallback((dims: PageDimensions) => {
		setCanvasSize({ width: dims.displayWidth, height: dims.displayHeight });
		pageDimsRef.current.set(currentPage - 1, dims);
	}, [currentPage]);

	const handleSave = useCallback(async () => {
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
		a.download = process.env.NEXT_PUBLIC_PDF_DOWNLOAD_FILENAME || "sitesnap-edited.pdf";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [pdfData, ann.annotations]);

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
				ann.dispatch({
					type: "UPDATE",
					annotation: { ...textEdit.editing, text },
				});
			} else {
				const id = uuid();
				ann.dispatch({
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
		[textEdit, currentPage, ann],
	);

	const handleTextCancel = useCallback(() => {
		setTextEdit(null);
	}, []);

	const closeMobileToolbar = useCallback(() => setLeftToolbarOpen(false), []);

	const selectedAnnotation = ann.selectedId
		? ann
				.getPageAnnotations(currentPage - 1)
				.find((a) => a.id === ann.selectedId) ?? null
		: null;

	if (loading) {
		return (
			<div className="flex min-h-screen flex-col">
				<Header disableSignupPayments={disableSignupPayments} />
				<main className="flex-1 flex items-center justify-center">
					<Spinner />
				</main>
				<Footer />
			</div>
		);
	}

	if (!pdfData) {
		return (
			<div className="flex min-h-screen flex-col">
				<Header disableSignupPayments={disableSignupPayments} />
				<main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
					<p className="text-zinc-600 dark:text-zinc-400 text-center">
						{t("noPdf")}
					</p>
					<Link href="/">
						<Button>{t("goHome")}</Button>
					</Link>
				</main>
				<Footer />
			</div>
		);
	}

	return (


		<div className="flex min-h-screen flex-col">
			<Header disableSignupPayments={disableSignupPayments} />

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
                    dispatch={ann.dispatch}
                />

                <AnnotationsLayers
                    annotations={ann.annotations}
                    pageIndex={currentPage - 1}
                    selectedId={ann.selectedId}
                    onSelect={ann.setSelectedId}
                    dispatch={ann.dispatch}
                />
            </div>

            <TopToolbar onDownload={handleSave} />

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
                            dispatch={ann.dispatch}
                            onStartTextEdit={handleStartTextEdit}
                            onEditText={handleEditText}
                            onToolChange={ann.setActiveTool}
                        />
                        {textEdit && (
                            <TextEditorOverlay
                                x={textEdit.x}
                                y={textEdit.y}
                                initialText={textEdit.editing?.text}
                                fontSize={
                                    textEdit.editing?.fontSize ?? ann.fontSize
                                }
                                color={textEdit.editing?.fill ?? ann.fillColor}
                                bold={textEdit.editing?.bold ?? ann.bold}
                                onConfirm={handleTextConfirm}
                                onCancel={handleTextCancel}
                            />
                        )}
                    </div>
                </div>
            </main>

            {!leftToolbarOpen && (
                <button
                    type="button"
                    onClick={() => setLeftToolbarOpen(true)}
                    className="fixed bottom-6 left-4 z-30 rounded-full bg-blue-600 p-3 text-white shadow-lg md:hidden"
                >
                    <Menu className="h-6 w-6" />
                </button>
            )}
        </div>

	);
}