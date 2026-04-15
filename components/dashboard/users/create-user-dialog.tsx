"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  createUserSchema,
  type CreateUserInput,
} from "@/lib/validations/create-user";
import { createUser } from "@/lib/actions/users";
import { useTranslations } from "next-intl";

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const t = useTranslations("dashboard.users.create");
  const tRoles = useTranslations("dashboard.users.roles");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "CUSTOMER",
    },
  });

  const onSubmit = async (data: CreateUserInput) => {
    setServerError("");
    const result = await createUser(data);
    if (result.success) {
      reset();
      onOpenChange(false);
      onSuccess();
    } else {
      setServerError(result.error || t("error"));
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setServerError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" {...register("name")} error={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              error={errors.password?.message}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">{t("role")}</Label>
            <Select
              defaultValue="CUSTOMER"
              onValueChange={(val) =>
                setValue("role", val as "ADMIN" | "CUSTOMER")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">{tRoles("ADMIN")}</SelectItem>
                <SelectItem value="CUSTOMER">{tRoles("CUSTOMER")}</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>
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
