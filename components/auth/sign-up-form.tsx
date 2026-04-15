"use client";

import { useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TurnstileWidget } from "@/components/turnstile/turnstile-widget";

interface SignUpFormProps {
  turnstileSiteKey?: string;
  disableSignup?: boolean;
  termsUrl?: string;
}

export function SignUpForm({ turnstileSiteKey, disableSignup, termsUrl }: SignUpFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
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
    setValue,
    control,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      termsAccepted: false as true,
    },
  });

  const termsAccepted = useWatch({ control, name: "termsAccepted" });

  async function onSubmit(data: SignUpInput) {
    if (turnstileEnabled && !turnstileToken) {
      setError(t("turnstileRequired"));
      return;
    }

    setIsLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, turnstileToken, locale }),
    });

    const result = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      setError(result.error ? t(`api.${result.error}`) : t("genericError"));
      return;
    }

    setSuccess(true);
  }

  if (disableSignup) {
    return (
      <Card className="w-full max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">{t("signUp")}</h1>
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
        <p className="text-zinc-600 dark:text-zinc-400">{t("checkEmailDescription")}</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-6">{t("signUp")}</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            {t("name")}
          </label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name")}
            error={errors.name?.message}
          />
        </div>

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            {t("password")}
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

        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="termsAccepted"
              checked={termsAccepted === true}
              onCheckedChange={(checked) => setValue("termsAccepted", (checked === true) as true, { shouldValidate: true })}
              className="mt-0.5"
            />
            <label htmlFor="termsAccepted" className="text-sm">
              {termsUrl ? (
                <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline hover:no-underline">
                  {t("termsAccept")}
                </a>
              ) : (
                t("termsAccept")
              )}
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-red-600 dark:text-red-400">{t("termsRequired")}</p>
          )}
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
          {t("signUp")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {t("hasAccount")}{" "}
        <Link href="/auth/signin" className="font-medium text-zinc-900 hover:underline dark:text-white">
          {t("signIn")}
        </Link>
      </p>
    </Card>
  );
}
