"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ToolType } from "@/types/annotations";

interface AnnotationToolbarProps {
	activeTool: ToolType;
	onToolChange: (tool: ToolType) => void;
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
}

const tools: { tool: ToolType; icon: React.ReactNode }[] = [
	{
		tool: "select",
		icon: (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path d="M3 2l4 12 2-5 5-2L3 2z" />
			</svg>
		),
	},
	{
		tool: "text",
		icon: (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path d="M3 3h10M8 3v10M6 13h4" />
			</svg>
		),
	},
	{
		tool: "rect",
		icon: (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
				<rect x="2" y="3" width="12" height="10" rx="1" />
			</svg>
		),
	},
	{
		tool: "ellipse",
		icon: (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
				<ellipse cx="8" cy="8" rx="6" ry="5" />
			</svg>
		),
	},
	{
		tool: "arrow",
		icon: (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path d="M3 13L13 3M13 3H7M13 3v6" />
			</svg>
		),
	},
	{
		tool: "draw",
		icon: (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
				<path d="M2 13c2-3 4-5 6-3s4-4 6-5" strokeLinecap="round" />
			</svg>
		),
	},
];

export function AnnotationToolbar({
	activeTool,
	onToolChange,
	onUndo,
	onRedo,
	canUndo,
	canRedo
}: AnnotationToolbarProps) {
	const t = useTranslations("edit");

	return (
		<div className="flex flex-col gap-2 bg-white p-3 dark:bg-zinc-900">
			<div className="flex flex-wrap items-center gap-1">
				{tools.map(({ tool, icon }) => (
					<Button
						key={tool}
						variant="ghost"
						onClick={() => onToolChange(tool)}
						className={`gap-1.5 px-2.5 ${activeTool === tool ? "bg-zinc-200 dark:bg-zinc-700" : ""}`}
						title={t(`tools.${tool}`)}
					>
						{icon}
						<span className="hidden sm:inline text-xs">{t(`tools.${tool}`)}</span>
					</Button>
				))}
			</div>			

			<div>
				<Button
					variant="ghost"
					onClick={onUndo}
					disabled={!canUndo}
					title={t("undo")}
					className="px-2.5"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
						<path d="M4 6h6a3 3 0 010 6H7M4 6l3-3M4 6l3 3" />
					</svg>
				</Button>
				<Button
					variant="ghost"
					onClick={onRedo}
					disabled={!canRedo}
					title={t("redo")}
					className="px-2.5"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
						<path d="M12 6H6a3 3 0 000 6h3M12 6l-3-3M12 6l-3 3" />
					</svg>
				</Button>
			</div>

		</div>
	);
}
