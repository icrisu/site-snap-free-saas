"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ActivePlan } from "@/lib/actions/billing";

type PlanCardProps = {
  plan: ActivePlan;
  isCurrent: boolean;
  onSelect: (plan: ActivePlan) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  isCancelLoading?: boolean;
  disabled?: boolean;
};

export function PlanCard({
  plan,
  isCurrent,
  onSelect,
  onCancel,
  isLoading,
  isCancelLoading,
  disabled,
}: PlanCardProps) {
  const t = useTranslations("dashboard.subscription");

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col p-6",
        isCurrent && "border-primary ring-1 ring-primary",
      )}
    >
      {isCurrent && (
        <Badge className="absolute -top-2.5 left-4">
          {t("currentPlan")}
        </Badge>
      )}

      <h3 className="text-lg font-semibold">{plan.name}</h3>

      <div className="mt-2">
        {plan.isFree ? (
          <span className="text-3xl font-bold">{t("free")}</span>
        ) : (
          <div>
            <span className="text-3xl font-bold">
              {formatPrice(plan.monthlyPrice, plan.currency)}
            </span>
            <span className="text-muted-foreground">/{t("month")}</span>
          </div>
        )}
      </div>

      <ul className="mt-4 flex-1 space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          {plan.maxProjects} {t("projects")}
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          {plan.maxStorageMB}MB {t("storage")}
        </li>
        <li className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          {plan.maxFileSizeMB}MB {t("maxFileSize")}
        </li>
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>

      {isCurrent && onCancel ? (
        <Button
          className="mt-6 w-full"
          variant="destructive"
          onClick={onCancel}
          isLoading={isCancelLoading}
          disabled={isCancelLoading}
        >
          {t("cancelSubscription")}
        </Button>
      ) : (
        <Button
          className="mt-6 w-full"
          variant={isCurrent ? "secondary" : "default"}
          disabled={isCurrent || isLoading || disabled}
          onClick={() => onSelect(plan)}
          isLoading={isLoading}
        >
          {isCurrent ? t("currentPlan") : plan.isFree ? t("downgrade") : t("upgrade")}
        </Button>
      )}
    </Card>
  );
}
