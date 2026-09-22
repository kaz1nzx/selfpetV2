import { requireMembership } from "@/lib/auth";

export type Plan = "FREE" | "PREMIUM" | "PRO";
export type Feature = "financeiro" | "agenda";

/** Quais planos liberam cada recurso. Premium+ = PREMIUM e PRO. */
const FEATURE_PLANS: Record<Feature, Plan[]> = {
  financeiro: ["PREMIUM", "PRO"],
  agenda: ["PREMIUM", "PRO"],
};

export const FEATURE_LABELS: Record<Feature, string> = {
  financeiro: "Fluxo financeiro e saldo",
  agenda: "Agenda de atendimentos",
};

type SubscriptionRow = { plan?: string | null; status?: string | null; expires_at?: string | null } | null | undefined;

/**
 * Plano que realmente vale para liberar recursos. Segue a mesma regra do painel
 * global: assinatura não-ACTIVE ou já vencida cai para FREE.
 */
export function effectivePlan(subscription: SubscriptionRow): Plan {
  const plan = String(subscription?.plan ?? "FREE").toUpperCase();
  if (plan !== "PREMIUM" && plan !== "PRO") return "FREE";
  if (String(subscription?.status ?? "").toUpperCase() !== "ACTIVE") return "FREE";
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at).getTime() : null;
  if (expiresAt !== null && Number.isFinite(expiresAt) && expiresAt <= Date.now()) return "FREE";
  return plan;
}

export function canUse(plan: Plan, feature: Feature) {
  return FEATURE_PLANS[feature].includes(plan);
}

/** requireMembership + o plano efetivo da organização. */
export async function membershipWithPlan() {
  const context = await requireMembership();
  const { data } = await context.supabase
    .from("subscriptions")
    .select("plan,status,expires_at")
    .eq("organization_id", context.membership.organization_id)
    .maybeSingle();
  return { ...context, plan: effectivePlan(data) };
}
