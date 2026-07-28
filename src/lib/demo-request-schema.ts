import { z } from "zod";

export const demoRequestSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(254),
  company: z.string().trim().min(1, "Company is required").max(200),
  message: z.string().trim().max(5000).optional().default(""),
});

export type DemoRequestPayload = z.infer<typeof demoRequestSchema>;
