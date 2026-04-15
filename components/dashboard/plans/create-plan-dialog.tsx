"use client";

import { useState } from "react";
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
import { createPlanSchema, type CreatePlanInput } from "@/lib/validations/plan";
import { createPlan } from "@/lib/actions/plans";
import { useTranslations } from "next-intl";

type CreatePlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function CreatePlanDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePlanDialogProps) {
  const t = useTranslations("dashboard.plans.create");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlanInput>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: "",
      slug: "",
      paddlePriceId: "",
      maxProjects: 5,
      maxStorageMB: 50,
      maxFileSizeMB: 10,
      features: [],
      displayOrder: 0,
      monthlyPrice: 0,
      currency: "USD",
      isFree: false,
    },
  });

  const isFree = useWatch({ control, name: "isFree" });

  const onSubmit = async (data: CreatePlanInput) => {
    setServerError("");
    const result = await createPlan(data);
    if (result.success) {
      reset();
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
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-plan-name">{t("name")}</Label>
              <Input
                id="create-plan-name"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-plan-slug">{t("slug")}</Label>
              <Input
                id="create-plan-slug"
                {...register("slug")}
                error={errors.slug?.message}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-plan-paddlePriceId">{t("paddlePriceId")}</Label>
            <Input
              id="create-plan-paddlePriceId"
              {...register("paddlePriceId")}
              placeholder="pri_..."
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-plan-maxProjects">{t("maxProjects")}</Label>
              <Input
                id="create-plan-maxProjects"
                type="number"
                min={1}
                {...register("maxProjects", { valueAsNumber: true })}
                error={errors.maxProjects?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-plan-maxStorageMB">{t("maxStorageMB")}</Label>
              <Input
                id="create-plan-maxStorageMB"
                type="number"
                min={1}
                {...register("maxStorageMB", { valueAsNumber: true })}
                error={errors.maxStorageMB?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-plan-maxFileSizeMB">{t("maxFileSizeMB")}</Label>
              <Input
                id="create-plan-maxFileSizeMB"
                type="number"
                min={1}
                {...register("maxFileSizeMB", { valueAsNumber: true })}
                error={errors.maxFileSizeMB?.message}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-plan-monthlyPrice">{t("monthlyPrice")}</Label>
              <Input
                id="create-plan-monthlyPrice"
                type="number"
                min={0}
                {...register("monthlyPrice", { valueAsNumber: true })}
                error={errors.monthlyPrice?.message}
              />
              <p className="text-xs text-muted-foreground">{t("priceInCents")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-plan-displayOrder">{t("displayOrder")}</Label>
              <Input
                id="create-plan-displayOrder"
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
              {isSubmitting ? t("creating") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
