"use client";

import { useEffect, useState } from "react";

interface ToastProps {
	message: string;
	variant?: "default" | "error";
	duration?: number;
	onClose: () => void;
}

export function Toast({ message, variant = "default", duration = 3000, onClose }: ToastProps) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		requestAnimationFrame(() => setVisible(true));
		const timer = setTimeout(() => {
			setVisible(false);
			setTimeout(onClose, 300);
		}, duration);
		return () => clearTimeout(timer);
	}, [duration, onClose]);

	return (
		<div className="fixed bottom-6 right-6 z-50">
			<div
				className={`rounded-lg px-4 py-3 text-sm shadow-lg transition-all duration-300 ${
					variant === "error"
						? "bg-red-600 text-white dark:bg-red-500"
						: "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
				} ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
			>
				{message}
			</div>
		</div>
	);
}
