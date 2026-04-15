"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TurnstileWidget } from "@/components/turnstile/turnstile-widget";

interface ForgotPasswordFormProps {
  turnstileSiteKey?: string;
  disableSignup?: boolean;
}

export function ForgotPasswordForm({ turnstileSiteKey, disableSignup }: ForgotPasswordFormProps) {
  console.log('disableSignup', disableSignup)
  const t = useTranslations("auth");
  const locale = useLocale();
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const turnstileEnabled = !!turnstileSiteKey;

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    if (turnstileEnabled && !turnstileToken) {
      return;
    }

    setIsLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, turnstileToken, locale }),
    });

    setIsLoading(false);
    setSuccess(true);
  }

  if (disableSignup) {
    return (
      <Card className="w-full max-w-md mx-auto text-center mt-12">
        <h1 className="text-2xl font-bold mb-4">{t("forgotPassword")}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("signupDisabled")}</p>
        <p className="mt-4">
          <Link href="/auth/signin" className="font-medium text-zinc-900 hover:underline dark:text-white">
            {t("signIn")}
          </Link>
        </p>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">{t("checkEmail")}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("resetEmailSent")}</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">{t("forgotPassword")}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        {t("forgotPasswordDescription")}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            {t("email")}
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            error={errors.email?.message}
          />
        </div>

        {turnstileEnabled && (
          <div className="flex items-center justify-center">
            <TurnstileWidget
              siteKey={turnstileSiteKey!}
              onVerify={handleTurnstileVerify}
              onExpire={handleTurnstileExpire}
            />
          </div>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          {t("sendResetLink")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/auth/signin" className="font-medium text-zinc-900 hover:underline dark:text-white">
          {t("backToSignIn")}
        </Link>
      </p>
    </Card>
  );
}
