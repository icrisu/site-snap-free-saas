export type AppSettings = {
  turnstileSiteKey: string;
  turnstileSecretKey: string;
  disableTurnstileForPdfGenerate: boolean;
  resendApiKey: string;
  emailFrom: string;
  maxPdfFileSizeMb: number;
  pdfStorage: "local" | "s3";
  awsS3Bucket: string;
  awsS3Region: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  paddleApiKey: string;
  paddleClientToken: string;
  paddleWebhookSecret: string;
  paddleEnvironment: "sandbox" | "production";
  helpCenterUrl: string;
  termsUrl: string;
  adsenseClientId: string;
  disableSignup: boolean;
  disableSubscriptions: boolean;
};

export const defaultSettings: AppSettings = {
  turnstileSiteKey: "",
  turnstileSecretKey: "",
  disableTurnstileForPdfGenerate: false,
  resendApiKey: "",
  emailFrom: "noreply@sitesnap.dev",
  maxPdfFileSizeMb: 10,
  pdfStorage: "local",
  awsS3Bucket: "",
  awsS3Region: "",
  awsAccessKeyId: "",
  awsSecretAccessKey: "",
  paddleApiKey: "",
  paddleClientToken: "",
  paddleWebhookSecret: "",
  paddleEnvironment: "sandbox",
  helpCenterUrl: "",
  termsUrl: "",
  adsenseClientId: "",
  disableSignup: false,
  disableSubscriptions: false,
};
