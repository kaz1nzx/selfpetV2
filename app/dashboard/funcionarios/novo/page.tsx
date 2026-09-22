import { createEmployee } from "@/app/actions/data";

export default async function NovoFuncionario({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  return <>
    <div className="page-head"><div><h1>Novo funcionário</h1><p className="muted">Cadastre um membro da equipe.</p></div></div>
    {q.erro && <div className="error">Confira os dados.</div>}
    <form className="card form" action={createEmployee}><div className="grid two"><F label="Nome" name="name" required /><F label="Cargo" name="role" /><F label="Telefone" name="phone" /><F label="Email" name="email" type="email" /></div><button className="btn">Salvar funcionário</button></form>
  </>;
}

function F({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return <div className="field"><label>{label}</label><input name={name} type={type} required={required} /></div>;
}