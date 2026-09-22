import assert from "node:assert/strict";
import test from "node:test";
import { collectReportRows, loadFinancialReport, reportPeriod, summarizeReport } from "../lib/financial-report.ts";

test("monthly boundaries include the full UTC-3 month, including leap years and December", () => {
  assert.equal(reportPeriod("2024-02").end, "2024-03-01T03:00:00.000Z");
  assert.equal(reportPeriod("2026-12").start, "2026-12-01T03:00:00.000Z");
  assert.equal(reportPeriod("2026-12").end, "2027-01-01T03:00:00.000Z");
  for (const value of [undefined, "invalid", "2026-13", "0000-01", "2026-01-01"]) {
    assert.equal(reportPeriod(value, new Date("2026-03-01T02:59:59Z")).month, "2026-02");
  }
});

test("income, expenses, negative balance and category totals use integer cents", () => {
  const entry = { id: "1", date: "2026-09-10T12:00:00Z", description: "Movimentação", category: "Operação", source: "manual" };
  const report = summarizeReport([
    { ...entry, type: "INCOME", amount: 10001, source: "service" },
    { ...entry, id: "2", type: "INCOME", amount: 999 },
    { ...entry, id: "3", type: "EXPENSE", amount: 12000 },
    { ...entry, id: "4", type: "EXPENSE", amount: 100 },
    { ...entry, id: "5", type: "EXPENSE", amount: 200, category: "Equipe" },
  ]);
  assert.equal(report.income, 11000);
  assert.equal(report.serviceIncome, 10001);
  assert.equal(report.manualIncome, 999);
  assert.equal(report.expenses, 12300);
  assert.equal(report.balance, -1300);
  assert.deepEqual(report.categories, [["Operação", 12100], ["Equipe", 200]]);
  assert.equal(summarizeReport([]).balance, 0);
  assert.deepEqual(summarizeReport([]).entries, []);
});

test("pagination retrieves every row even when the API caps each response", async () => {
  const rows = Array.from({ length: 1205 }, (_, id) => ({ id }));
  const result = await collectReportRows(async (from, to) => ({ data: rows.slice(from, Math.min(to + 1, from + 100)), error: null, count: rows.length }));
  assert.deepEqual(result, rows);
});

test("query failure or incomplete response never produces a partial report", async () => {
  await assert.rejects(() => collectReportRows(async () => ({ data: null, error: new Error("unavailable"), count: null })));
  await assert.rejects(() => collectReportRows(async (from) => ({ data: from === 0 ? [{ id: 1 }] : [], error: null, count: 2 })));
});

test("report queries isolate the organization, completed services and selected month", async () => {
  const date = "2026-09-01T03:00:00.000Z";
  const datasets = {
    service_records: [
      { id: "1", organization_id: "ours", status: "COMPLETED", performed_at: date, total_cents: 4000, service_record_services: [{ service_name: "Tosa" }] },
      { id: "2", organization_id: "other", status: "COMPLETED", performed_at: date, total_cents: 90000 },
      { id: "3", organization_id: "ours", status: "CANCELLED", performed_at: date, total_cents: 90000 },
      { id: "4", organization_id: "ours", status: "COMPLETED", performed_at: "2026-09-01T02:59:59.000Z", total_cents: 90000 },
      { id: "5", organization_id: "ours", status: "COMPLETED", performed_at: "2026-10-01T03:00:00.000Z", total_cents: 90000 },
    ],
    financial_transactions: [
      { id: "1", organization_id: "ours", type: "EXPENSE", created_at: date, amount_cents: 200, category: "Equipe", description: "Pagamento" },
      { id: "2", organization_id: "ours", type: "INCOME", created_at: "2026-10-01T02:59:59.000Z", amount_cents: 300, category: "Outros", description: "Entrada" },
      { id: "3", organization_id: "other", type: "INCOME", created_at: date, amount_cents: 90000 },
    ],
  };
  const supabase = { from(table) {
    let rows = datasets[table];
    return {
      select() { return this; },
      eq(key, value) { rows = rows.filter((row) => row[key] === value); return this; },
      gte(key, value) { rows = rows.filter((row) => row[key] >= value); return this; },
      lt(key, value) { rows = rows.filter((row) => row[key] < value); return this; },
      order() { return this; },
      async range(from, to) { return { data: rows.slice(from, to + 1), count: rows.length, error: null }; },
    };
  } };
  const report = await loadFinancialReport(supabase, "ours", reportPeriod("2026-09"));
  assert.equal(report.income, 4300);
  assert.equal(report.expenses, 200);
  assert.equal(report.balance, 4100);
  assert.equal(report.entries.length, 3);
  assert.equal(report.entries[0].description, "Entrada");
  const serviceEntry = report.entries.find((entry) => entry.source === "service");
  assert.equal(serviceEntry.description, "Tosa");
  assert.equal(serviceEntry.amount, 4000);
});
