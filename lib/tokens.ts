import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function generateVerificationToken(email: string) {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const identifier = `email-verify:${email}`;

  // Delete any existing token for this identifier
  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  const verificationToken = await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return verificationToken;
}

export async function generatePasswordResetToken(email: string) {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const identifier = `password-reset:${email}`;

  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  const resetToken = await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return resetToken;
}
