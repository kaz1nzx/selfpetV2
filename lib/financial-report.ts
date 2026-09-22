import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportEntry = {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  source: "service" | "manual";
};

export function reportPeriod(value?: string, now = new Date()) {
  // Use a fixed UTC-3 reporting day, independently of the server's timezone.
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const current = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
  const valid = value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) >= 1900 && Number(value.slice(0, 4)) < 9999;
  const month = valid ? value : current;
  const [year, number] = month.split("-").map(Number);
  return {
    month,
    label: new Date(Date.UTC(year, number - 1, 15)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }),
    start: new Date(Date.UTC(year, number - 1, 1, 3)).toISOString(),
    end: new Date(Date.UTC(year, number, 1, 3)).toISOString(),
  };
}

export async function collectReportRows<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown; count: number | null }>): Promise<T[]> {
  const rows: T[] = [];
  while (true) {
    const { data, error, count } = await fetchPage(rows.length, rows.length + 499);
    if (error || !data || count === null) throw new Error("Não foi possível carregar o relatório completo.");
    rows.push(...data);
    if (rows.length >= count) return rows;
    if (!data.length) throw new Error("O relatório foi interrompido. Tente novamente.");
  }
}

export async function loadFinancialReport(supabase: SupabaseClient, organizationId: string, period: ReturnType<typeof reportPeriod>) {
  const [services, transactions] = await Promise.all([
    collectReportRows((from, to) => supabase.from("service_records")
      .select("id,total_cents,performed_at,service_record_services(service_name)", { count: "exact" })
      .eq("organization_id", organizationId).eq("status", "COMPLETED")
      .gte("performed_at", period.start).lt("performed_at", period.end)
      .order("performed_at").order("id").range(from, to)),
    collectReportRows((from, to) => supabase.from("financial_transactions")
      .select("id,type,description,category,amount_cents,created_at", { count: "exact" })
      .eq("organization_id", organizationId)
      .gte("created_at", period.start).lt("created_at", period.end)
      .order("created_at").order("id").range(from, to)),
  ]);
  const entries: ReportEntry[] = [
    ...services.map((item) => ({ id: `service-${item.id}`, date: item.performed_at, description: item.service_record_services?.map((service) => service.service_name).join(", ") || "Atendimento concluído", category: "Atendimentos", type: "INCOME" as const, amount: item.total_cents ?? 0, source: "service" as const })),
    ...transactions.map((item) => ({ id: `manual-${item.id}`, date: item.created_at, description: item.description, category: item.category || "Outros", type: item.type as ReportEntry["type"], amount: item.amount_cents, source: "manual" as const })),
  ];
  return summarizeReport(entries);
}

export function summarizeReport(entries: ReportEntry[]) {
  let serviceIncome = 0;
  let manualIncome = 0;
  let expenses = 0;
  const categories = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type === "EXPENSE") {
      expenses += entry.amount;
      categories.set(entry.category, (categories.get(entry.category) ?? 0) + entry.amount);
    } else if (entry.source === "service") serviceIncome += entry.amount;
    else manualIncome += entry.amount;
  }
  return {
    income: serviceIncome + manualIncome,
    serviceIncome,
    manualIncome,
    expenses,
    balance: serviceIncome + manualIncome - expenses,
    categories: [...categories].sort((a, b) => b[1] - a[1]),
    entries: [...entries].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
  };
}

export type FinancialReportData = ReturnType<typeof summarizeReport>;
