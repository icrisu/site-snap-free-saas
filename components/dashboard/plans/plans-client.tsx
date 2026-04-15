"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CreatePlanDialog } from "./create-plan-dialog";
import { EditPlanDialog } from "./edit-plan-dialog";
import {
  getPlans,
  retirePlan,
  type PlanRow,
} from "@/lib/actions/plans";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Archive } from "lucide-react";

export function PlansClient() {
  const t = useTranslations("dashboard.plans");
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlanRow | null>(null);

  const fetchPlans = useCallback(() => {
    startTransition(async () => {
      const result = await getPlans();
      setPlans(result);
    });
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleRetire = async (planId: string) => {
    const result = await retirePlan(planId);
    if (result.success) fetchPlans();
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("createPlan")}
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.slug")}</TableHead>
              <TableHead>{t("table.price")}</TableHead>
              <TableHead>{t("table.limits")}</TableHead>
              <TableHead>{t("table.subscribers")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner className="h-5 w-5" />
                    {t("loading")}
                  </div>
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t("noPlans")}
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    {plan.name}
                    {plan.isFree && (
                      <Badge variant="secondary" className="ml-2">
                        {t("free")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {plan.slug}
                  </TableCell>
                  <TableCell>
                    {plan.isFree
                      ? t("free")
                      : `${formatPrice(plan.monthlyPrice, plan.currency)}/mo`}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {plan.maxProjects} {t("projects")} / {plan.maxStorageMB}MB
                    </div>
                  </TableCell>
                  <TableCell>{plan._count.subscriptions}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? t("active") : t("retired")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setEditTarget(plan);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!plan.isFree && plan.isActive && (
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-orange-500 hover:text-orange-700"
                        onClick={() => handleRetire(plan.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreatePlanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchPlans}
      />

      {editTarget && (
        <EditPlanDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditTarget(null);
          }}
          plan={editTarget}
          onSuccess={fetchPlans}
        />
      )}
    </div>
  );
}
