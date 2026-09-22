import Link from "next/link";

const items = [
  { href: "/dashboard", label: "Início", icon: "home" },
  { href: "/dashboard/pets", label: "Pets", icon: "paw" },
  { href: "/dashboard/clientes", label: "Tutores", icon: "users" },
  { href: "/dashboard/servicos", label: "Serviços", icon: "scissors" },
  { href: "/dashboard/funcionarios", label: "Equipe", icon: "badge" },
  { href: "/dashboard/atendimentos", label: "Agenda", icon: "calendar" },
  { href: "/dashboard/assinatura", label: "Plano", icon: "spark" },
] as const;

function NavIcon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "home") return <svg {...common}><path d="M4 10.5 12 4l8 6.5V20H4Z"/><path d="M9 20v-6h6v6"/></svg>;
  if (name === "paw") return <svg {...common}><path d="M8.2 11.2c-1.8.5-3.1 2.1-3.1 4 0 2.3 2 4 4.5 4 1.1 0 1.8-.5 2.4-.5s1.3.5 2.4.5c2.5 0 4.5-1.7 4.5-4 0-1.9-1.3-3.5-3.1-4"/><path d="M7.4 7.5c.8 0 1.4-.9 1.4-2s-.6-2-1.4-2S6 4.4 6 5.5s.6 2 1.4 2ZM16.6 7.5c.8 0 1.4-.9 1.4-2s-.6-2-1.4-2-1.4.9-1.4 2 .6 2 1.4 2ZM11.9 6.4c.9 0 1.6-1 1.6-2.2S12.8 2 11.9 2s-1.6 1-1.6 2.2.7 2.2 1.6 2.2Z"/></svg>;
  if (name === "users") return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6"/><path d="M16 5.5a2.5 2.5 0 0 1 0 5M16 14c2.8.2 4.2 2.2 4.5 5"/></svg>;
  if (name === "scissors") return <svg {...common}><circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.6 8.5 10.9 7M8.6 15.5l10.9-7"/></svg>;
  if (name === "badge") return <svg {...common}><circle cx="12" cy="8" r="3"/><path d="M6 20c.5-4 2.5-6 6-6s5.5 2 6 6"/><path d="M18.5 4.5 20 6l-3.5 3.5"/></svg>;
  if (name === "calendar") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h2M14 14h2M8 17.5h2"/></svg>;
  return <svg {...common}><path d="m12 3 1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8Z"/><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/></svg>;
}

export function Sidebar({ role }: { role?: string }) {
  return <aside className="sidebar">
    <div className="sidebar-brand-wrap">
      <Link href="/dashboard" className="brand selfpet-brand brand-image-link" aria-label="SelfPet dashboard"><img src="/logo.png" alt="SelfPet" className="brand-image" /></Link>
      <span className="sidebar-caption">gestão pet, do seu jeito</span>
    </div>
    <nav className="nav" aria-label="Navegação principal">
      {items.map((item) => <Link href={item.href} key={item.href} className="nav-link"><span className="nav-icon"><NavIcon name={item.icon}/></span><span>{item.label}</span></Link>)}
    </nav>
    <div className="sidebar-foot"><span className="status-dot"/><span>{role ? `Perfil ${role}` : "SelfPet"}</span></div>
  </aside>;
}
