"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  updateNameSchema,
  changePasswordSchema,
  type UpdateNameInput,
  type ChangePasswordInput,
} from "@/lib/validations/auth";
import { updateName, changePassword, deleteAccount } from "@/lib/actions/account";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DeleteAccountDialog } from "@/components/dashboard/delete-account-dialog";

interface MyAccountFormProps {
  name: string;
  email: string;
  hasPassword: boolean;
  role: string;
}

export function MyAccountForm({ name, email, hasPassword, role }: MyAccountFormProps) {
  const t = useTranslations("dashboard.myAccount");

  // --- Profile section ---
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const {
    register: registerName,
    handleSubmit: handleNameSubmit,
    formState: { errors: nameErrors },
  } = useForm<UpdateNameInput>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name },
  });

  async function onNameSubmit(data: UpdateNameInput) {
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");

    const result = await updateName(data);
    setProfileLoading(false);

    if (!result.success) {
      setProfileError(t("genericError"));
      return;
    }

    setProfileSuccess(t("profileSuccess"));
  }

  // --- Delete account section ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function onDeleteAccount() {
    setIsDeleting(true);
    setDeleteError("");

    const result = await deleteAccount();

    if (!result.success) {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      const errorKey = result.error as string;
      const td = (key: string) => t(`deleteAccount.${key}`);
      if (
        errorKey === "adminCannotDelete" ||
        errorKey === "cancelSubscriptionFailed" ||
        errorKey === "deleteFilesFailed" ||
        errorKey === "deleteFailed"
      ) {
        setDeleteError(td(errorKey));
      } else {
        setDeleteError(t("genericError"));
      }
      return;
    }

    await signOut({ callbackUrl: "/" });
  }

  // --- Password section ---
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onPasswordSubmit(data: ChangePasswordInput) {
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    const result = await changePassword(data);
    setPasswordLoading(false);

    if (!result.success) {
      if (result.error === "wrongPassword") {
        setPasswordError(t("wrongPassword"));
      } else if (result.error === "passwordChangeRestricted") {
        setPasswordError(t("passwordChangeRestricted"));
      } else {
        setPasswordError(t("genericError"));
      }
      return;
    }

    setPasswordSuccess(t("passwordSuccess"));
    resetPasswordForm();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Card */}
      <Card>
        <h2 className="text-lg font-semibold">{t("profile")}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {t("profileDescription")}
        </p>

        {profileError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
            {profileSuccess}
          </div>
        )}

        <form onSubmit={handleNameSubmit(onNameSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              {t("email")}
            </label>
            <Input id="email" type="email" value={email} disabled />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              {t("name")}
            </label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              {...registerName("name")}
              error={nameErrors.name?.message}
            />
          </div>

          <Button type="submit" isLoading={profileLoading}>
            {profileLoading ? t("saving") : t("save")}
          </Button>
        </form>
      </Card>

      {/* Password Card */}
      <Card>
        <h2 className="text-lg font-semibold">{t("changePassword")}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {hasPassword
            ? t("changePasswordDescription")
            : t("setPasswordDescription")}
        </p>

        {passwordError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
            {passwordSuccess}
          </div>
        )}

        <form
          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          className="space-y-4"
        >
          {hasPassword && (
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium mb-1"
              >
                {t("currentPassword")}
              </label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...registerPassword("currentPassword")}
                error={passwordErrors.currentPassword?.message}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium mb-1"
            >
              {t("newPassword")}
            </label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...registerPassword("newPassword")}
              error={passwordErrors.newPassword?.message}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1"
            >
              {t("confirmPassword")}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...registerPassword("confirmPassword")}
              error={passwordErrors.confirmPassword?.message}
            />
          </div>

          <Button type="submit" isLoading={passwordLoading}>
            {passwordLoading ? t("saving") : t("save")}
          </Button>
        </form>
      </Card>

      {/* Delete Account — CUSTOMER only */}
      {role === "CUSTOMER" && (
        <Card className="border-red-300 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            {t("deleteAccount.title")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            {t("deleteAccount.description")}
          </p>

          {deleteError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {deleteError}
            </div>
          )}

          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t("deleteAccount.confirm")}
          </Button>

          <DeleteAccountDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={onDeleteAccount}
            isDeleting={isDeleting}
          />
        </Card>
      )}
    </div>
  );
}
