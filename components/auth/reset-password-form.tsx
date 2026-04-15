"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TurnstileWidget } from "@/components/turnstile/turnstile-widget";

interface ResetPasswordFormProps {
  turnstileSiteKey?: string;
}

export function ResetPasswordForm({ turnstileSiteKey }: ResetPasswordFormProps) {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [error, setError] = useState("");
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
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  async function onSubmit(data: ResetPasswordInput) {
    if (turnstileEnabled && !turnstileToken) {
      setError(t("turnstileRequired"));
      return;
    }

    setIsLoading(true);
    setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, turnstileToken }),
    });

    const result = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      setError(result.error ? t(`api.${result.error}`) : t("genericError"));
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">{t("passwordReset")}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">{t("passwordResetSuccess")}</p>
        <Link href="/auth/signin" className="font-medium text-zinc-900 hover:underline dark:text-white">
          {t("signIn")}
        </Link>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">{t("invalidLink")}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("invalidLinkDescription")}</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-6">{t("resetPassword")}</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("token")} />

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            {t("newPassword")}
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            {t("confirmPassword")}
          </label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
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
          {t("resetPassword")}
        </Button>
      </form>
    </Card>
  );
}
