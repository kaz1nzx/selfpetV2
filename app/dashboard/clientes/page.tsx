import Link from "next/link";
import { requireMembership } from "@/lib/auth";
import { Feedback } from "@/components/feedback";

export default async function Clientes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const search = (q.busca ?? "").trim().slice(0, 120);
  const { supabase, membership } = await requireMembership();
  let query = supabase.from("customers")
    .select("id,name,phone,whatsapp,email,address,created_at,pets(id)")
    .eq("organization_id", membership.organization_id);
  if (search) query = query.ilike("name", `%${search}%`);
  const { data } = await query.order("created_at", { ascending: false }).limit(100);

  return <>
    <Feedback query={q} />
    <div className="page-head">
      <div><h1>Clientes</h1><p className="muted">Tutores cadastrados na sua empresa.</p></div>
      <Link className="btn" href="/dashboard/clientes/novo">Novo cliente</Link>
    </div>
    <form className="card search-form">
      <input name="busca" defaultValue={search} placeholder="Pesquisar tutor pelo nome..." aria-label="Pesquisar tutor pelo nome" />
      <button className="btn">Pesquisar</button>
      {search && <Link className="btn ghost" href="/dashboard/clientes">Limpar</Link>}
    </form>
    {search && <p className="muted search-summary">{data?.length ?? 0} resultado(s) para “{search}”.</p>}
    {!data?.length
      ? <div className="empty card">{search ? `Nenhum tutor encontrado para “${search}”.` : "Nenhum cliente cadastrado."}</div>
      : <div className="entity-grid compact">{data.map((c: any) => <article className="card customer-card" key={c.id}>
          <div className="member-avatar">{c.name?.[0]?.toUpperCase()}</div>
          <div>
            <h2>{c.name}</h2>
            <p>{c.phone || c.whatsapp || "Sem telefone"}</p>
            <p className="muted">{c.email || "Sem e-mail"}</p>
            <p className="muted">{c.pets?.length ?? 0} pet(s)</p>
          </div>
          <Link className="btn secondary" href={`/dashboard/clientes/${c.id}`}>Ver e editar</Link>
        </article>)}</div>}
  </>;
}
