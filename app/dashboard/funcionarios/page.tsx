import Link from "next/link";
import { requireMembership } from "@/lib/auth";

export default async function Funcionarios() {
  const { supabase, membership } = await requireMembership();
  const { data } = await supabase.from("employees").select("id,name,phone,email,role,active").eq("organization_id", membership.organization_id).order("name");
  const employees = data ?? [];
  return <><div className="page-head"><div><h1>Funcionários</h1><p className="muted">Equipe do estabelecimento.</p></div><Link className="btn" href="/dashboard/funcionarios/novo">Novo funcionário</Link></div>{!employees.length ? <div className="empty card">Nenhum funcionário cadastrado.</div> : <div className="entity-grid">{employees.map((e: any) => <article className="card entity-card employee-card" key={e.id}><div className="entity-photo"><span>👤</span></div><div className="entity-body"><div><span className={`badge ${e.active ? "" : "badge-muted"}`}>{e.active ? "Ativo" : "Inativo"}</span><h2>{e.name}</h2><p className="muted">{e.role || "Cargo não informado"}</p></div><p>{e.phone || "Sem telefone"}</p><p>{e.email || "Sem e-mail"}</p><Link className="btn secondary" href={`/dashboard/funcionarios/${e.id}`}>Editar</Link></div></article>)}</div>}</>;
}