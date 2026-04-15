"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function VerifyEmailStatus() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [errorMessage, setErrorMessage] = useState(token ? "" : t("invalidLink"));

  useEffect(() => {
    if (!token) return;

    async function verify() {
      const res = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error ? t(`api.${data.error}`) : t("genericError"));
      }
    }

    verify();
  }, [token, t]);

  return (
    <Card className="w-full max-w-md mx-auto text-center">
      {status === "loading" && (
        <>
          <h1 className="text-2xl font-bold mb-4">{t("verifyingEmail")}</h1>
          <Spinner />
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-2xl font-bold mb-4">{t("emailVerified")}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">{t("emailVerifiedDescription")}</p>
          <Link
            href="/auth/signin"
            className="font-medium text-zinc-900 hover:underline dark:text-white"
          >
            {t("signIn")}
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold mb-4">{t("verificationFailed")}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{errorMessage}</p>
        </>
      )}
    </Card>
  );
}
