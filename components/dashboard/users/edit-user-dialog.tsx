"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  updateUserSchema,
  type UpdateUserInput,
} from "@/lib/validations/update-user";
import { updateUser } from "@/lib/actions/users";
import type { UserRow } from "@/lib/actions/users";
import { getPlans, type PlanRow } from "@/lib/actions/plans";
import { useTranslations } from "next-intl";

type EditUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow;
  onSuccess: () => void;
};

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserDialogProps) {
  const t = useTranslations("dashboard.users.edit");
  const tRoles = useTranslations("dashboard.users.roles");
  const [serverError, setServerError] = useState("");
  const [plans, setPlans] = useState<PlanRow[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email,
      emailVerified: !!user.emailVerified,
      role: user.role,
      planId: "",
      overrideMaxProjects: user.overrideMaxProjects,
      overrideMaxStorageMB: user.overrideMaxStorageMB,
      overrideReason: user.overrideReason || "",
    },
  });

  const emailVerified = useWatch({ control, name: "emailVerified" });
  const role = useWatch({ control, name: "role" });

  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    async function fetchPlans() {
      try {
        const p = await getPlans();
        if (!isMounted) return;

        setPlans(p);

        // Find user's current plan by slug
        const currentPlan = p.find((plan) => plan.slug === user.planSlug);

        reset({
          name: user.name || "",
          email: user.email,
          emailVerified: !!user.emailVerified,
          role: user.role,
          planId: currentPlan?.id || "",
          overrideMaxProjects: user.overrideMaxProjects,
          overrideMaxStorageMB: user.overrideMaxStorageMB,
          overrideReason: user.overrideReason || "",
          newPassword: "",
          confirmPassword: "",
        });

        setServerError("");
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setServerError(t("errorFetchingPlans"));
      }
    }

    fetchPlans();

    return () => {
      isMounted = false;
    };
  }, [open, user, reset, t]);

  const onSubmit = async (data: UpdateUserInput) => {
    setServerError("");
    const result = await updateUser(user.id, data);
    if (result.success) {
      onOpenChange(false);
      onSuccess();
    } else {
      setServerError(result.error || t("error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-md max-h-[80vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t("name")}</Label>
            <Input
              id="edit-name"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">{t("email")}</Label>
            <Input
              id="edit-email"
              type="email"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="edit-role">{t("role")}</Label>
            <Select
              value={role}
              onValueChange={(val) =>
                setValue("role", val as "ADMIN" | "CUSTOMER")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">{tRoles("ADMIN")}</SelectItem>
                <SelectItem value="CUSTOMER">{tRoles("CUSTOMER")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plan Assignment */}
          <div className="space-y-2">
            <Label htmlFor="edit-plan">{t("planAssignment")}</Label>
            <Select
              value={getValues("planId")} // <- use form value directly
              onValueChange={(val) => setValue("planId", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} ({plan.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limit Overrides */}
          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">{t("overrides")}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-overrideMaxProjects">{t("overrideMaxProjects")}</Label>
                <Input
                  id="edit-overrideMaxProjects"
                  type="number"
                  min={1}
                  placeholder={t("planDefault")}
                  {...register("overrideMaxProjects", {
                    setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-overrideMaxStorageMB">{t("overrideMaxStorageMB")}</Label>
                <Input
                  id="edit-overrideMaxStorageMB"
                  type="number"
                  min={1}
                  placeholder={t("planDefault")}
                  {...register("overrideMaxStorageMB", {
                    setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-overrideReason">{t("overrideReason")}</Label>
              <Input
                id="edit-overrideReason"
                {...register("overrideReason")}
                placeholder={t("overrideReasonPlaceholder")}
              />
            </div>
          </div>

          {/* Email Verified */}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!emailVerified}
              onCheckedChange={(checked) =>
                setValue("emailVerified", checked === true)
              }
            />
            {t("emailVerified")}
          </label>

          {/* Change Password */}
          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">{t("changePassword")}</p>
            <div className="space-y-2">
              <Label htmlFor="edit-newPassword">{t("newPassword")}</Label>
              <Input
                id="edit-newPassword"
                type="password"
                placeholder={t("passwordPlaceholder")}
                {...register("newPassword")}
                error={errors.newPassword?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="edit-confirmPassword"
                type="password"
                placeholder={t("passwordPlaceholder")}
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />
            </div>
          </div>

          {serverError && (
            <p className="text-sm text-red-500">{serverError}</p>
          )}
          </div>

          <DialogFooter className="shrink-0 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}