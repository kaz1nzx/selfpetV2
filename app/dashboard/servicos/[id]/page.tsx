import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/lib/auth";
import { deleteService, updateService } from "@/app/actions/data";
import { ConfirmButton } from "@/components/confirm-button";
import { Feedback } from "@/components/feedback";

export default async function EditarServico({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const q = await searchParams;
  const { supabase, membership } = await requireMembership();
  const { data: service } = await supabase.from("services").select("id,name,description,price_cents,active").eq("organization_id", membership.organization_id).eq("id", id).maybeSingle();
  if (!service) notFound();

  return <>
    <Feedback query={q} />
    <div className="page-head">
      <div><span className="badge">{service.active ? "Ativo" : "Inativo"}</span><h1>{service.name}</h1><p className="muted">Edite os dados do serviço ou remova-o do catálogo.</p></div>
      <Link className="btn ghost" href="/dashboard/servicos">Voltar</Link>
    </div>

    <form className="card form" action={updateService}>
      <input type="hidden" name="id" value={service.id} />
      <div className="field"><label>Nome</label><input name="name" defaultValue={service.name} required /></div>
      <div className="field"><label>Descrição</label><textarea name="description" defaultValue={service.description ?? ""} /></div>
      <div className="grid two">
        <div className="field"><label>Preço (R$)</label><input name="price" type="number" step="0.01" min="0" defaultValue={((service.price_cents ?? 0) / 100).toFixed(2)} required /></div>
        <div className="field"><label>Status</label><select name="active" defaultValue={String(service.active)}><option value="true">Ativo</option><option value="false">Inativo</option></select></div>
      </div>
      <button className="btn" type="submit">Salvar serviço</button>
    </form>

    <section className="card danger-zone">
      <div><h2>Excluir serviço</h2><p className="muted">O serviço sai do catálogo e é desvinculado dos agendamentos. O histórico de atendimentos já registrado é preservado.</p></div>
      <form action={deleteService}>
        <input type="hidden" name="id" value={service.id} />
        <ConfirmButton message={`Excluir o serviço "${service.name}"? Esta ação não pode ser desfeita.`}>Excluir serviço</ConfirmButton>
      </form>
    </section>
  </>;
}
