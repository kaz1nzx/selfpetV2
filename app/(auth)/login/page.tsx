import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const qs = await searchParams;
  return (
    <main className="auth-wrap">
      <aside className="auth-aside">
        <img className="auth-photo" src="/login.png" alt="" aria-hidden />
        <div className="auth-aside-inner">
          <Link href="/" className="auth-logo" aria-label="SelfPet">
            <img src="/logo.png" alt="SelfPet" />
            <span>SelfPet</span>
          </Link>
          <div className="auth-aside-copy">
            <h2>Que bom<br />te ver de volta.</h2>
            <p>Seu painel de pets, clientes e atendimentos espera por você.</p>
          </div>
          <ul className="auth-points">
            <li>Ficha completa de cada pet</li>
            <li>Agenda de banho &amp; tosa</li>
            <li>Histórico sempre à mão</li>
          </ul>
        </div>
      </aside>
      <div className="auth-panel">
        <div className="card auth-card">
          <Link href="/" className="auth-card-logo" aria-label="SelfPet home">
            <img src="/logo.png" alt="SelfPet" />
          </Link>
          <span className="auth-eyebrow">Bem-vindo de volta</span>
          <h1>Entrar</h1>
          <p className="muted">Acesse o painel da sua empresa.</p>
          {qs.erro && <div className="error">Email ou senha inválidos.</div>}
          {qs.cadastro && <div className="success">Conta criada! Se a confirmação de email estiver ativa no Supabase, confirme seu email antes de entrar.</div>}
          <form className="form" action={loginAction}>
            <div className="field"><label>Email</label><input name="email" type="email" required /></div>
            <div className="field"><label>Senha</label><input name="password" type="password" minLength={6} required /></div>
            <button className="btn" type="submit">Entrar</button>
          </form>
          <p className="muted auth-alt">Ainda não tem conta? <Link href="/cadastro"><b>Criar conta</b></Link></p>
        </div>
      </div>
    </main>
  );
}
