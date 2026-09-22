import { money } from "@/lib/format";
import type { FinancialReportData, reportPeriod } from "@/lib/financial-report";

export function FinancialReport({ period, report }: { period: ReturnType<typeof reportPeriod>; report: FinancialReportData | null }) {
  return <section className="card finance-panel monthly-report" aria-labelledby="report-heading">
    <div className="panel-head">
      <div><h2 id="report-heading">Relatório financeiro mensal</h2><p className="muted">Acompanhe as entradas, saídas e o resultado da empresa em cada mês.</p></div>
    </div>
    <form className="report-filter" action="/dashboard#finance-details" method="get">
      <input type="hidden" name="financeiro" value="relatorios" />
      <div className="field"><label htmlFor="report-month">Mês de referência</label><input key={period.month} id="report-month" name="mes" type="month" min="1900-01" max="9998-12" defaultValue={period.month} required /></div>
      <button className="btn" type="submit">Ver relatório</button>
    </form>
    <p className="report-period">{period.label}</p>
    {!report ? <div className="error" role="alert">Não foi possível carregar todos os dados deste mês. Tente novamente em “Ver relatório”.</div> : <>
      <div className="report-summary">
        <div><span>Entradas do mês</span><strong className="positive">{money(report.income)}</strong></div>
        <div><span>Saídas do mês</span><strong className="negative">{money(report.expenses)}</strong></div>
        <div><span>Saldo do mês</span><strong className={report.balance < 0 ? "negative" : "positive"}>{money(report.balance)}</strong></div>
      </div>
      <p className="muted report-note">Saldo do mês = entradas menos saídas do período, sem saldo anterior. Datas consideradas no horário UTC−3.</p>
      {!report.entries.length ? <div className="empty">Nenhuma movimentação registrada neste mês. Escolha outro mês para consultar o histórico.</div> : <>
        <div className="report-breakdown">
          <section><h3>Origem das entradas</h3><dl><div><dt>Atendimentos concluídos</dt><dd>{money(report.serviceIncome)}</dd></div><div><dt>Entradas manuais</dt><dd>{money(report.manualIncome)}</dd></div></dl></section>
          <section><h3>Saídas por categoria</h3>{report.categories.length ? <dl>{report.categories.map(([category, amount]) => <div key={category}><dt>{category}</dt><dd>{money(amount)}</dd></div>)}</dl> : <p className="muted">Nenhuma saída no período.</p>}</section>
        </div>
        <h3>Movimentações do mês <span className="badge">{report.entries.length}</span></h3>
        <div className="table-wrap report-table" tabIndex={0} role="region" aria-label="Movimentações do mês">
          <table><caption className="report-caption">Entradas e saídas de {period.label}</caption><thead><tr><th scope="col">Data</th><th scope="col">Descrição</th><th scope="col">Categoria</th><th scope="col">Tipo</th><th scope="col">Valor</th></tr></thead>
            <tbody>{report.entries.map((entry) => <tr key={entry.id}>
              <td>{new Date(entry.date).toLocaleDateString("pt-BR", { timeZone: "Etc/GMT+3" })}</td><td>{entry.description}</td><td>{entry.category}</td><td>{entry.type === "INCOME" ? "Entrada" : "Saída"}</td><td className={entry.type === "INCOME" ? "positive" : "negative"}>{money(entry.amount)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}
    </>}
  </section>;
}
