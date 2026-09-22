import { Sidebar } from "@/components/sidebar";
import { logoutAction } from "@/app/actions/auth";
import { requireMembership } from "@/lib/auth";

export default async function DashboardLayout({children}:{children:React.ReactNode}){
  const { membership } = await requireMembership();
  return <div className="shell"><Sidebar role={membership.role}/><main className="main"><header className="main-header"><div className="actions"><span className="muted">{membership.name} · {membership.role}</span><form action={logoutAction}><button className="btn ghost">Sair</button></form></div></header><div className="content">{children}</div></main></div>;
}
