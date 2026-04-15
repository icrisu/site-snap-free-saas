import { z } from "zod";

export const settingsSchema = z.object({
  turnstileSiteKey: z.string(),
  turnstileSecretKey: z.string(),
  disableTurnstileForPdfGenerate: z.boolean(),
  resendApiKey: z.string(),
  emailFrom: z.string(),
  maxPdfFileSizeMb: z.number().min(1).max(100),
  pdfStorage: z.enum(["local", "s3"]),
  awsS3Bucket: z.string(),
  awsS3Region: z.string(),
  awsAccessKeyId: z.string(),
  awsSecretAccessKey: z.string(),
  paddleApiKey: z.string(),
  paddleClientToken: z.string(),
  paddleWebhookSecret: z.string(),
  paddleEnvironment: z.enum(["sandbox", "production"]),
  helpCenterUrl: z.string(),
  termsUrl: z.string(),
  adsenseClientId: z.string(),
  disableSignup: z.boolean(),
  disableSubscriptions: z.boolean(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
