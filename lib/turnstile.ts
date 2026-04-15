import axios from "axios";
import { getSettings } from "@/lib/settings";

const TURNSTILE_VERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
	success: boolean;
	"error-codes"?: string[];
}

export async function verifyTurnstileToken(token: string, isPdfGeneration?: boolean): Promise<boolean> {
	const settings = await getSettings();
	if (isPdfGeneration && settings.disableTurnstileForPdfGenerate) {
		return true;
	}
	const secretKey = settings.turnstileSecretKey;
	if (!secretKey || secretKey =='') {
		// Skip verification in development when key isn't configured
		return true;
	}

	const { data } = await axios.post<TurnstileVerifyResponse>(
		TURNSTILE_VERIFY_URL,
		new URLSearchParams({
			secret: secretKey,
			response: token,
		}),
		{ headers: { "Content-Type": "application/x-www-form-urlencoded" } },
	);

	return data.success;
}
