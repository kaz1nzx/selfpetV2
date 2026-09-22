import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Deduplicate within a server render only; never share sessions between requests.
export const requireUser = cache(async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
});

export const requireMembership = cache(async function requireMembership() {
  const { supabase, user } = await requireUser();
  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("id, organization_id, name, email, role, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar sua organização.");
  if (!membership) redirect("/sem-organizacao");
  return { supabase, user, membership };
});

export async function requireAdmin() {
  const context = await requireMembership();
  const role = String(context.membership.role ?? "").toUpperCase();
  if (role !== "ADMIN" && role !== "OWNER") redirect("/dashboard");
  return context;
}

export async function requireGlobalAdmin() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.rpc("is_global_admin");
  if (error || data !== true) redirect("/dashboard");
  return { supabase, user };
}
