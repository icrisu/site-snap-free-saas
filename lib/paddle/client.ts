import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { getSettings } from "@/lib/settings";

let paddleClient: Paddle | null = null;

export async function getPaddleClient(): Promise<Paddle | null> {
  if (paddleClient) return paddleClient;

  const settings = await getSettings();
  if (!settings.paddleApiKey) return null;

  paddleClient = new Paddle(settings.paddleApiKey, {
    environment:
      settings.paddleEnvironment === "production"
        ? Environment.production
        : Environment.sandbox,
  });

  return paddleClient;
}

export function invalidatePaddleClient(): void {
  paddleClient = null;
}
