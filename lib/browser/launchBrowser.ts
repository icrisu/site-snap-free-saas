import type { Browser as PlaywrightBrowser } from "playwright-core";
import type { Browser as PuppeteerBrowser } from "puppeteer-core";

const ALLOWED_PROVIDERS = ["playwright", "sparticuz"] as const;
type BrowserProvider = (typeof ALLOWED_PROVIDERS)[number];

export type BrowserKit =
	| { provider: "playwright"; browser: PlaywrightBrowser }
	| { provider: "sparticuz"; browser: PuppeteerBrowser };

function getProvider(): BrowserProvider {
	const value = process.env.BROWSER_PROVIDER ?? "playwright";
	if (!ALLOWED_PROVIDERS.includes(value as BrowserProvider)) {
		throw new Error(
			`Invalid BROWSER_PROVIDER "${value}". Allowed: ${ALLOWED_PROVIDERS.join(", ")}`,
		);
	}
	return value as BrowserProvider;
}

async function launchPlaywright(): Promise<PlaywrightBrowser> {
	const { chromium } = await import("playwright");
	return chromium.launch({ headless: true });
}

async function launchPuppeteer(): Promise<PuppeteerBrowser> {
	const chromium = (await import("@sparticuz/chromium")).default;
	const puppeteer = (await import("puppeteer-core")).default;
	return puppeteer.launch({
		args: chromium.args,
		executablePath: await chromium.executablePath(),
		headless: true,
	});
}

// Singleton state per provider
let cachedKit: BrowserKit | null = null;
let launchPromise: Promise<BrowserKit> | null = null;

function isBrowserAlive(kit: BrowserKit): boolean {
	if (kit.provider === "playwright") {
		return kit.browser.isConnected();
	}
	return kit.browser.connected;
}

export async function getBrowserKit(): Promise<BrowserKit> {
	if (cachedKit && isBrowserAlive(cachedKit)) {
		return cachedKit;
	}

	if (!launchPromise) {
		const provider = getProvider();

		launchPromise = (
			provider === "playwright"
				? launchPlaywright().then(
						(b): BrowserKit => ({ provider: "playwright", browser: b }),
					)
				: launchPuppeteer().then(
						(b): BrowserKit => ({ provider: "sparticuz", browser: b }),
					)
		)
			.then((kit) => {
				cachedKit = kit;
				launchPromise = null;
				return kit;
			})
			.catch((err) => {
				launchPromise = null;
				cachedKit = null;
				throw err;
			});
	}

	return launchPromise;
}
