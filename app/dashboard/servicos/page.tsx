import Link from "next/link";
import { requireMembership } from "@/lib/auth";
import { money } from "@/lib/format";
import { deleteService } from "@/app/actions/data";
import { ConfirmButton } from "@/components/confirm-button";
import { Feedback } from "@/components/feedback";

export default async function Servicos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const { supabase, membership } = await requireMembership();
  const { data } = await supabase.from("services").select("id,name,description,price_cents,active").eq("organization_id", membership.organization_id).order("name");

  return <>
    <Feedback query={q} />
    <div className="page-head">
      <div><h1>Serviços</h1><p className="muted">Configure o catálogo do estabelecimento.</p></div>
      <Link className="btn" href="/dashboard/servicos/novo">Novo serviço</Link>
    </div>
    <div className="table-wrap">
      {!data?.length ? <div className="empty">Nenhum serviço cadastrado.</div> : <table>
        <thead><tr><th>Serviço</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>{data.map((s: any) => <tr key={s.id}>
          <td><b>{s.name}</b><div className="muted">{s.description}</div></td>
          <td>{money(s.price_cents)}</td>
          <td><span className={`badge${s.active ? "" : " badge-muted"}`}>{s.active ? "Ativo" : "Inativo"}</span></td>
          <td><div className="row-actions">
            <Link className="btn secondary" href={`/dashboard/servicos/${s.id}`}>Editar</Link>
            <form action={deleteService}>
              <input type="hidden" name="id" value={s.id} />
              <ConfirmButton message={`Excluir o serviço "${s.name}"? Esta ação não pode ser desfeita.`}>Excluir</ConfirmButton>
            </form>
          </div></td>
        </tr>)}</tbody>
      </table>}
    </div>
  </>;
}
