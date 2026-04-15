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
import { Button } from "@/components/ui/button";
import { updatePlanSchema, type UpdatePlanInput } from "@/lib/validations/plan";
import { updatePlan } from "@/lib/actions/plans";
import type { PlanRow } from "@/lib/actions/plans";
import { useTranslations } from "next-intl";

type EditPlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanRow;
  onSuccess: () => void;
};

export function EditPlanDialog({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: EditPlanDialogProps) {
  const t = useTranslations("dashboard.plans.edit");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePlanInput>({
    resolver: zodResolver(updatePlanSchema),
    defaultValues: {
      name: plan.name,
      paddlePriceId: plan.paddlePriceId || "",
      maxProjects: plan.maxProjects,
      maxStorageMB: plan.maxStorageMB,
      maxFileSizeMB: plan.maxFileSizeMB,
      features: plan.features,
      displayOrder: plan.displayOrder,
      monthlyPrice: plan.monthlyPrice,
      currency: plan.currency,
      isFree: plan.isFree,
    },
  });

  const isFree = useWatch({ control, name: "isFree" });

  useEffect(() => {
    reset({
      name: plan.name,
      paddlePriceId: plan.paddlePriceId || "",
      maxProjects: plan.maxProjects,
      maxStorageMB: plan.maxStorageMB,
      maxFileSizeMB: plan.maxFileSizeMB,
      features: plan.features,
      displayOrder: plan.displayOrder,
      monthlyPrice: plan.monthlyPrice,
      currency: plan.currency,
      isFree: plan.isFree,
    });
  }, [plan, reset]);

  const onSubmit = async (data: UpdatePlanInput) => {
    setServerError("");
    const result = await updatePlan(plan.id, data);
    if (result.success) {
      onOpenChange(false);
      onSuccess();
    } else {
      setServerError(result.error || t("error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")} <span className="font-mono text-xs">({plan.slug})</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-plan-name">{t("name")}</Label>
            <Input
              id="edit-plan-name"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-plan-paddlePriceId">{t("paddlePriceId")}</Label>
            <Input
              id="edit-plan-paddlePriceId"
              {...register("paddlePriceId")}
              placeholder="pri_..."
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-plan-maxProjects">{t("maxProjects")}</Label>
              <Input
                id="edit-plan-maxProjects"
                type="number"
                min={1}
                {...register("maxProjects", { valueAsNumber: true })}
                error={errors.maxProjects?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan-maxStorageMB">{t("maxStorageMB")}</Label>
              <Input
                id="edit-plan-maxStorageMB"
                type="number"
                min={1}
                {...register("maxStorageMB", { valueAsNumber: true })}
                error={errors.maxStorageMB?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan-maxFileSizeMB">{t("maxFileSizeMB")}</Label>
              <Input
                id="edit-plan-maxFileSizeMB"
                type="number"
                min={1}
                {...register("maxFileSizeMB", { valueAsNumber: true })}
                error={errors.maxFileSizeMB?.message}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-plan-monthlyPrice">{t("monthlyPrice")}</Label>
              <Input
                id="edit-plan-monthlyPrice"
                type="number"
                min={0}
                {...register("monthlyPrice", { valueAsNumber: true })}
                error={errors.monthlyPrice?.message}
              />
              <p className="text-xs text-muted-foreground">{t("priceInCents")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan-displayOrder">{t("displayOrder")}</Label>
              <Input
                id="edit-plan-displayOrder"
                type="number"
                {...register("displayOrder", { valueAsNumber: true })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isFree}
              onCheckedChange={(checked) =>
                setValue("isFree", checked === true)
              }
            />
            {t("isFree")}
          </label>
          {serverError && (
            <p className="text-sm text-red-500">{serverError}</p>
          )}
          <DialogFooter>
            <Button type="submit" isLoading={isSubmitting}>
              {isSubmitting ? t("saving") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
