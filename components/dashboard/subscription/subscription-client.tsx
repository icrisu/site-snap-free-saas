"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UsageBar } from "./usage-bar";
import { PlanCard } from "./plan-card";
import { PaddleProvider, usePaddle } from "@/components/billing/paddle-provider";
import {
  getActivePlans,
  getMySubscription,
  type ActivePlan,
  type MySubscription,
} from "@/lib/actions/billing";
import type { EffectiveLimits } from "@/lib/billing/get-effective-limits";
import type { Usage } from "@/lib/billing/get-usage";

type SubscriptionClientProps = {
  paddleClientToken: string;
  paddleEnvironment: "sandbox" | "production";
  disableSubscriptions: boolean;
};

export function SubscriptionClient({
  paddleClientToken,
  paddleEnvironment,
  disableSubscriptions,
}: SubscriptionClientProps) {
  if (!paddleClientToken) {
    return <SubscriptionContent disableSubscriptions={disableSubscriptions} />;
  }

  return (
    <PaddleProvider clientToken={paddleClientToken} environment={paddleEnvironment}>
      <SubscriptionContent disableSubscriptions={disableSubscriptions} />
    </PaddleProvider>
  );
}

function SubscriptionContent({ disableSubscriptions }: { disableSubscriptions: boolean }) {
  const t = useTranslations("dashboard.subscription");
  const { paddle, isLoaded } = usePaddle();
  const searchParams = useSearchParams();

  const [plans, setPlans] = useState<ActivePlan[]>([]);
  const [subscription, setSubscription] = useState<MySubscription>(null);
  const [limits, setLimits] = useState<EffectiveLimits | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelRequired, setShowCancelRequired] = useState(false);
  const [showDisabledDialog, setShowDisabledDialog] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansData, subData, meRes] = await Promise.all([
        getActivePlans(),
        getMySubscription(),
        fetch("/api/me").then((r) => r.json()),
      ]);
      setPlans(plansData);
      setSubscription(subData);
      setLimits(meRes.limits);
      setUsage(meRes.usage);
    } catch (error) {
      console.error("Failed to fetch subscription data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlanSelect = async (plan: ActivePlan) => {
    console.log('disableSubscriptions', disableSubscriptions)
    if (disableSubscriptions) {
      setShowDisabledDialog(true);
      return;
    }
    setActionLoading(plan.id);
    try {
      // Route all plan changes through switch-plan first
      const switchRes = await fetch("/api/billing/switch-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const switchData = await switchRes.json();

      if (switchData.action === "cancel_required") {
        setShowCancelRequired(true);
      } else if (switchData.action === "switched") {
        await fetchData();
      } else if (switchData.action === "checkout") {
        // Free -> Paid: open Paddle checkout
        const checkoutRes = await fetch("/api/billing/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId: switchData.priceId }),
        });
        const checkoutData = await checkoutRes.json();

        if (checkoutData.clientToken) {
          if (!paddle) {
            console.error("Paddle not initialized");
            return;
          }
          paddle.Checkout.open({
            items: [{ priceId: checkoutData.priceId, quantity: 1 }],
            customData: checkoutData.customData,
            customer: { email: checkoutData.customerEmail },
            settings: {
              successUrl: `${window.location.href}?paddlePlanChange=true`,
            },
          });
        }
      }
    } catch (error) {
      console.error("Plan selection error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    setShowCancelConfirm(false);
    setActionLoading("cancel");
    try {
      await fetch("/api/billing/cancel", { method: "POST" });
      await fetchData();
    } catch (error) {
      console.error("Cancel error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const currentPlanIsPaid = limits?.isPaid && !!subscription?.paddleSubscriptionId;
  const showPlanChangeBanner =
    searchParams.get("paddlePlanChange") === "true" && !limits?.isPaid;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {showPlanChangeBanner && (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <p>{t("planChangePending")}</p>
          <Button
            variant="outline"
            size="sm"
            className="ml-4 shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t("refresh")}
          </Button>
        </div>
      )}

      {/* Current Plan & Usage */}
      {limits && usage && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{limits.planName}</h2>
              <Badge variant="outline" className="mt-1">
                {t(`status.${limits.subscriptionStatus}`)}
              </Badge>
            </div>
            {currentPlanIsPaid && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                isLoading={actionLoading === "cancel"}
              >
                {t("cancelSubscription")}
              </Button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <UsageBar
              label={t("projectsUsage")}
              current={usage.projectCount}
              max={limits.maxProjects}
            />
            <UsageBar
              label={t("storageUsage")}
              current={usage.storageMB}
              max={limits.maxStorageMB}
              unit="MB"
            />
          </div>

          {subscription?.currentPeriodEnd && (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("renewsOn")}{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">{t("availablePlans")}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.slug === limits?.planSlug;
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={isCurrent}
                onSelect={handlePlanSelect}
                onCancel={isCurrent && currentPlanIsPaid ? handleCancel : undefined}
                isLoading={actionLoading === plan.id}
                disabled={!plan.isFree && !isLoaded}
                isCancelLoading={actionLoading === "cancel"}
              />
            );
          })}
        </div>
      </div>

      <AlertDialog open={showCancelRequired} onOpenChange={setShowCancelRequired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelRequiredTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("cancelRequiredDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowCancelRequired(false)}>
              {t("cancelRequiredAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDisabledDialog} onOpenChange={setShowDisabledDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("subscriptionsDisabledTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("subscriptionsDisabledDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDisabledDialog(false)}>
              {t("subscriptionsDisabledAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("cancelConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancelConfirmBack")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("cancelConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
