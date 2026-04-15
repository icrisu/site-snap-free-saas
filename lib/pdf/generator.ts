import { getBrowserKit } from "@/lib/browser/launchBrowser";
import { getSettings } from "@/lib/settings";

const LIMITS = {
	navigationTimeout: 15_000,
	viewport: { width: 1280, height: 900 },
	blockResources: ["video", "media"],
};

// SSRF protection: block private/internal IP ranges
const BLOCKED_HOSTS = [
	/^localhost$/i,
	/^127\./,
	/^10\./,
	/^172\.(1[6-9]|2\d|3[01])\./,
	/^192\.168\./,
	/^0\./,
	/^169\.254\./,
	/^\[::1\]$/,
	/^\[fc/i,
	/^\[fd/i,
	/^\[fe80/i,
];

function isBlockedHost(hostname: string): boolean {
	return BLOCKED_HOSTS.some((pattern) => pattern.test(hostname));
}

// Evaluate scripts shared by both providers (run inside the page)
const EAGER_IMAGES_SCRIPT = () => {
	for (const img of document.querySelectorAll('img[loading="lazy"]')) {
		img.setAttribute("loading", "eager");
	}
};

const SCROLL_PAGE_SCRIPT = async () => {
	const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
	const step = window.innerHeight;
	const maxScroll = document.documentElement.scrollHeight;
	for (let y = 0; y < maxScroll; y += step) {
		window.scrollTo(0, y);
		await delay(100);
	}
	window.scrollTo(0, 0);
};

const WAIT_IMAGES_SCRIPT = () =>
	Promise.all(
		Array.from(document.images)
			.filter((img) => !img.complete)
			.map(
				(img) =>
					new Promise<void>((resolve) => {
						img.addEventListener("load", () => resolve(), { once: true });
						img.addEventListener("error", () => resolve(), { once: true });
					}),
			),
	);

const BODY_HEIGHT_SCRIPT = () => document.documentElement.scrollHeight;

// ---------------------------------------------------------------------------
// Playwright path
// ---------------------------------------------------------------------------
async function generateWithPlaywright(
	browser: import("playwright-core").Browser,
	url: string,
	maxPdfSize: number,
): Promise<Buffer> {
	const context = await browser.newContext({ viewport: LIMITS.viewport });
	try {
		const page = await context.newPage();

		await page.route("**/*", (route) => {
			const resourceType = route.request().resourceType();
			if (LIMITS.blockResources.includes(resourceType)) {
				return route.abort();
			}
			return route.continue();
		});

		await page.goto(url, {
			waitUntil: "networkidle",
			timeout: LIMITS.navigationTimeout,
		});

		if (process.env.PDF_LOAD_IMAGES_STRATEGY === "full") {
			await page.evaluate(EAGER_IMAGES_SCRIPT);
			await page.evaluate(SCROLL_PAGE_SCRIPT);
			await page.evaluate(WAIT_IMAGES_SCRIPT);
		}

		await page.emulateMedia({ media: "print" });

		const bodyHeight = await page.evaluate(BODY_HEIGHT_SCRIPT);
		const pdfBuffer = await page.pdf({
			width: `${LIMITS.viewport.width}px`,
			height: `${bodyHeight}px`,
			printBackground: true,
			margin: { top: "0", right: "0", bottom: "0", left: "0" },
		});

		if (pdfBuffer.byteLength > maxPdfSize) {
			throw new Error("PDF exceeds maximum size limit");
		}

		return Buffer.from(pdfBuffer);
	} finally {
		await context.close();
	}
}

// ---------------------------------------------------------------------------
// Puppeteer path (sparticuz)
// ---------------------------------------------------------------------------
async function generateWithPuppeteer(
	browser: import("puppeteer-core").Browser,
	url: string,
	maxPdfSize: number,
): Promise<Buffer> {
	const page = await browser.newPage();
	try {
		await page.setViewport(LIMITS.viewport);

		await page.setRequestInterception(true);
		page.on("request", (req) => {
			if (LIMITS.blockResources.includes(req.resourceType())) {
				req.abort();
			} else {
				req.continue();
			}
		});

		await page.goto(url, {
			waitUntil: "networkidle0",
			timeout: LIMITS.navigationTimeout,
		});

		if (process.env.PDF_LOAD_IMAGES_STRATEGY === "full") {
			await page.evaluate(EAGER_IMAGES_SCRIPT);
			await page.evaluate(SCROLL_PAGE_SCRIPT);
			await page.evaluate(WAIT_IMAGES_SCRIPT);
		}

		await page.emulateMediaType("print");

		const bodyHeight = await page.evaluate(BODY_HEIGHT_SCRIPT);
		const pdfBuffer = await page.pdf({
			width: `${LIMITS.viewport.width}px`,
			height: `${bodyHeight}px`,
			printBackground: true,
			margin: { top: "0", right: "0", bottom: "0", left: "0" },
		});

		if (pdfBuffer.byteLength > maxPdfSize) {
			throw new Error("PDF exceeds maximum size limit");
		}

		return Buffer.from(pdfBuffer);
	} finally {
		await page.close();
	}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function generatePdf(url: string): Promise<Buffer> {
	const parsedUrl = new URL(url);
	if (isBlockedHost(parsedUrl.hostname)) {
		throw new Error("Access to internal/private addresses is not allowed");
	}

	const settings = await getSettings();
	const maxPdfSize = settings.maxPdfFileSizeMb * 1024 * 1024;

	const kit = await getBrowserKit();

	if (kit.provider === "playwright") {
		return generateWithPlaywright(kit.browser, url, maxPdfSize);
	}

	return generateWithPuppeteer(kit.browser, url, maxPdfSize);
}
