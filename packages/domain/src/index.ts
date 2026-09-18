import { z } from "zod";

export const userRoles = ["donor", "patient", "admin"] as const;
export const userRoleSchema = z.enum(userRoles);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userStatuses = ["active", "disabled"] as const;
export const userStatusSchema = z.enum(userStatuses);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const bloodTypes = ["O", "A", "B", "AB"] as const;
export const bloodTypeSchema = z.enum(bloodTypes);
export type BloodType = z.infer<typeof bloodTypeSchema>;

export const rhFactors = ["+", "-"] as const;
export const rhFactorSchema = z.enum(rhFactors);
export type RhFactor = z.infer<typeof rhFactorSchema>;

export const requestPriorities = ["high", "medium", "low"] as const;
export const requestPrioritySchema = z.enum(requestPriorities);
export type RequestPriority = z.infer<typeof requestPrioritySchema>;

export const bloodRequestStatuses = ["active", "resolved"] as const;
export const bloodRequestStatusSchema = z.enum(bloodRequestStatuses);
export type BloodRequestStatus = z.infer<typeof bloodRequestStatusSchema>;

const phoneSchema = z.string().trim().regex(/^\+?[\d\s()-]{8,20}$/);

export const profileInputSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: phoneSchema.optional(),
  bloodType: bloodTypeSchema,
  rhFactor: rhFactorSchema,
  city: z.string().trim().min(1).max(160),
  available: z.boolean()
});
export type ProfileInput = z.infer<typeof profileInputSchema>;

export const bloodRequestInputSchema = z.object({
  bloodType: bloodTypeSchema,
  rhFactor: rhFactorSchema,
  hospital: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(160),
  priority: requestPrioritySchema,
  contactPhone: phoneSchema,
  contactEmail: z.string().trim().email().max(320),
  description: z.string().trim().min(10).max(300)
});
export type BloodRequestInput = z.infer<typeof bloodRequestInputSchema>;

// Orientativa para glóbulos rojos. No representa aptitud ni decisión clínica.
const compatibleRecipients: Record<`${BloodType}${RhFactor}`, readonly `${BloodType}${RhFactor}`[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"]
};

export function isOrientativelyCompatible(
  donor: Pick<ProfileInput, "bloodType" | "rhFactor">,
  recipient: Pick<BloodRequestInput, "bloodType" | "rhFactor">
): boolean {
  const donorKey = `${donor.bloodType}${donor.rhFactor}` as keyof typeof compatibleRecipients;
  const recipientKey = `${recipient.bloodType}${recipient.rhFactor}`;
  return compatibleRecipients[donorKey].includes(recipientKey as never);
}

export const compatibilityNotice =
  "La compatibilidad indicada por RedVital es orientativa. La validación definitiva corresponde al centro de salud.";

export const passwordSchema = z.string().min(8).max(128).regex(/[A-Z]/, "Debe incluir una mayúscula.").regex(/[0-9]/, "Debe incluir un número.");
export const emailSchema = z.string().trim().email().max(320).transform((value) => value.toLowerCase());
export const publicRegistrationSchema = z.object({
  firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100),
  email: emailSchema, password: passwordSchema, phone: phoneSchema,
  bloodType: bloodTypeSchema, rhFactor: rhFactorSchema, city: z.string().trim().min(1).max(160),
  role: z.enum(["donor", "patient"]), available: z.boolean().default(false)
});
export type PublicRegistration = z.infer<typeof publicRegistrationSchema>;
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128), client: z.enum(["web", "mobile"]).default("web") });
export const refreshSchema = z.object({ refreshToken: z.string().min(32).optional(), client: z.enum(["web", "mobile"]).default("web") });
export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({ token: z.string().min(32), password: passwordSchema });
export const updateProfileSchema = profileInputSchema.pick({ firstName: true, lastName: true, phone: true, bloodType: true, rhFactor: true, city: true }).partial().refine((value) => Object.keys(value).length > 0);
