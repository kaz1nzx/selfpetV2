import Link from "next/link";
import { requireGlobalAdmin } from "@/lib/auth";
import { adminDeleteOrganization } from "@/app/actions/data";
import { dateBR } from "@/lib/format";
import { ConfirmButton } from "@/components/confirm-button";
import { Feedback } from "@/components/feedback";

export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const search = (q.busca ?? "").slice(0, 120);
  const page = Math.max(1, Number(q.pagina ?? 1) || 1);
  const { supabase } = await requireGlobalAdmin();
  const { data, error } = await supabase.rpc("admin_organizations", { p_page: page, p_search: search });
  if (error) throw new Error("Não foi possível carregar a administração global.");
  const payload = (data ?? {}) as any;
  const rows = payload.rows ?? [];

  return <>
    <Feedback query={q} />
    <div className="page-head admin-head">
      <div><span className="badge">Administrador global</span><h1>Empresas</h1><p className="muted">Gerencie organizações, assinaturas e contas do SelfPet.</p></div>
    </div>
    <form className="card admin-search">
      <input name="busca" defaultValue={search} placeholder="Pesquisar empresa..." />
      <button className="btn">Pesquisar</button>
    </form>
    <div className="table-wrap">
      {!rows.length ? <div className="empty">Nenhuma empresa encontrada.</div> : <table>
        <thead><tr><th>Empresa</th><th>Plano</th><th>Status</th><th>Vencimento</th><th>Pets</th><th>Ações</th></tr></thead>
        <tbody>{rows.map((o: any) => <tr key={o.id}>
          <td><b>{o.name}</b><div className="muted">{o.email || "—"}</div></td>
          <td>{o.plan}</td>
          <td><span className="badge">{o.effective_status}</span></td>
          <td>{o.expires_at ? dateBR(o.expires_at) : "—"}</td>
          <td>{o.pet_count}</td>
          <td><div className="row-actions">
            <Link className="btn secondary" href={`/admin/${o.id}`}>Gerenciar</Link>
            <form action={adminDeleteOrganization}>
              <input type="hidden" name="organizationId" value={o.id} />
              <ConfirmButton message={`Excluir DEFINITIVAMENTE a conta "${o.name}"?\n\nIsso apaga a empresa, todos os dados (pets, tutores, serviços, agenda e financeiro) e os usuários de login dela. Esta ação não pode ser desfeita.`}>Excluir conta</ConfirmButton>
            </form>
          </div></td>
        </tr>)}</tbody>
      </table>}
    </div>
    <div className="pagination">
      <span className="muted">{payload.count ?? 0} empresa(s)</span>
      <div className="actions">
        {page > 1 && <Link className="btn ghost" href={`/admin?busca=${encodeURIComponent(search)}&pagina=${page - 1}`}>Anterior</Link>}
        {page * 20 < (payload.count ?? 0) && <Link className="btn ghost" href={`/admin?busca=${encodeURIComponent(search)}&pagina=${page + 1}`}>Próxima</Link>}
      </div>
    </div>
  </>;
}
