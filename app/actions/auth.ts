"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validation";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/login?erro=dados-invalidos");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/login?erro=credenciais-invalidas");
  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    organizationName: formData.get("organizationName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/cadastro?erro=dados-invalidos");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
        full_name: parsed.data.name,
        organization_name: parsed.data.organizationName,
        business_name: parsed.data.organizationName,
        trade_name: parsed.data.organizationName,
      },
    },
  });

  if (error) redirect("/cadastro?erro=falha-no-cadastro");
  if (!data.session) redirect("/login?cadastro=verifique-email");
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
