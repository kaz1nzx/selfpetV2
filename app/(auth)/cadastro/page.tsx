import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

export default async function Cadastro({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const qs = await searchParams;
  return (
    <main className="auth-wrap">
      <aside className="auth-aside">
        <img className="auth-photo" src="/dono.png" alt="" aria-hidden />
        <div className="auth-aside-inner">
          <Link href="/" className="auth-logo" aria-label="SelfPet">
            <img src="/logo.png" alt="SelfPet" />
            <span>SelfPet</span>
          </Link>
          <div className="auth-aside-copy">
            <h2>Comece a cuidar<br />com <em>organização</em>.</h2>
            <p>Crie a conta da sua empresa em minutos. Sem cartão, sem complicação.</p>
          </div>
          <ul className="auth-points">
            <li>Plano Free para começar</li>
            <li>Até 10 pets sem pagar nada</li>
            <li>Evolua quando quiser</li>
          </ul>
        </div>
      </aside>
      <div className="auth-panel">
        <div className="card auth-card">
          <Link href="/" className="auth-card-logo" aria-label="SelfPet home">
            <img src="/logo.png" alt="SelfPet" />
          </Link>
          <span className="auth-eyebrow">Grátis para começar</span>
          <h1>Criar conta</h1>
          <p className="muted">Sua empresa começa no plano Free.</p>
          {qs.erro && <div className="error">Não foi possível criar a conta. Confira os dados.</div>}
          <form className="form" action={registerAction}>
            <div className="field"><label>Seu nome</label><input name="name" required /></div>
            <div className="field"><label>Nome da empresa</label><input name="organizationName" required /></div>
            <div className="field"><label>Email</label><input name="email" type="email" required /></div>
            <div className="field"><label>Senha</label><input name="password" type="password" minLength={8} required /></div>
            <button className="btn" type="submit">Criar conta grátis</button>
          </form>
          <p className="muted auth-alt">Já possui conta? <Link href="/login"><b>Entrar</b></Link></p>
        </div>
      </div>
    </main>
  );
}
