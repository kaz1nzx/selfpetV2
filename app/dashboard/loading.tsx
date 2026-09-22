export default function Loading() {
  return <div className="card" role="status" aria-live="polite" aria-busy="true">
    <p className="muted">Carregando…</p>
  </div>;
}
