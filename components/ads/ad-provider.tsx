"use client";

import Script from "next/script";

type AdProviderProps = {
	clientId?: string;
};

export function AdProvider({ clientId }: AdProviderProps) {
	if (!clientId) return null;

	return (
		<Script
			src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
			strategy="lazyOnload"
			crossOrigin="anonymous"
		/>
	);
}
