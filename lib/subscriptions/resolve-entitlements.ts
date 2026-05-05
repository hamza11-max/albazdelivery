import {
  PLAN_FEATURES,
  subscriptionStatusGrantsPlanFeatures,
  type PlanFeatures,
} from "../subscription-plans"

/** Partial overrides stored in `Subscription.featureOverrides` and sent on admin PATCH. */
export type FeatureOverridesInput = Partial<
  Pick<
    PlanFeatures,
    | "maxProducts"
    | "maxUsers"
    | "maxLocations"
    | "cloudSync"
    | "apiAccess"
    | "whatsappFlows"
    | "salesHistoryMonths"
    | "support"
    | "rfid"
  >
>

const SUPPORT_LEVELS = ["email", "email_phone", "priority", "dedicated"] as const

const ABS_MAX_LIMIT = 10_000_000

/** Upper bound per numeric entitlement key — never exceed a practical enterprise-style ceiling. */
function clampNumericLimit(_key: keyof PlanFeatures, value: number): number {
  if (value === -1) return -1
  if (!Number.isFinite(value)) return value
  const n = Math.trunc(value)
  if (n < 0) return 0
  return Math.min(Math.max(0, n), ABS_MAX_LIMIT)
}

/** Merge validated override object into baseline (mutates baseline). */
function applyOverridesMutable(base: PlanFeatures, raw: unknown): void {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return

  const o = raw as Record<string, unknown>

  for (const key of ["cloudSync", "apiAccess", "whatsappFlows"] as const) {
    if (key in o && typeof o[key] === "boolean") {
      base[key] = o[key]
    }
  }

  if ("rfid" in o && typeof o.rfid === "boolean") {
    base.rfid = o.rfid
  }

  if (
    typeof o.support === "string" &&
    (SUPPORT_LEVELS as readonly string[]).includes(o.support)
  ) {
    base.support = o.support as PlanFeatures["support"]
  }

  for (const key of ["maxProducts", "maxUsers", "maxLocations", "salesHistoryMonths"] as const) {
    if (!(key in o) || o[key] === undefined) continue
    const v = o[key]
    if (typeof v !== "number" || !Number.isFinite(v)) continue
    base[key] = clampNumericLimit(key, v)
  }
}

/**
 * Effective entitlements for a vendor owner subscription row.
 * - When plan/status does not grant paid features, baseline is STARTER ("floor"), then overrides still apply.
 * - Overrides deep-merge validated keys on top of that baseline.
 */
export function resolveVendorEntitlements(input: {
  plan: string
  status: string
  featureOverrides?: unknown | null
}): PlanFeatures {
  const grants = subscriptionStatusGrantsPlanFeatures(input.plan, input.status)
  const planKey =
    grants && Object.prototype.hasOwnProperty.call(PLAN_FEATURES, input.plan)
      ? input.plan
      : "STARTER"
  const baseline = PLAN_FEATURES[planKey] ?? PLAN_FEATURES.STARTER
  const out: PlanFeatures = { ...baseline }
  applyOverridesMutable(out, input.featureOverrides ?? null)
  return out
}
