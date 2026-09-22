import { AppointmentCalendar } from "@/components/appointment-calendar";
import { dateBR, money } from "@/lib/format";
import { canUse, membershipWithPlan } from "@/lib/plan";
import { FeatureLocked } from "@/components/plan-gate";
import { Feedback } from "@/components/feedback";

export default async function Atendimentos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const { supabase, membership, plan } = await membershipWithPlan();
  const org = membership.organization_id;

  const head = <div className="page-head"><div><h1>Atendimentos</h1><p className="muted">Agendamentos futuros no calendário e histórico abaixo.</p></div></div>;

  if (!canUse(plan, "agenda")) {
    return <>
      {head}
      <FeatureLocked
        title="Agenda de atendimentos"
        description="Marque banhos, tosas e consultas num calendário, acompanhe o que já foi concluído e mantenha o histórico de cada pet. Disponível nos planos Premium e Pro."
      />
    </>;
  }

  const [{ data: appointments }, { data: customers }, { data: pets }, { data: employees }, { data: services }, { data: records }] = await Promise.all([
    supabase.from("appointments").select("id,customer_id,pet_id,employee_id,service_id,starts_at,status,notes,customers(name),pets(name),employees(name),services(name)").eq("organization_id", org).order("starts_at"),
    supabase.from("customers").select("id,name").eq("organization_id", org).order("name"),
    supabase.from("pets").select("id,name,customer_id").eq("organization_id", org).order("name"),
    supabase.from("employees").select("id,name").eq("organization_id", org).eq("active", true).order("name"),
    supabase.from("services").select("id,name").eq("organization_id", org).eq("active", true).order("name"),
    supabase.from("service_records").select("id,performed_at,total_cents,status,pets(name),customers(name),employees(name),service_record_services(service_name)").eq("organization_id", org).order("performed_at", { ascending: false }).limit(50),
  ]);

  return <>
    {head}
    <Feedback query={q} />
    <div className="card calendar-card">
      <AppointmentCalendar appointments={(appointments ?? []) as any} customers={customers ?? []} pets={pets ?? []} employees={employees ?? []} services={services ?? []} />
    </div>
    <div className="page-head section-head"><div><h1>Histórico</h1><p className="muted">Atendimentos já registrados para os pets.</p></div></div>
    <div className="table-wrap">
      {!records?.length ? <div className="empty">Nenhum atendimento registrado.</div> : <table>
        <thead><tr><th>Data</th><th>Pet</th><th>Cliente</th><th>Serviço</th><th>Funcionário</th><th>Valor</th></tr></thead>
        <tbody>{records.map((r: any) => <tr key={r.id}>
          <td>{dateBR(r.performed_at)}</td>
          <td>{r.pets?.name}</td>
          <td>{r.customers?.name}</td>
          <td>{r.service_record_services?.map((s: any) => s.service_name).join(", ")}</td>
          <td>{r.employees?.name || "—"}</td>
          <td>{money(r.total_cents)}</td>
        </tr>)}</tbody>
      </table>}
    </div>
  </>;
}
