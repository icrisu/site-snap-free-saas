"use client";

import { useTranslations } from "next-intl";
import type { Annotation, AnnotationAction } from "@/types/annotations";
import {
	COLOR_PRESETS,
	STROKE_WIDTH_OPTIONS,
	FONT_SIZE_OPTIONS,
} from "@/lib/annotations/constants";

interface PropertiesPanelProps {
	selectedAnnotation: Annotation | null;
	fillColor: string;
	strokeColor: string;
	strokeWidth: number;
	fontSize: number;
	bold: boolean;
	onFillColorChange: (color: string) => void;
	onStrokeColorChange: (color: string) => void;
	onStrokeWidthChange: (width: number) => void;
	onFontSizeChange: (size: number) => void;
	onBoldChange: (bold: boolean) => void;
	dispatch: (action: AnnotationAction) => void;
}

function ColorPicker({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (color: string) => void;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
				{label}
			</label>
			<div className="flex items-center gap-1.5">
				<input
					type="color"
					value={value.slice(0, 7)}
					onChange={(e) => onChange(e.target.value)}
					className="h-7 w-7 cursor-pointer rounded border border-zinc-300 p-0.5 dark:border-zinc-600"
				/>
				<div className="flex gap-0.5">
					{COLOR_PRESETS.map((color) => (
						<button
							key={color}
							type="button"
							onClick={() => onChange(color)}
							className={`h-5 w-5 rounded-sm border ${
								value.slice(0, 7) === color
									? "border-blue-500 ring-1 ring-blue-500"
									: "border-zinc-300 dark:border-zinc-600"
							}`}
							style={{ backgroundColor: color }}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

export function PropertiesPanel({
	selectedAnnotation,
	fillColor,
	strokeColor,
	strokeWidth,
	fontSize,
	bold,
	onFillColorChange,
	onStrokeColorChange,
	onStrokeWidthChange,
	onFontSizeChange,
	onBoldChange,
	dispatch,
}: PropertiesPanelProps) {
	const t = useTranslations("edit");
	const ann = selectedAnnotation;

	if (!ann) {
		return;
	}

	const updateAnnotation = (updates: Partial<Annotation>) => {
		if (!ann) return;
		dispatch({ type: "UPDATE", annotation: { ...ann, ...updates } as Annotation });
	};

	const showFill = !ann || ann.type === "text" || ann.type === "rect" || ann.type === "ellipse";
	const showStroke = !ann || ann.type !== "text";
	const showStrokeWidth = !ann || ann.type !== "text";
	const showFontSize = !ann || ann.type === "text";

	const currentFill = ann
		? ann.type === "text"
			? ann.fill
			: ann.type === "rect" || ann.type === "ellipse"
				? ann.fill.slice(0, 7)
				: fillColor
		: fillColor;

	const currentStroke = ann
		? "stroke" in ann
			? ann.stroke
			: strokeColor
		: strokeColor;

	const currentStrokeWidth = ann
		? "strokeWidth" in ann
			? ann.strokeWidth
			: strokeWidth
		: strokeWidth;

	const currentFontSize = ann?.type === "text" ? ann.fontSize : fontSize;
	const currentBold = ann?.type === "text" ? ann.bold : bold;

	return (
		<div className="flex flex-wrap items-end gap-4 bg-white p-3 dark:bg-zinc-900">
			{showFill && (
				<ColorPicker
					label={t("properties.fillColor")}
					value={currentFill}
					onChange={(color) => {
						onFillColorChange(color);
						if (ann) {
							if (ann.type === "text") {
								updateAnnotation({ fill: color });
							} else if (ann.type === "rect" || ann.type === "ellipse") {
								updateAnnotation({ fill: color + "33" });
							}
						}
					}}
				/>
			)}

			{showStroke && (
				<ColorPicker
					label={t("properties.strokeColor")}
					value={currentStroke}
					onChange={(color) => {
						onStrokeColorChange(color);
						if (ann && "stroke" in ann) {
							updateAnnotation({ stroke: color });
						}
					}}
				/>
			)}

			{showStrokeWidth && (
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
						{t("properties.strokeWidth")}
					</label>
					<select
						value={currentStrokeWidth}
						onChange={(e) => {
							const w = Number(e.target.value);
							onStrokeWidthChange(w);
							if (ann && "strokeWidth" in ann) {
								updateAnnotation({ strokeWidth: w });
							}
						}}
						className="h-8 rounded border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
					>
						{STROKE_WIDTH_OPTIONS.map((w) => (
							<option key={w} value={w}>
								{w}px
							</option>
						))}
					</select>
				</div>
			)}

			{showFontSize && (
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
						{t("properties.fontSize")}
					</label>
					<select
						value={currentFontSize}
						onChange={(e) => {
							const s = Number(e.target.value);
							onFontSizeChange(s);
							if (ann?.type === "text") {
								updateAnnotation({ fontSize: s });
							}
						}}
						className="h-8 rounded border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
					>
						{FONT_SIZE_OPTIONS.map((s) => (
							<option key={s} value={s}>
								{s}px
							</option>
						))}
					</select>
				</div>
			)}

			{showFontSize && (
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
						{t("properties.bold")}
					</label>
					<button
						type="button"
						onClick={() => {
							const next = !currentBold;
							onBoldChange(next);
							if (ann?.type === "text") {
								updateAnnotation({ bold: next });
							}
						}}
						className={`inline-flex h-8 w-8 items-center justify-center rounded border text-sm font-bold ${
							currentBold
								? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
								: "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
						}`}
						title={t("properties.bold")}
					>
						B
					</button>
				</div>
			)}
		</div>
	);
}
