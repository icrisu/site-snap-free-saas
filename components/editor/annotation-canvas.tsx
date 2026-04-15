"use client";

import { useRef, useCallback, useEffect } from "react";
import { Stage, Layer, Rect, Ellipse, Arrow, Line, Text, Transformer } from "react-konva";
import { v4 as uuid } from "uuid";
import type Konva from "konva";
import type {
	Annotation,
	AnnotationAction,
	ToolType,
	TextAnnotation,
	RectAnnotation,
	EllipseAnnotation,
	ArrowAnnotation,
	DrawAnnotation,
} from "@/types/annotations";
import { DEFAULT_FILL_ALPHA, MIN_SHAPE_SIZE } from "@/lib/annotations/constants";

const ROTATE_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>') 12 12, auto`;

interface AnnotationCanvasProps {
	width: number;
	height: number;
	pageIndex: number;
	annotations: Annotation[];
	activeTool: ToolType;
	selectedId: string | null;
	fillColor: string;
	strokeColor: string;
	strokeWidth: number;
	onSelect: (id: string | null) => void;
	dispatch: (action: AnnotationAction) => void;
	onStartTextEdit: (x: number, y: number) => void;
	onEditText: (annotation: TextAnnotation) => void;
	onToolChange: (tool: ToolType) => void;
}

export function AnnotationCanvas({
	width,
	height,
	pageIndex,
	annotations,
	activeTool,
	selectedId,
	fillColor,
	strokeColor,
	strokeWidth,
	onSelect,
	dispatch,
	onStartTextEdit,
	onEditText,
	onToolChange,
}: AnnotationCanvasProps) {
	const stageRef = useRef<Konva.Stage>(null);
	const transformerRef = useRef<Konva.Transformer>(null);
	const drawingRef = useRef<{
		startX: number;
		startY: number;
		points?: number[];
		isDrawing: boolean;
	} | null>(null);
	const tempShapeRef = useRef<Annotation | null>(null);

	// Attach transformer to selected node
	useEffect(() => {
		const tr = transformerRef.current;
		if (!tr) return;
		const stage = stageRef.current;
		if (!stage) return;

		if (selectedId && activeTool === "select") {
			const node = stage.findOne(`#${selectedId}`);
			if (node) {
				tr.nodes([node]);
				tr.getLayer()?.batchDraw();

				// Add rotate cursor to the rotation anchor
				const rotater = tr.findOne(".rotater") as Konva.Shape | undefined;
				const container = stage.container();
				if (rotater) {
					const onEnter = () => { container.style.cursor = ROTATE_CURSOR; };
					const onLeave = () => { container.style.cursor = "default"; };
					rotater.on("mouseenter", onEnter);
					rotater.on("mouseleave", onLeave);
					return () => {
						rotater.off("mouseenter", onEnter);
						rotater.off("mouseleave", onLeave);
					};
				}
				return;
			}
		}
		tr.nodes([]);
		tr.getLayer()?.batchDraw();
	}, [selectedId, activeTool, annotations]);

	const handleStageMouseDown = useCallback(
		(e: Konva.KonvaEventObject<MouseEvent>) => {
			const stage = e.target.getStage();
			if (!stage) return;
			const pos = stage.getPointerPosition();
			if (!pos) return;

			if (activeTool === "select") {
				if (e.target === stage) {
					onSelect(null);
				}
				return;
			}

			if (activeTool === "text") {
				if (e.target === stage) {
					e.evt.preventDefault();
					onStartTextEdit(pos.x, pos.y);
				}
				return;
			}

			drawingRef.current = {
				startX: pos.x,
				startY: pos.y,
				isDrawing: true,
				points: activeTool === "draw" ? [pos.x, pos.y] : undefined,
			};

			if (activeTool === "draw") {
				const ann: DrawAnnotation = {
					id: uuid(),
					type: "draw",
					pageIndex,
					x: 0,
					y: 0,
					points: [pos.x, pos.y],
					stroke: strokeColor,
					strokeWidth,
				};
				tempShapeRef.current = ann;
				dispatch({ type: "ADD", annotation: ann });
			}
		},
		[activeTool, pageIndex, strokeColor, strokeWidth, dispatch, onSelect, onStartTextEdit],
	);

	const handleStageMouseMove = useCallback(
		(e: Konva.KonvaEventObject<MouseEvent>) => {
			if (!drawingRef.current?.isDrawing) return;
			const stage = e.target.getStage();
			if (!stage) return;
			const pos = stage.getPointerPosition();
			if (!pos) return;

			if (activeTool === "draw" && tempShapeRef.current?.type === "draw") {
				const updated: DrawAnnotation = {
					...tempShapeRef.current,
					points: [...tempShapeRef.current.points, pos.x, pos.y],
				};
				tempShapeRef.current = updated;
				dispatch({ type: "UPDATE", annotation: updated });
			}
		},
		[activeTool, dispatch],
	);

	const handleStageMouseUp = useCallback(
		(e: Konva.KonvaEventObject<MouseEvent>) => {
			if (!drawingRef.current?.isDrawing) return;
			const stage = e.target.getStage();
			if (!stage) return;
			const pos = stage.getPointerPosition();
			if (!pos) return;

			const { startX, startY } = drawingRef.current;

			if (activeTool === "draw") {
				const drawId = tempShapeRef.current?.id ?? null;
				tempShapeRef.current = null;
				drawingRef.current = null;
				if (drawId) {
					onSelect(drawId);
					onToolChange("select");
				}
				return;
			}

			const dx = pos.x - startX;
			const dy = pos.y - startY;

			let createdId: string | null = null;

			if (activeTool === "rect") {
				if (Math.abs(dx) < MIN_SHAPE_SIZE || Math.abs(dy) < MIN_SHAPE_SIZE) {
					drawingRef.current = null;
					return;
				}
				const ann: RectAnnotation = {
					id: uuid(),
					type: "rect",
					pageIndex,
					x: Math.min(startX, pos.x),
					y: Math.min(startY, pos.y),
					width: Math.abs(dx),
					height: Math.abs(dy),
					fill: fillColor + DEFAULT_FILL_ALPHA,
					stroke: strokeColor,
					strokeWidth,
				};
				dispatch({ type: "ADD", annotation: ann });
				createdId = ann.id;
			} else if (activeTool === "ellipse") {
				const rx = Math.abs(dx) / 2;
				const ry = Math.abs(dy) / 2;
				if (rx < MIN_SHAPE_SIZE / 2 || ry < MIN_SHAPE_SIZE / 2) {
					drawingRef.current = null;
					return;
				}
				const ann: EllipseAnnotation = {
					id: uuid(),
					type: "ellipse",
					pageIndex,
					x: (startX + pos.x) / 2,
					y: (startY + pos.y) / 2,
					radiusX: rx,
					radiusY: ry,
					fill: fillColor + DEFAULT_FILL_ALPHA,
					stroke: strokeColor,
					strokeWidth,
				};
				dispatch({ type: "ADD", annotation: ann });
				createdId = ann.id;
			} else if (activeTool === "arrow") {
				if (Math.abs(dx) < MIN_SHAPE_SIZE && Math.abs(dy) < MIN_SHAPE_SIZE) {
					drawingRef.current = null;
					return;
				}
				const ann: ArrowAnnotation = {
					id: uuid(),
					type: "arrow",
					pageIndex,
					x: startX,
					y: startY,
					points: [0, 0, dx, dy],
					stroke: strokeColor,
					strokeWidth,
				};
				dispatch({ type: "ADD", annotation: ann });
				createdId = ann.id;
			}

			drawingRef.current = null;

			if (createdId) {
				onSelect(createdId);
				onToolChange("select");
			}
		},
		[activeTool, pageIndex, fillColor, strokeColor, strokeWidth, dispatch, onSelect, onToolChange],
	);

	const handleDragEnd = useCallback(
		(ann: Annotation, e: Konva.KonvaEventObject<DragEvent>) => {
			const node = e.target;
			dispatch({
				type: "UPDATE",
				annotation: { ...ann, x: node.x(), y: node.y() },
			});
		},
		[dispatch],
	);

	const handleTransformEnd = useCallback(
		(ann: Annotation, e: Konva.KonvaEventObject<Event>) => {
			const node = e.target;
			const scaleX = node.scaleX();
			const scaleY = node.scaleY();
			const rotation = node.rotation();

			node.scaleX(1);
			node.scaleY(1);

			if (ann.type === "rect") {
				dispatch({
					type: "UPDATE",
					annotation: {
						...ann,
						x: node.x(),
						y: node.y(),
						width: Math.max(MIN_SHAPE_SIZE, node.width() * scaleX),
						height: Math.max(MIN_SHAPE_SIZE, node.height() * scaleY),
						rotation,
					},
				});
			} else if (ann.type === "ellipse") {
				dispatch({
					type: "UPDATE",
					annotation: {
						...ann,
						x: node.x(),
						y: node.y(),
						radiusX: Math.max(MIN_SHAPE_SIZE / 2, (ann as import("@/types/annotations").EllipseAnnotation).radiusX * scaleX),
						radiusY: Math.max(MIN_SHAPE_SIZE / 2, (ann as import("@/types/annotations").EllipseAnnotation).radiusY * scaleY),
						rotation,
					},
				});
			} else if (ann.type === "text") {
				dispatch({
					type: "UPDATE",
					annotation: {
						...ann,
						x: node.x(),
						y: node.y(),
						fontSize: Math.round((ann as TextAnnotation).fontSize * scaleX),
						rotation,
					},
				});
			}
		},
		[dispatch],
	);

	const isDraggable = activeTool === "select";
	const cursorStyle =
		activeTool === "select"
			? "default"
			: activeTool === "text"
				? "text"
				: "crosshair";

	return (
		<Stage
			ref={stageRef}
			width={width}
			height={height}
			onMouseDown={handleStageMouseDown}
			onMouseMove={handleStageMouseMove}
			onMouseUp={handleStageMouseUp}
			style={{ cursor: cursorStyle, position: "absolute", top: 0, left: 0 }}
		>
			<Layer>
				{annotations.map((ann) => {
					switch (ann.type) {
						case "text":
							return (
								<Text
									key={ann.id}
									id={ann.id}
									x={ann.x}
									y={ann.y}
									rotation={ann.rotation ?? 0}
									text={ann.text}
									fontSize={ann.fontSize}
									fill={ann.fill}
									fontStyle={ann.bold ? "bold" : "normal"}
									draggable={isDraggable}
									onClick={() => onSelect(ann.id)}
									onTap={() => onSelect(ann.id)}
									onDblClick={() => onEditText(ann)}
									onDblTap={() => onEditText(ann)}
									onDragEnd={(e) => handleDragEnd(ann, e)}
									onTransformEnd={(e) => handleTransformEnd(ann, e)}
								/>
							);
						case "rect":
							return (
								<Rect
									key={ann.id}
									id={ann.id}
									x={ann.x}
									y={ann.y}
									rotation={ann.rotation ?? 0}
									width={ann.width}
									height={ann.height}
									fill={ann.fill}
									stroke={ann.stroke}
									strokeWidth={ann.strokeWidth}
									draggable={isDraggable}
									onClick={() => onSelect(ann.id)}
									onTap={() => onSelect(ann.id)}
									onDragEnd={(e) => handleDragEnd(ann, e)}
									onTransformEnd={(e) => handleTransformEnd(ann, e)}
								/>
							);
						case "ellipse":
							return (
								<Ellipse
									key={ann.id}
									id={ann.id}
									x={ann.x}
									y={ann.y}
									rotation={ann.rotation ?? 0}
									radiusX={ann.radiusX}
									radiusY={ann.radiusY}
									fill={ann.fill}
									stroke={ann.stroke}
									strokeWidth={ann.strokeWidth}
									draggable={isDraggable}
									onClick={() => onSelect(ann.id)}
									onTap={() => onSelect(ann.id)}
									onDragEnd={(e) => handleDragEnd(ann, e)}
									onTransformEnd={(e) => handleTransformEnd(ann, e)}
								/>
							);
						case "arrow":
							return (
								<Arrow
									key={ann.id}
									id={ann.id}
									x={ann.x}
									y={ann.y}
									rotation={ann.rotation ?? 0}
									points={ann.points}
									stroke={ann.stroke}
									strokeWidth={ann.strokeWidth}
									fill={ann.stroke}
									pointerLength={10}
									pointerWidth={10}
									draggable={isDraggable}
									onClick={() => onSelect(ann.id)}
									onTap={() => onSelect(ann.id)}
									onDragEnd={(e) => handleDragEnd(ann, e)}
								/>
							);
						case "draw":
							return (
								<Line
									key={ann.id}
									id={ann.id}
									x={ann.x}
									y={ann.y}
									rotation={ann.rotation ?? 0}
									points={ann.points}
									stroke={ann.stroke}
									strokeWidth={ann.strokeWidth}
									tension={0.5}
									lineCap="round"
									lineJoin="round"
									draggable={isDraggable}
									onClick={() => onSelect(ann.id)}
									onTap={() => onSelect(ann.id)}
									onDragEnd={(e) => handleDragEnd(ann, e)}
								/>
							);
					}
				})}
				{activeTool === "select" && (
					<Transformer
						ref={transformerRef}
						boundBoxFunc={(oldBox, newBox) => {
							if (newBox.width < MIN_SHAPE_SIZE || newBox.height < MIN_SHAPE_SIZE) {
								return oldBox;
							}
							return newBox;
						}}
					/>
				)}
			</Layer>
		</Stage>
	);
}
