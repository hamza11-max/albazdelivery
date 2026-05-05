import { z } from "zod"
import type { FeatureOverridesInput } from "./resolve-entitlements"

const supportSchema = z.enum(["email", "email_phone", "priority", "dedicated"])

/**
 * PATCH body for admin feature overrides — partial, unknown keys rejected via .strict().
 */
export const featureOverridesPatchSchema = z
  .object({
    maxProducts: z.number().finite(),
    maxUsers: z.number().finite(),
    maxLocations: z.number().finite(),
    cloudSync: z.boolean(),
    apiAccess: z.boolean(),
    whatsappFlows: z.boolean(),
    salesHistoryMonths: z.number().finite(),
    support: supportSchema,
    rfid: z.boolean(),
  })
  .partial()
  .strict()

export type FeatureOverridesPatchBody = z.infer<typeof featureOverridesPatchSchema>

/** Merge server-stored overrides with patched fields (validated). */
export function mergeFeatureOverridesJson(
  existing: unknown | null | undefined,
  patch: FeatureOverridesPatchBody
): FeatureOverridesInput {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {}
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) base[k] = v
  }
  return base as FeatureOverridesInput
}
