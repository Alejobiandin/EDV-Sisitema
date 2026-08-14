import { describe, expect, it } from "vitest";
import { buildClientProfitability } from "./profitability";
import { getProfitabilityChartRows } from "../client/src/pages/Dashboard";

const clients = [
  { id: 1, name: "Alfa S.A.", taxCategory: "Responsable Inscripto" },
  { id: 2, name: "Beta S.R.L.", taxCategory: "Monotributo" },
];

const invoices = [
  { clientId: 1, amount: "100000" },
  { clientId: 1, amount: 50000 },
  { clientId: 2, amount: 120000 },
];

describe("rentabilidad por cliente", () => {
  it("agrega facturación, costo estimado, margen y cantidad de comprobantes", () => {
    const result = buildClientProfitability(clients, invoices, 0.35, { 1: 0.6, 2: 0.1 });

    expect(result).toEqual([
      {
        clientId: 1,
        clientName: "Alfa S.A.",
        taxCategory: "Responsable Inscripto",
        totalBilled: 150000,
        estimatedCost: 90000,
        margin: 60000,
        invoicesCount: 2,
      },
      {
        clientId: 2,
        clientName: "Beta S.R.L.",
        taxCategory: "Monotributo",
        totalBilled: 120000,
        estimatedCost: 12000,
        margin: 108000,
        invoicesCount: 1,
      },
    ]);
  });

  it("ordena por margen o facturación y conserva estado vacío", () => {
    const rows = buildClientProfitability(clients, invoices, 0.35, { 1: 0.6, 2: 0.1 });
    expect(getProfitabilityChartRows(rows, "margin").map(row => row.clientId)).toEqual([2, 1]);
    expect(getProfitabilityChartRows(rows, "totalBilled").map(row => row.clientId)).toEqual([1, 2]);
    expect(getProfitabilityChartRows([], "margin")).toEqual([]);
  });
});
