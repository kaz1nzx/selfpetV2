import Link from "next/link";
import { requireMembership } from "@/lib/auth";
import { signedMediaUrl } from "@/lib/media";
import { Feedback } from "@/components/feedback";

const species: Record<string, string> = { DOG: "Cachorro", CAT: "Gato", OTHER: "Outro" };

export default async function Pets({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const search = (q.busca ?? "").trim().slice(0, 120);
  const { supabase, membership } = await requireMembership();
  let query = supabase.from("pets")
    .select("id,name,species,breed,sex,notes,photo_path,customers(name)")
    .eq("organization_id", membership.organization_id);
  if (search) query = query.ilike("name", `%${search}%`);
  const { data } = await query.order("created_at", { ascending: false }).limit(100);
  const pets = await Promise.all((data ?? []).map(async (p: any) => ({ ...p, photoUrl: await signedMediaUrl(supabase, p.photo_path) })));

  return <>
    <Feedback query={q} />
    <div className="page-head">
      <div><h1>Pets</h1><p className="muted">Perfis visuais dos animais da sua empresa.</p></div>
      <Link className="btn" href="/dashboard/pets/novo">Novo pet</Link>
    </div>
    <form className="card search-form">
      <input name="busca" defaultValue={search} placeholder="Pesquisar pet pelo nome..." aria-label="Pesquisar pet pelo nome" />
      <button className="btn">Pesquisar</button>
      {search && <Link className="btn ghost" href="/dashboard/pets">Limpar</Link>}
    </form>
    {search && <p className="muted search-summary">{pets.length} resultado(s) para “{search}”.</p>}
    {!pets.length
      ? <div className="empty card">{search ? `Nenhum pet encontrado para “${search}”.` : "Nenhum pet cadastrado. Comece adicionando o primeiro animal."}</div>
      : <div className="entity-grid">{pets.map((p: any) => <article className="card entity-card" key={p.id}>
          <div className="entity-photo">{p.photoUrl ? <img src={p.photoUrl} alt={`Foto de ${p.name}`} /> : <span>🐾</span>}</div>
          <div className="entity-body">
            <div>
              <span className="badge">{species[p.species] ?? p.species}</span>
              <h2>{p.name}</h2>
              <p className="muted">{p.breed || "Raça não informada"} · {p.sex === "MALE" ? "Macho" : p.sex === "FEMALE" ? "Fêmea" : "Sexo não informado"}</p>
            </div>
            <p><b>Tutor:</b> {p.customers?.name || "—"}</p>
            {p.notes && <p className="entity-note">{p.notes}</p>}
            <div className="actions entity-actions">
              <Link className="btn secondary" href={`/dashboard/pets/${p.id}`}>Ver detalhes</Link>
              <Link className="btn ghost" href={`/dashboard/pets/${p.id}#editar`}>Editar</Link>
            </div>
          </div>
        </article>)}</div>}
  </>;
}
