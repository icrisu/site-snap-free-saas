"use client";

import { useState, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuid } from "uuid";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import type { Annotation, AnnotationAction } from "@/types/annotations";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AnnotationMap = Map<number, Annotation[]>;

interface AnnotationsLayersProps {
	annotations: AnnotationMap;
	pageIndex: number;
	selectedId: string | null;
	onSelect: (id: string | null) => void;
	dispatch: (action: AnnotationAction) => void;
}

const TYPE_TOOL_KEYS: Record<Annotation["type"], string> = {
	rect: "rect",
	ellipse: "ellipse",
	arrow: "arrow",
	draw: "draw",
	text: "text",
};

function getLayerNames(
	annotations: Annotation[],
	toolLabel: (key: string) => string,
) {
	const counters: Record<string, number> = {};
	return annotations.map((ann) => {
		counters[ann.type] = (counters[ann.type] ?? 0) + 1;
		return `${toolLabel(TYPE_TOOL_KEYS[ann.type])} ${counters[ann.type]}`;
	});
}

const AnnotationsLayers = ({
	annotations,
	pageIndex,
	selectedId,
	onSelect,
	dispatch,
}: AnnotationsLayersProps) => {
	const t = useTranslations("edit");

	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const dragIndexRef = useRef<number | null>(null);
	const [dropIndex, setDropIndex] = useState<number | null>(null);

	const pageAnnotations = useMemo(
		() => annotations.get(pageIndex) ?? [],
		[annotations, pageIndex],
	);

	// React Compiler-safe memoization
	const layerNames = useMemo(() => {
		const toolLabel = (key: string) =>
			t(`tools.${key}` as Parameters<typeof t>[0]);

		return getLayerNames(pageAnnotations, toolLabel);
	}, [pageAnnotations, t]);

	// Display in reverse order (top layer first)
	const displayItems = useMemo(() => {
		return pageAnnotations
			.map((ann, i) => ({
				ann,
				name: layerNames[i],
				originalIndex: i,
			}))
			.reverse();
	}, [pageAnnotations, layerNames]);

	function handleDragStart(displayIdx: number) {
		dragIndexRef.current = displayIdx;
	}

	function handleDragOver(e: React.DragEvent, displayIdx: number) {
		e.preventDefault();
		setDropIndex(displayIdx);
	}

	function handleDragLeave() {
		setDropIndex(null);
	}

	function handleDrop(displayIdx: number) {
		const fromDisplay = dragIndexRef.current;

		if (fromDisplay === null || fromDisplay === displayIdx) {
			dragIndexRef.current = null;
			setDropIndex(null);
			return;
		}

		const reordered = [...displayItems];
		const [moved] = reordered.splice(fromDisplay, 1);
		reordered.splice(displayIdx, 0, moved);

		const newIds = reordered.map((item) => item.ann.id).reverse();

		dispatch({ type: "REORDER", pageIndex, annotationIds: newIds });

		dragIndexRef.current = null;
		setDropIndex(null);
	}

	function handleDragEnd() {
		dragIndexRef.current = null;
		setDropIndex(null);
	}

	function handleClone(ann: Annotation) {
		const clone: Annotation = {
			...ann,
			id: uuid(),
			x: ann.x + 10,
			y: ann.y + 10,
		};

		dispatch({ type: "ADD", annotation: clone });
		onSelect(clone.id);
	}

	function handleConfirmDelete() {
		if (!deleteTarget) return;

		dispatch({
			type: "DELETE",
			id: deleteTarget.id,
			pageIndex,
		});

		if (selectedId === deleteTarget.id) {
			onSelect(null);
		}

		setDeleteTarget(null);
	}

	if (pageAnnotations.length === 0) {
		return (
			<div className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500">
				{t("layers.noLayers")}
			</div>
		);
	}

	return (
		<>
			<div className="px-2 py-1">
				<div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1 py-1">
					{t("layers.title")}
				</div>

				<div className="space-y-px">
					{displayItems.map((item, displayIdx) => (
						<div
							key={item.ann.id}
							draggable
							onDragStart={() => handleDragStart(displayIdx)}
							onDragOver={(e) => handleDragOver(e, displayIdx)}
							onDragLeave={handleDragLeave}
							onDrop={() => handleDrop(displayIdx)}
							onDragEnd={handleDragEnd}
							onClick={() => onSelect(item.ann.id)}
							className={`flex items-center gap-1 px-1 py-1 rounded text-sm cursor-pointer select-none transition-colors ${
								item.ann.id === selectedId
									? "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100"
									: "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
							} ${
								dropIndex === displayIdx
									? "ring-2 ring-blue-400"
									: ""
							}`}
						>
							<span className="cursor-grab active:cursor-grabbing text-zinc-400 dark:text-zinc-500">
								<GripVertical className="size-4" />
							</span>

							<span className="flex-1 truncate text-xs">
								{item.name}
							</span>

							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									handleClone(item.ann);
								}}
								className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
							>
								<Copy className="size-3.5" />
							</button>

							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setDeleteTarget({
										id: item.ann.id,
										name: item.name,
									});
								}}
								className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
							>
								<Trash2 className="size-3.5" />
							</button>
						</div>
					))}
				</div>
			</div>

			<AlertDialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
			>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("layers.deleteTitle", {
								name: deleteTarget?.name ?? "",
							})}
						</AlertDialogTitle>

						<AlertDialogDescription>
							{t("layers.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("cancel")}
						</AlertDialogCancel>

						<AlertDialogAction
							variant="destructive"
							onClick={handleConfirmDelete}
						>
							{t("layers.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default AnnotationsLayers;
