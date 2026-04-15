import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  paddlePriceId: z.string().optional(),
  maxProjects: z.number().int().min(1),
  maxStorageMB: z.number().int().min(1),
  maxFileSizeMB: z.number().int().min(1),
  features: z.array(z.string()),
  displayOrder: z.number().int(),
  monthlyPrice: z.number().int().min(0),
  currency: z.string(),
  isFree: z.boolean(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema.partial().omit({ slug: true });

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
