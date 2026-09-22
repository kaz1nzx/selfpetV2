"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireGlobalAdmin, requireMembership } from "@/lib/auth";
import { canUse, membershipWithPlan, type Feature } from "@/lib/plan";
import { appointmentSchema, customerSchema, employeeSchema, financialTransactionSchema, petSchema, serviceSchema } from "@/lib/validation";

function text(fd: FormData, key: string) { return String(fd.get(key) ?? ""); }

function appointmentSaveError(error: { message: string }): never {
  const codes: Record<string, string> = {
    APPOINTMENT_SERVICE_REQUIRED: "agendamento-sem-servico",
    APPOINTMENT_REOPEN_REQUIRED: "agendamento-concluido",
    APPOINTMENT_HAS_PAYMENTS: "agendamento-com-pagamentos",
  };
  redirect(`/dashboard/atendimentos?erro=${codes[error.message] ?? "falha-ao-salvar"}`);
}

function revalidateAppointmentFinancials() {
  revalidatePath("/dashboard/atendimentos");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pets/[id]", "page");
}

/** Recursos pagos (Premium+). Bloqueia no servidor, não só na interface. */
async function requireFeature(feature: Feature, redirectTo: string) {
  const context = await membershipWithPlan();
  if (!canUse(context.plan, feature)) redirect(`${redirectTo}?erro=plano-insuficiente`);
  return context;
}
function parseLocalDate(value: string, offsetMinutes: number) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match;
  const utc = Date.UTC(Number(y), Number(m)-1, Number(d), Number(hh), Number(mm)) + offsetMinutes * 60_000;
  const result = new Date(utc);
  return Number.isNaN(result.getTime()) ? null : result;
}

export async function createCustomer(formData: FormData) {
  const { supabase, membership } = await requireMembership();
  const parsed = customerSchema.safeParse({ name:text(formData,"name"), phone:text(formData,"phone"), whatsapp:text(formData,"whatsapp"), email:text(formData,"email"), address:text(formData,"address"), notes:text(formData,"notes") });
  if (!parsed.success) redirect("/dashboard/clientes/novo?erro=dados-invalidos");
  const { error } = await supabase.from("customers").insert({ organization_id: membership.organization_id, ...parsed.data });
  if (error) redirect("/dashboard/clientes/novo?erro=falha-ao-salvar");
  revalidatePath("/dashboard/clientes"); redirect("/dashboard/clientes");
}

export async function updateCustomer(formData: FormData) {
  const { supabase, membership } = await requireMembership();
  const id = text(formData,"id");
  const returnTo = text(formData,"returnTo") || `/dashboard/clientes/${id}`;
  const parsed = customerSchema.safeParse({ name:text(formData,"name"), phone:text(formData,"phone"), whatsapp:text(formData,"whatsapp"), email:text(formData,"email"), address:text(formData,"address"), notes:text(formData,"notes") });
  if (!id || !parsed.success) redirect(`${returnTo}?erro=dados-invalidos`);
  const { error } = await supabase.from("customers").update(parsed.data).eq("id",id).eq("organization_id",membership.organization_id);
  if (error) redirect(`${returnTo}?erro=falha-ao-salvar`);
  revalidatePath("/dashboard/clientes"); revalidatePath(returnTo); redirect(`${returnTo}?salvo=1`);
}

export async function createPet(formData: FormData) {
  const { supabase, membership } = await requireMembership();
  const parsed = petSchema.safeParse({ customerId:text(formData,"customerId"), name:text(formData,"name"), species:text(formData,"species"), breed:text(formData,"breed"), sex:text(formData,"sex"), birthDate:text(formData,"birthDate"), weight:text(formData,"weight"), color:text(formData,"color"), notes:text(formData,"notes") });
  if (!parsed.success) redirect("/dashboard/pets/novo?erro=dados-invalidos");
  const { customerId,birthDate,weight,...rest }=parsed.data;
  const { data: customer } = await supabase.from("customers").select("id").eq("id",customerId).eq("organization_id",membership.organization_id).maybeSingle();
  if (!customer) redirect("/dashboard/pets/novo?erro=tutor-invalido");
  const { data: pet, error } = await supabase.from("pets").insert({ organization_id:membership.organization_id, customer_id:customerId, birth_date:birthDate||null, weight:weight===""?null:Number(weight), ...rest }).select("id").single();
  if (error || !pet) { const m=error?.message?.toLowerCase()||""; redirect(`/dashboard/pets/novo?erro=${m.includes("limit")||m.includes("quota")?"limite-do-plano":"falha-ao-salvar"}`); }
  revalidatePath("/dashboard/pets"); redirect(`/dashboard/pets/${pet.id}`);
}

export async function updatePet(formData: FormData) {
  const { supabase, membership } = await requireMembership(); const id=text(formData,"id");
  const parsed=petSchema.safeParse({ customerId:text(formData,"customerId"), name:text(formData,"name"), species:text(formData,"species"), breed:text(formData,"breed"), sex:text(formData,"sex"), birthDate:text(formData,"birthDate"), weight:text(formData,"weight"), color:text(formData,"color"), notes:text(formData,"notes") });
  if(!id||!parsed.success) redirect(`/dashboard/pets/${id}?erro=dados-invalidos`);
  const {customerId,birthDate,weight,...rest}=parsed.data;
  const {data:customer}=await supabase.from("customers").select("id").eq("id",customerId).eq("organization_id",membership.organization_id).maybeSingle();
  if(!customer) redirect(`/dashboard/pets/${id}?erro=tutor-invalido`);
  const {error}=await supabase.from("pets").update({customer_id:customerId,birth_date:birthDate||null,weight:weight===""?null:Number(weight),...rest}).eq("id",id).eq("organization_id",membership.organization_id);
  if(error) redirect(`/dashboard/pets/${id}?erro=falha-ao-salvar`);
  revalidatePath("/dashboard/pets"); revalidatePath(`/dashboard/pets/${id}`); redirect(`/dashboard/pets/${id}?salvo=1`);
}

export async function createService(formData: FormData) { const {supabase,membership}=await requireMembership(); const parsed=serviceSchema.safeParse({name:text(formData,"name"),description:text(formData,"description"),price:text(formData,"price")}); if(!parsed.success)redirect("/dashboard/servicos/novo?erro=dados-invalidos"); const {error}=await supabase.from("services").insert({organization_id:membership.organization_id,name:parsed.data.name,description:parsed.data.description,price_cents:Math.round(parsed.data.price*100)}); if(error)redirect("/dashboard/servicos/novo?erro=falha-ao-salvar"); revalidatePath("/dashboard/servicos");redirect("/dashboard/servicos"); }

export async function createEmployee(formData: FormData) { const {supabase,membership}=await requireMembership(); const parsed=employeeSchema.safeParse({name:text(formData,"name"),phone:text(formData,"phone"),email:text(formData,"email"),role:text(formData,"role")}); if(!parsed.success)redirect("/dashboard/funcionarios/novo?erro=dados-invalidos"); const {data,error}=await supabase.from("employees").insert({organization_id:membership.organization_id,...parsed.data}).select("id").single(); if(error||!data)redirect("/dashboard/funcionarios/novo?erro=falha-ao-salvar"); revalidatePath("/dashboard/funcionarios");redirect(`/dashboard/funcionarios/${data.id}`); }

export async function updateEmployee(formData: FormData) { const {supabase,membership}=await requireMembership(); const id=text(formData,"id"); const parsed=employeeSchema.safeParse({name:text(formData,"name"),phone:text(formData,"phone"),email:text(formData,"email"),role:text(formData,"role")}); if(!id||!parsed.success)redirect(`/dashboard/funcionarios/${id}?erro=dados-invalidos`); const {error}=await supabase.from("employees").update({...parsed.data,active:text(formData,"active")==="true"}).eq("id",id).eq("organization_id",membership.organization_id); if(error)redirect(`/dashboard/funcionarios/${id}?erro=falha-ao-salvar`); revalidatePath("/dashboard/funcionarios");revalidatePath(`/dashboard/funcionarios/${id}`);redirect(`/dashboard/funcionarios/${id}?salvo=1`); }

async function validateAppointmentRefs(supabase:any, org:string, customerId:string, petId:string, employeeId:string, serviceId:string){
  const [{data:customer},{data:pet},{data:employee},{data:service}]=await Promise.all([
    supabase.from("customers").select("id").eq("organization_id",org).eq("id",customerId).maybeSingle(),
    supabase.from("pets").select("id").eq("organization_id",org).eq("id",petId).eq("customer_id",customerId).maybeSingle(),
    employeeId?supabase.from("employees").select("id").eq("organization_id",org).eq("id",employeeId).maybeSingle():Promise.resolve({data:{id:"ok"}}),
    serviceId?supabase.from("services").select("id").eq("organization_id",org).eq("id",serviceId).maybeSingle():Promise.resolve({data:{id:"ok"}}),
  ]); return !!customer&&!!pet&&!!employee&&!!service;
}
export async function createAppointment(formData:FormData){const {supabase,membership,user}=await requireFeature("agenda","/dashboard/atendimentos"); const parsed=appointmentSchema.safeParse({customerId:text(formData,"customerId"),petId:text(formData,"petId"),employeeId:text(formData,"employeeId"),serviceId:text(formData,"serviceId"),startsAt:text(formData,"startsAt"),notes:text(formData,"notes")}); if(!parsed.success)redirect("/dashboard/atendimentos?erro=dados-invalidos"); const p=parsed.data;if(!await validateAppointmentRefs(supabase,membership.organization_id,p.customerId,p.petId,p.employeeId,p.serviceId))redirect("/dashboard/atendimentos?erro=referencia-invalida"); const start=parseLocalDate(p.startsAt,Number(text(formData,"timezoneOffset"))||0);if(!start)redirect("/dashboard/atendimentos?erro=data-invalida"); const {error}=await supabase.from("appointments").insert({organization_id:membership.organization_id,customer_id:p.customerId,pet_id:p.petId,employee_id:p.employeeId||null,service_id:p.serviceId||null,starts_at:start.toISOString(),status:"SCHEDULED",notes:p.notes,created_by:user.id}); if(error)redirect("/dashboard/atendimentos?erro=falha-ao-salvar");revalidatePath("/dashboard/atendimentos");redirect("/dashboard/atendimentos?salvo=1");}
export async function updateAppointment(formData: FormData) {
  const { supabase, membership } = await requireFeature("agenda", "/dashboard/atendimentos");
  const id = text(formData, "id");
  const status = text(formData, "status");
  const parsed = appointmentSchema.safeParse({ customerId: text(formData, "customerId"), petId: text(formData, "petId"), employeeId: text(formData, "employeeId"), serviceId: text(formData, "serviceId"), startsAt: text(formData, "startsAt"), notes: text(formData, "notes") });
  if (!id || !parsed.success || !["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) redirect("/dashboard/atendimentos?erro=dados-invalidos");
  const p = parsed.data;
  if (!await validateAppointmentRefs(supabase, membership.organization_id, p.customerId, p.petId, p.employeeId, p.serviceId)) redirect("/dashboard/atendimentos?erro=referencia-invalida");
  const start = parseLocalDate(p.startsAt, Number(text(formData, "timezoneOffset")) || 0);
  if (!start) redirect("/dashboard/atendimentos?erro=data-invalida");
  const { data, error } = await supabase.from("appointments").update({ customer_id: p.customerId, pet_id: p.petId, employee_id: p.employeeId || null, service_id: p.serviceId || null, starts_at: start.toISOString(), status, notes: p.notes }).eq("id", id).eq("organization_id", membership.organization_id).select("id");
  if (error) appointmentSaveError(error);
  if (!data?.length) redirect("/dashboard/atendimentos?erro=sem-permissao");
  revalidateAppointmentFinancials();
  redirect("/dashboard/atendimentos?salvo=1");
}

export async function adminSubscriptionAction(formData:FormData){const {supabase}=await requireGlobalAdmin();const org=text(formData,"organizationId"),action=text(formData,"action"),plan=text(formData,"plan"),notes=text(formData,"notes");if(!org||!["ACTIVATE","RENEW","CANCEL","CHANGE"].includes(action)||!["FREE","PREMIUM","PRO"].includes(plan))redirect(`/admin/${org}?erro=acao-invalida`);const {error}=await supabase.rpc("admin_subscription",{p_org:org,p_action:action,p_plan:plan,p_notes:notes});if(error)redirect(`/admin/${org}?erro=${encodeURIComponent(error.message)}`);revalidatePath("/admin");revalidatePath(`/admin/${org}`);redirect(`/admin/${org}?salvo=1`);}

export async function createFinancialTransaction(formData:FormData){const {supabase,membership}=await requireFeature("financeiro","/dashboard");const parsed=financialTransactionSchema.safeParse({type:formData.get("type"),description:formData.get("description"),category:formData.get("category"),amount:formData.get("amount")});if(!parsed.success)redirect("/dashboard?erro=lancamento-invalido");const {error}=await supabase.from("financial_transactions").insert({organization_id:membership.organization_id,type:parsed.data.type,description:parsed.data.description,category:parsed.data.category,amount_cents:Math.round(parsed.data.amount*100)});if(error){const m=error.message.toLowerCase(),missing=error.code==="42P01"||error.code==="PGRST205",perm=error.code==="42501"||m.includes("permission denied");redirect(`/dashboard?erro=${missing?"tabela-financeira":perm?"permissao-financeira":"falha-ao-salvar-lancamento"}`)}revalidatePath("/dashboard");redirect("/dashboard")}
export async function deleteFinancialTransaction(formData:FormData){const {supabase,membership}=await requireFeature("financeiro","/dashboard");const id=text(formData,"id");if(!id)redirect("/dashboard?erro=lancamento-invalido");await supabase.from("financial_transactions").delete().eq("id",id).eq("organization_id",membership.organization_id);revalidatePath("/dashboard");redirect("/dashboard")}

/* ===========================================================
   Exclusão e edição — tutores, pets, serviços e agendamentos
   Um delete bloqueado por RLS não retorna erro no Supabase: ele
   apenas afeta 0 linhas. Por isso todo delete usa .select() e
   confere se alguma linha voltou antes de dar sucesso.
   =========================================================== */

export async function deleteCustomer(formData: FormData) {
  const { supabase, membership } = await requireMembership();
  const id = text(formData, "id");
  if (!id) redirect("/dashboard/clientes?erro=dados-invalidos");
  const org = membership.organization_id;
  const { count } = await supabase.from("pets").select("id", { count: "exact", head: true }).eq("customer_id", id).eq("organization_id", org);
  if (count) redirect(`/dashboard/clientes/${id}?erro=tutor-com-pets`);
  await supabase.from("appointments").delete().eq("customer_id", id).eq("organization_id", org);
  const { data, error } = await supabase.from("customers").delete().eq("id", id).eq("organization_id", org).select("id");
  if (error) redirect(`/dashboard/clientes/${id}?erro=${error.code === "23503" ? "tutor-com-historico" : "falha-ao-excluir"}`);
  if (!data?.length) redirect(`/dashboard/clientes/${id}?erro=sem-permissao`);
  revalidatePath("/dashboard/clientes"); revalidatePath("/dashboard");
  redirect("/dashboard/clientes?removido=1");
}

export async function deletePet(formData: FormData) {
  const { supabase, membership } = await requireMembership();
  const id = text(formData, "id");
  if (!id) redirect("/dashboard/pets?erro=dados-invalidos");
  const org = membership.organization_id;
  await supabase.from("appointments").delete().eq("pet_id", id).eq("organization_id", org);
  const { data, error } = await supabase.from("pets").delete().eq("id", id).eq("organization_id", org).select("id");
  if (error) redirect(`/dashboard/pets/${id}?erro=${error.code === "23503" ? "pet-com-historico" : "falha-ao-excluir"}`);
  if (!data?.length) redirect(`/dashboard/pets/${id}?erro=sem-permissao`);
  revalidatePath("/dashboard/pets"); revalidatePath("/dashboard");
  redirect("/dashboard/pets?removido=1");
}

export async function updateService(formData: FormData) {
  const { supabase, membership } = await requireMembership();
  const id = text(formData, "id");
  const parsed = serviceSchema.safeParse({ name: text(formData, "name"), description: text(formData, "description"), price: text(formData, "price") });
  if (!id || !parsed.success) redirect(`/dashboard/servicos/${id}?erro=dados-invalidos`);
  const { data, error } = await supabase.from("services")
    .update({ name: parsed.data.name, description: parsed.data.description, price_cents: Math.round(parsed.data.price * 100), active: text(formData, "active") === "true" })
    .eq("id", id).eq("organization_id", membership.organization_id).select("id");
  if (error) redirect(`/dashboard/servicos/${id}?erro=falha-ao-salvar`);
  if (!data?.length) redirect(`/dashboard/servicos/${id}?erro=sem-permissao`);
  revalidatePath("/dashboard/servicos"); revalidatePath(`/dashboard/servicos/${id}`);
  redirect(`/dashboard/servicos/${id}?salvo=1`);
}

export async function deleteService(formData: FormData) {
  const { supabase, membership } = await requireMembership();
  const id = text(formData, "id");
  if (!id) redirect("/dashboard/servicos?erro=dados-invalidos");
  const org = membership.organization_id;
  // O histórico guarda nome e preço próprios, então basta desvincular os agendamentos.
  await supabase.from("appointments").update({ service_id: null }).eq("service_id", id).eq("organization_id", org);
  const { data, error } = await supabase.from("services").delete().eq("id", id).eq("organization_id", org).select("id");
  if (error) redirect(`/dashboard/servicos?erro=${error.code === "23503" ? "servico-em-uso" : "falha-ao-excluir"}`);
  if (!data?.length) redirect("/dashboard/servicos?erro=sem-permissao");
  revalidatePath("/dashboard/servicos");
  redirect("/dashboard/servicos?removido=1");
}

export async function setAppointmentStatus(formData: FormData) {
  const { supabase, membership } = await requireFeature("agenda", "/dashboard/atendimentos");
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!id || !["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) redirect("/dashboard/atendimentos?erro=dados-invalidos");
  const { data, error } = await supabase.from("appointments").update({ status }).eq("id", id).eq("organization_id", membership.organization_id).select("id");
  if (error) appointmentSaveError(error);
  if (!data?.length) redirect("/dashboard/atendimentos?erro=sem-permissao");
  revalidateAppointmentFinancials();
  redirect(`/dashboard/atendimentos?status=${status === "COMPLETED" ? "concluido" : "reaberto"}`);
}

export async function deleteAppointment(formData: FormData) {
  const { supabase, membership } = await requireFeature("agenda", "/dashboard/atendimentos");
  const id = text(formData, "id");
  if (!id) redirect("/dashboard/atendimentos?erro=dados-invalidos");
  const { data, error } = await supabase.from("appointments").delete().eq("id", id).eq("organization_id", membership.organization_id).select("id");
  if (error) redirect("/dashboard/atendimentos?erro=falha-ao-excluir");
  if (!data?.length) redirect("/dashboard/atendimentos?erro=sem-permissao");
  revalidatePath("/dashboard/atendimentos");
  redirect("/dashboard/atendimentos?removido=1");
}

/* Exclusão definitiva de uma conta (empresa + dados + usuários Auth) pelo
   painel global. Toda a remoção acontece na RPC security definer criada em
   supabase/admin_delete_account.sql — nenhuma service_role no frontend. */
export async function adminDeleteOrganization(formData: FormData) {
  const { supabase } = await requireGlobalAdmin();
  const org = text(formData, "organizationId");
  if (!org) redirect("/admin?erro=acao-invalida");
  const { error } = await supabase.rpc("admin_delete_organization", { p_org: org });
  if (error) {
    const message = error.message.toLowerCase();
    const reason = error.code === "PGRST202" || message.includes("could not find") || message.includes("does not exist")
      ? "rpc-ausente"
      : message.includes("forbidden")
        ? "sem-permissao-admin"
        : message.includes("not_found")
          ? "conta-nao-encontrada"
          : encodeURIComponent(error.message);
    redirect(`/admin/${org}?erro=${reason}`);
  }
  revalidatePath("/admin");
  redirect("/admin?status=conta-removida");
}
