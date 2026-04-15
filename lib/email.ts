import { Resend } from "resend";
import { getSettings } from "@/lib/settings";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const siteName = process.env.SITE_NAME ?? "SiteSnap";

async function getResendClient() {
  const settings = await getSettings();
  if (!settings.resendApiKey) return null;
  return {
    resend: new Resend(settings.resendApiKey),
    emailFrom: settings.emailFrom,
  };
}


export async function sendVerificationEmail(email: string, token: string, locale?: string) {
  const client = await getResendClient();
  if (!client) {
    console.warn("[email] Resend API key not configured — skipping verification email");
    return;
  }
  

  const verifyUrl = `${baseUrl}/${locale}/auth/verify-email?token=${token}`;
  const { resend, emailFrom } = client;

  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: `Verify your email — ${siteName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to ${siteName}</h2>
        <p>Click the link below to verify your email address:</p>
        <p><a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: #fff; text-decoration: none; border-radius: 8px;">Verify Email</a></p>
        <p style="color: #71717a; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, locale?: string) {
  const client = await getResendClient();
  if (!client) {
    console.warn("[email] Resend API key not configured — skipping password reset email");
    return;
  }

  const resetUrl = `${baseUrl}/${locale}/auth/reset-password?token=${token}`;
  const { resend, emailFrom } = client;

  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: `Reset your password — ${siteName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: #fff; text-decoration: none; border-radius: 8px;">Reset Password</a></p>
        <p style="color: #71717a; font-size: 14px;">This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.</p>
      </div>
    `,
  });
}
