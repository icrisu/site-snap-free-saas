"use client";

import { useReducer, useState, useCallback, useEffect, useRef } from "react";
import type { Annotation, AnnotationAction, ToolType } from "@/types/annotations";
import {
	DEFAULT_FILL,
	DEFAULT_STROKE,
	DEFAULT_STROKE_WIDTH,
	DEFAULT_FONT_SIZE,
	HISTORY_LIMIT,
} from "./constants";

type AnnotationMap = Map<number, Annotation[]>;

function cloneMap(map: AnnotationMap): AnnotationMap {
	const clone = new Map<number, Annotation[]>();
	for (const [key, value] of map) {
		clone.set(key, [...value]);
	}
	return clone;
}

function annotationReducer(
	state: AnnotationMap,
	action: AnnotationAction,
): AnnotationMap {
	switch (action.type) {
		case "ADD": {
			const next = cloneMap(state);
			const pageAnns = next.get(action.annotation.pageIndex) ?? [];
			next.set(action.annotation.pageIndex, [...pageAnns, action.annotation]);
			return next;
		}
		case "UPDATE": {
			const next = cloneMap(state);
			const pageAnns = next.get(action.annotation.pageIndex) ?? [];
			next.set(
				action.annotation.pageIndex,
				pageAnns.map((a) =>
					a.id === action.annotation.id ? action.annotation : a,
				),
			);
			return next;
		}
		case "DELETE": {
			const next = cloneMap(state);
			const pageAnns = next.get(action.pageIndex) ?? [];
			next.set(
				action.pageIndex,
				pageAnns.filter((a) => a.id !== action.id),
			);
			return next;
		}
		case "DELETE_PAGE": {
			const next = new Map<number, Annotation[]>();
			for (const [key, value] of state) {
				if (key === action.pageIndex) continue;
				const newKey = key > action.pageIndex ? key - 1 : key;
				next.set(newKey, value.map((a) => ({ ...a, pageIndex: newKey })));
			}
			return next;
		}
		case "SET_ALL": {
			return action.annotations;
		}
		case "REORDER": {
			const next = cloneMap(state);
			const pageAnns = next.get(action.pageIndex) ?? [];
			const byId = new Map(pageAnns.map((a) => [a.id, a]));
			const reordered = action.annotationIds
				.map((id) => byId.get(id))
				.filter((a): a is Annotation => a !== undefined);
			next.set(action.pageIndex, reordered);
			return next;
		}
	}
}

export function useAnnotations(initialAnnotations?: AnnotationMap) {
	const [annotations, dispatch] = useReducer(
		annotationReducer,
		initialAnnotations ?? new Map(),
	);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [activeTool, setActiveTool] = useState<ToolType>("select");
	const [fillColor, setFillColor] = useState(DEFAULT_FILL);
	const [strokeColor, setStrokeColor] = useState(DEFAULT_STROKE);
	const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
	const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
	const [bold, setBold] = useState(false);

	const historyRef = useRef<AnnotationMap[]>([]);
	const futureRef = useRef<AnnotationMap[]>([]);
	const prevStateRef = useRef<AnnotationMap>(new Map());
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);

	const pushHistory = useCallback((prev: AnnotationMap) => {
		historyRef.current = [
			...historyRef.current.slice(-HISTORY_LIMIT + 1),
			prev,
		];
		futureRef.current = [];
		setCanUndo(true);
		setCanRedo(false);
	}, []);

	const dispatchWithHistory = useCallback(
		(action: AnnotationAction) => {
			pushHistory(prevStateRef.current);
			dispatch(action);
		},
		[pushHistory],
	);

	// Track current state for undo
	const stateCallbackRef = useRef(annotations);
	useEffect(() => {
		stateCallbackRef.current = annotations;
		prevStateRef.current = annotations;
	}, [annotations]);

	const undo = useCallback(() => {
		if (historyRef.current.length === 0) return;
		const prev = historyRef.current[historyRef.current.length - 1];
		historyRef.current = historyRef.current.slice(0, -1);
		futureRef.current = [...futureRef.current, stateCallbackRef.current];
		setCanUndo(historyRef.current.length > 0);
		setCanRedo(true);
		dispatch({ type: "SET_ALL", annotations: prev });
		setSelectedId(null);
	}, []);

	const redo = useCallback(() => {
		if (futureRef.current.length === 0) return;
		const next = futureRef.current[futureRef.current.length - 1];
		futureRef.current = futureRef.current.slice(0, -1);
		historyRef.current = [...historyRef.current, stateCallbackRef.current];
		setCanUndo(true);
		setCanRedo(futureRef.current.length > 0);
		dispatch({ type: "SET_ALL", annotations: next });
		setSelectedId(null);
	}, []);

	const getPageAnnotations = useCallback(
		(pageIndex: number): Annotation[] => {
			return annotations.get(pageIndex) ?? [];
		},
		[annotations],
	);

	const deleteSelected = useCallback(() => {
		if (!selectedId) return;
		for (const [pageIndex, pageAnns] of annotations.entries()) {
			if (pageAnns.some((a: Annotation) => a.id === selectedId)) {
				dispatchWithHistory({ type: "DELETE", id: selectedId, pageIndex });
				setSelectedId(null);
				return;
			}
		}
	}, [selectedId, annotations, dispatchWithHistory]);

	// Keyboard shortcuts
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return;
			}

			if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
				e.preventDefault();
				undo();
			} else if (
				(e.ctrlKey || e.metaKey) &&
				e.key === "z" &&
				e.shiftKey
			) {
				e.preventDefault();
				redo();
			} else if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault();
				deleteSelected();
			} else if (e.key === "Escape") {
				setSelectedId(null);
				setActiveTool("select");
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [undo, redo, deleteSelected]);

	return {
		annotations,
		selectedId,
		setSelectedId,
		activeTool,
		setActiveTool,
		fillColor,
		setFillColor,
		strokeColor,
		setStrokeColor,
		strokeWidth,
		setStrokeWidth,
		fontSize,
		setFontSize,
		bold,
		setBold,
		dispatch: dispatchWithHistory,
		undo,
		redo,
		canUndo,
		canRedo,
		getPageAnnotations,
		deleteSelected,
	};
}
