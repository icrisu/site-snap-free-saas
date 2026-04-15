import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["ADMIN", "CUSTOMER"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
