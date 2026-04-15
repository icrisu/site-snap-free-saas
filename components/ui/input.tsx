import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ error, className = "", ...props }, ref) => {
		return (
			<div className="w-full">
				<input
					ref={ref}
					className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
						error
							? "border-red-500 focus:ring-red-500"
							: "border-zinc-300 dark:border-zinc-700"
					} bg-white dark:bg-zinc-900 ${className}`}
					{...props}
				/>
				{error && <p className="mt-1 text-sm text-red-500">{error}</p>}
			</div>
		);
	},
);

Input.displayName = "Input";
