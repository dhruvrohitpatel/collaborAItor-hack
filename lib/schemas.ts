import { z } from "zod";

export const availabilitySlotSchema = z.object({
  day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
});

export const studentIntakeSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  timezone: z.string().min(2),
  availability: z.array(availabilitySlotSchema).min(1),
  strengths: z.array(z.string().min(1)).min(1),
  growthAreas: z.array(z.string().min(1)).min(1),
  preferredRole: z.string().min(2),
  communicationStyle: z.enum([
    "direct",
    "collaborative",
    "reflective",
    "facilitative",
    "analytical"
  ]),
  collaborationPreferences: z.array(z.string().min(1)).min(1),
  shortReflection: z.string().min(10)
});

export const generateTeamsInputSchema = z.object({
  teamSize: z.number().int().min(2).max(6).default(4)
});

export type StudentIntakeInput = z.infer<typeof studentIntakeSchema>;
export type GenerateTeamsInput = z.infer<typeof generateTeamsInputSchema>;
