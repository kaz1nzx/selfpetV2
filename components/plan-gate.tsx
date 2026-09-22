import Link from "next/link";

/** Bloco mostrado no lugar de um recurso que o plano atual não libera. */
export function FeatureLocked({ title, description }: { title: string; description: string }) {
  return <section className="card plan-locked">
    <span className="plan-locked-icon" aria-hidden>🔒</span>
    <div className="plan-locked-body">
      <span className="badge">Premium</span>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
    </div>
    <Link className="btn" href="/dashboard/assinatura">Ver planos</Link>
  </section>;
}
