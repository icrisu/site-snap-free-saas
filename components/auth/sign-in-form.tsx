"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TurnstileWidget } from "@/components/turnstile/turnstile-widget";

interface SignInFormProps {
  showGoogleSignIn?: boolean;
  turnstileSiteKey?: string;
  disableSignup?: boolean;
}

export function SignInForm({ showGoogleSignIn = false, turnstileSiteKey, disableSignup }: SignInFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const [error, setError] = useState(
    oauthError === "SignupDisabled" ? t("signupDisabled") : ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

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
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  async function onSubmit(data: SignInInput) {
    if (turnstileEnabled && !turnstileToken) {
      setError(t("turnstileRequired"));
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      turnstileToken,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError(t("signInError"));
      setTurnstileToken("");
      setResetKey((k) => k + 1);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-6">{t("signIn")}</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            {t("password")}
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            error={errors.password?.message}
          />
        </div>

        {turnstileEnabled && (
          <div className="flex items-center justify-center">
            <TurnstileWidget
              key={resetKey}
              siteKey={turnstileSiteKey!}
              onVerify={handleTurnstileVerify}
              onExpire={handleTurnstileExpire}
            />
          </div>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full mt-2">
          {t("signIn")}
        </Button>
      </form>

      { showGoogleSignIn && (
        <>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-xs text-zinc-500">{t("or")}</span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          </div>


          <Button
            variant="secondary"
            className="w-full mt-4"
            onClick={() => {
              if (disableSignup) {
                router.push('/auth/signup')
                return;
              }
              signIn("google", { callbackUrl: "/dashboard" })
            }}
          >
            {t("signInWithGoogle")}
          </Button>
        </>
      ) }

      <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
        {!disableSignup && (
          <p>
            {t("noAccount")}{" "}
            <Link href="/auth/signup" className="font-medium text-zinc-900 hover:underline dark:text-white">
              {t("signUp")}
            </Link>
          </p>
        )}
        <p>
          <Link href="/auth/forgot-password" className="font-medium text-zinc-900 hover:underline dark:text-white">
            {t("forgotPassword")}
          </Link>
        </p>
      </div>
    </Card>
  );
}
