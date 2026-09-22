import Link from "next/link";
import { createFinancialTransaction, deleteFinancialTransaction } from "@/app/actions/data";
import { requireMembership } from "@/lib/auth";
import { money } from "@/lib/format";
import { canUse, effectivePlan } from "@/lib/plan";
import { FeatureLocked } from "@/components/plan-gate";
import { FinancialReport } from "@/components/financial-report";
import { loadFinancialReport, reportPeriod, type FinancialReportData } from "@/lib/financial-report";

type Transaction = { id: string; type: "INCOME" | "EXPENSE"; description: string; category: string; amount_cents: number; created_at: string };

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const { supabase, membership } = await requireMembership();
  const organizationId = membership.organization_id;
  const [members, pets, customers, services, records, subscription, transactionsResult] = await Promise.all([
    supabase.from("organization_members").select("id,name,email,role,active").eq("organization_id", organizationId).order("name"),
    supabase.from("pets").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("active", true),
    supabase.from("service_records").select("id,total_cents,status,performed_at", { count: "exact" }).eq("organization_id", organizationId).eq("status", "COMPLETED").order("performed_at", { ascending: false }),
    supabase.from("subscriptions").select("plan,status,expires_at").eq("organization_id", organizationId).maybeSingle(),
    supabase.from("financial_transactions").select("id,type,description,category,amount_cents,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
  ]);
  const plan = effectivePlan(subscription.data);
  const showReports = query.financeiro === "relatorios";
  const period = reportPeriod(typeof query.mes === "string" ? query.mes : undefined);
  let report: FinancialReportData | null = null;
  if (showReports && canUse(plan, "financeiro")) {
    try {
      report = await loadFinancialReport(supabase, organizationId, period);
    } catch {
      // Never show partial financial totals when a query fails.
      report = null;
    }
  }
  const transactions = (transactionsResult.data ?? []) as Transaction[];
  const serviceIncome = (records.data ?? []).reduce((sum: number, record: any) => sum + (record.total_cents ?? 0), 0);
  const income = serviceIncome + transactions.filter((item) => item.type === "INCOME").reduce((sum, item) => sum + item.amount_cents, 0);
  const expenses = transactions.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum + item.amount_cents, 0);
  const balance = income - expenses;
  const chart = buildChart(records.data ?? [], transactions);
  const activeMembers = (members.data ?? []).filter((member: any) => member.active).length;

  return <>
    <div className="page-head admin-head"><div><span className="badge">Visão geral</span><h1>Dashboard</h1><p className="muted">Cuide da operação e acompanhe a saúde financeira do seu negócio pet.</p></div><Link className="btn" href="/dashboard/pets/novo">Cadastrar pet</Link></div>
    <section className="admin-grid" aria-label="Resumo da organização">
      <div className="card admin-stat"><span className="admin-icon">♡</span><span className="muted">Membros ativos</span><strong>{activeMembers}</strong><small>de {(members.data ?? []).length} cadastrados</small></div>
      <div className="card admin-stat"><span className="admin-icon">✦</span><span className="muted">Pets acompanhados</span><strong>{pets.count ?? 0}</strong><small>histórias sob cuidado</small></div>
      <div className="card admin-stat"><span className="admin-icon">⌁</span><span className="muted">Clientes</span><strong>{customers.count ?? 0}</strong><small>tutores cadastrados</small></div>
      <div className="card admin-stat"><span className="admin-icon">✓</span><span className="muted">Serviços ativos</span><strong>{services.count ?? 0}</strong><small>{records.count ?? 0} atendimentos registrados</small></div>
    </section>
    {!canUse(plan, "financeiro")
      ? <FeatureLocked title="Fluxo financeiro e saldo" description="Acompanhe entradas, despesas e o saldo do seu negócio pet. Disponível nos planos Premium e Pro." />
      : <>
    <section className="finance-summary" aria-label="Resumo financeiro">
      <div className="card balance-card"><span className="badge">Saldo atual</span><strong className={balance < 0 ? "negative" : ""}>{money(balance)}</strong><small>Entradas menos despesas registradas</small></div>
      <div className="card finance-number"><span className="muted">Entradas</span><strong className="positive">{money(income)}</strong><small>Inclui atendimentos concluídos</small></div>
      <div className="card finance-number"><span className="muted">Despesas</span><strong className="negative">{money(expenses)}</strong><small>Gastos adicionados por você</small></div>
    </section>
    {query.erro === "tabela-financeira" && <div className="error finance-error">A tabela financeira ainda não foi criada no Supabase. Execute o SQL do arquivo <b>supabase/financial_transactions.sql</b> no SQL Editor e tente novamente.</div>}
    {query.erro === "permissao-financeira" && <div className="error finance-error">A tabela existe, mas ainda falta liberar o acesso para usuários autenticados. Execute novamente o SQL de <b>supabase/financial_transactions.sql</b> no Supabase.</div>}
    {query.erro === "lancamento-invalido" && <div className="error finance-error">Preencha uma descrição e um valor maior que zero.</div>}
    {query.erro === "falha-ao-salvar-lancamento" && <div className="error finance-error">Não foi possível salvar esse lançamento. Confira os dados e tente novamente.</div>}
    <div className="finance-columns">
      <section className="card finance-panel"><div className="panel-head"><div><h2>Movimentar saldo</h2><p className="muted">Registre uma entrada ou uma despesa.</p></div><span className="admin-icon">＋</span></div>
        <form className="form" action={createFinancialTransaction}><div className="field"><label htmlFor="type">Tipo de lançamento</label><select id="type" name="type" defaultValue="EXPENSE"><option value="INCOME">Adicionar ao saldo</option><option value="EXPENSE">Remover do saldo</option></select></div><div className="grid two"><div className="field"><label htmlFor="amount">Valor (R$)</label><input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0,00" required /></div><div className="field"><label htmlFor="category">Categoria</label><select id="category" name="category" defaultValue="Operação"><option>Operação</option><option>Equipe</option><option>Produtos</option><option>Aluguel</option><option>Marketing</option><option>Outros</option></select></div></div><div className="field"><label htmlFor="description">Descrição</label><input id="description" name="description" placeholder="Ex.: compra de ração" required /></div><button className="btn" type="submit">Salvar lançamento</button></form>
      </section>
      <section className="card finance-panel chart-panel">
        <div className="panel-head"><div><h2>Fluxo financeiro</h2><p className="muted">Entradas e despesas dos últimos seis meses.</p></div></div>
        <div className="chart-legend"><span><i className="legend-income" />Entradas</span><span><i className="legend-expense" />Despesas</span></div>
        <div className="bar-chart" aria-label="Gráfico de entradas e despesas">
          {chart.map((month) => <div className="chart-column" key={month.label} tabIndex={0} role="group" aria-label={month.label} aria-describedby={`chart-tooltip-${month.label}`}>
            <div className="chart-tooltip" id={`chart-tooltip-${month.label}`} role="tooltip">
              <b>{month.date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</b>
              <span>Entradas <strong className="positive">{money(month.income)}</strong></span>
              <span>Saídas <strong className="negative">{money(month.expense)}</strong></span>
            </div>
            <div className="bars" aria-hidden="true"><span className="bar income-bar" style={{ height: `${month.incomeHeight}%` }} /><span className="bar expense-bar" style={{ height: `${month.expenseHeight}%` }} /></div>
            <b>{month.label}</b>
          </div>)}
        </div>
      </section>
    </div>
    <div id="finance-details" className="finance-details">
      <nav className="finance-tabs" aria-label="Seções do financeiro">
        <Link href={`/dashboard?mes=${period.month}#finance-details`} aria-current={!showReports ? "page" : undefined}>Últimos lançamentos</Link>
        <Link href={`/dashboard?financeiro=relatorios&mes=${period.month}#finance-details`} aria-current={showReports ? "page" : undefined}>Relatórios</Link>
      </nav>
      {showReports ? <FinancialReport period={period} report={report} /> : <section className="card finance-panel transaction-panel"><div className="panel-head"><div><h2>Últimos lançamentos</h2><p className="muted">Acompanhe e remova registros adicionados manualmente.</p></div></div>{!transactions.length ? <div className="empty">Nenhum gasto ou entrada manual registrada.</div> : <div className="transaction-list">{transactions.slice(0, 8).map((item) => <div className="transaction-row" key={item.id}><span className={`transaction-mark ${item.type === "INCOME" ? "transaction-income" : "transaction-expense"}`}>{item.type === "INCOME" ? "+" : "−"}</span><div><b>{item.description}</b><small>{item.category} · {formatDate(item.created_at)}</small></div><strong className={item.type === "INCOME" ? "positive" : "negative"}>{item.type === "INCOME" ? "+" : "−"}{money(item.amount_cents)}</strong><form action={deleteFinancialTransaction}><input type="hidden" name="id" value={item.id} /><button className="remove-btn" aria-label={`Remover ${item.description}`} title="Remover lançamento">×</button></form></div>)}</div>}</section>}
    </div>
    </>}
  </>;
}

function buildChart(records: any[], transactions: Transaction[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => { const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1); return { date, label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), income: 0, expense: 0 }; });
  records.forEach((record) => addToMonth(months, record.performed_at, "income", record.total_cents ?? 0));
  transactions.forEach((transaction) => addToMonth(months, transaction.created_at, transaction.type === "INCOME" ? "income" : "expense", transaction.amount_cents));
  const maximum = Math.max(...months.flatMap((month) => [month.income, month.expense]), 1);
  return months.map((month) => ({ ...month, incomeHeight: month.income ? Math.max(8, Math.round((month.income / maximum) * 100)) : 3, expenseHeight: month.expense ? Math.max(8, Math.round((month.expense / maximum) * 100)) : 3 }));
}

function addToMonth(months: { date: Date; income: number; expense: number }[], value: string, key: "income" | "expense", amount: number) {
  const date = new Date(value);
  const month = months.find((item) => item.date.getFullYear() === date.getFullYear() && item.date.getMonth() === date.getMonth());
  if (month) month[key] += amount;
}

function formatDate(value: string) { return new Date(value).toLocaleDateString("pt-BR"); }
