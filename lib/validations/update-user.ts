import { z } from "zod";

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    emailVerified: z.boolean(),
    role: z.enum(["ADMIN", "CUSTOMER"]),
    planId: z.string().optional(),
    overrideMaxProjects: z.number().int().min(1).nullable().optional(),
    overrideMaxStorageMB: z.number().int().min(1).nullable().optional(),
    overrideReason: z.string().optional(),
    newPassword: z.string().min(8).optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => !data.newPassword || data.newPassword === data.confirmPassword,
    { message: "Passwords do not match", path: ["confirmPassword"] },
  );

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
