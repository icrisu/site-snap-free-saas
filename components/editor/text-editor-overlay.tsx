"use client";

import { useRef, useEffect, useCallback } from "react";

interface TextEditorOverlayProps {
	x: number;
	y: number;
	initialText?: string;
	fontSize: number;
	color: string;
	bold: boolean;
	onConfirm: (text: string) => void;
	onCancel: () => void;
}

export function TextEditorOverlay({
	x,
	y,
	initialText = "",
	fontSize,
	color,
	bold,
	onConfirm,
	onCancel,
}: TextEditorOverlayProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const readyRef = useRef(false);

	useEffect(() => {
		// Delay focus until after the browser finishes processing the
		// mousedown/mouseup that triggered this overlay.  Without the
		// timeout the canvas reclaims focus immediately and the textarea's
		// onBlur fires before the user can type.
		const timer = setTimeout(() => {
			const textarea = textareaRef.current;
			if (textarea) {
				textarea.focus();
				textarea.select();
			}
			readyRef.current = true;
		}, 0);
		return () => clearTimeout(timer);
	}, []);

	const handleConfirm = useCallback(() => {
		if (!readyRef.current) return;
		const text = textareaRef.current?.value.trim();
		if (text) {
			onConfirm(text);
		} else {
			onCancel();
		}
	}, [onConfirm, onCancel]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleConfirm();
			} else if (e.key === "Escape") {
				e.preventDefault();
				onCancel();
			}
		},
		[handleConfirm, onCancel],
	);

	return (
		<textarea
			ref={textareaRef}
			onKeyDown={handleKeyDown}
			onBlur={handleConfirm}
			style={{
				position: "absolute",
				left: x,
				top: y,
				fontSize: `${fontSize}px`,
				fontWeight: bold ? "bold" : "normal",
				color,
				background: "transparent",
				border: "2px dashed #3b82f6",
				borderRadius: 4,
				outline: "none",
				padding: "2px 4px",
				minWidth: 120,
				minHeight: 32,
				resize: "both",
				fontFamily: "sans-serif",
				lineHeight: 1.2,
				zIndex: 10,
			}}
			defaultValue={initialText}
		/>
	);
}
