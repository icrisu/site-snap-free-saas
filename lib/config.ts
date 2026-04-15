import { z } from "zod";

const envSchema = z.object({
	NEXT_PUBLIC_BASE_URL: z.string().url(),
	DATABASE_URL: z.string().min(1),
	AUTH_SECRET: z.string().min(1),
	AUTH_URL: z.string().url().optional(),
});

function getEnv() {
	const parsed = envSchema.safeParse(process.env);
	if (!parsed.success) {
		console.error(
			"Invalid environment variables:",
			parsed.error.flatten().fieldErrors,
		);
		throw new Error("Invalid environment variables");
	}
	return parsed.data;
}

export const env = getEnv();
