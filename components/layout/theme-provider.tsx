"use client";

import {
	createContext,
	useContext,
	useSyncExternalStore,
	useCallback,
	type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
	theme: "light",
	setTheme: () => {},
});

const STORAGE_KEY = process.env.NEXT_PUBLIC_THEME_STORAGE_KEY || "sitesnap-theme";

// --- external store machinery ---

let listeners: Array<() => void> = [];

function emitChange() {
	for (const listener of listeners) {
		listener();
	}
}

function subscribe(listener: () => void) {
	listeners = [...listeners, listener];
	return () => {
		listeners = listeners.filter((l) => l !== listener);
	};
}

function getSnapshot(): Theme {
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
	return "light";
}

function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
}

// --- provider ---

export function ThemeProvider({ children }: { children: ReactNode }) {
	const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	// Keep DOM class in sync whenever the snapshot value changes
	if (typeof document !== "undefined") {
		applyTheme(theme);
	}

	const setTheme = useCallback((next: Theme) => {
		localStorage.setItem(STORAGE_KEY, next);
		applyTheme(next);
		emitChange();
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
