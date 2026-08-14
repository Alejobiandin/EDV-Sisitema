import { describe, expect, it, vi } from "vitest";
import { agents, auditLog, edvClients, edvInvoices, notifications, organizationalDnaPolicies, organizationalDnaRules, tasks } from "../drizzle/schema";
import { dashboardRouter } from "./routers/dashboard";
import type { TrpcContext } from "./_core/context";

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock("./db", () => ({ getDb: getDbMock }));

function makeChain(rows: unknown[]) {
  const promise = Promise.resolve(rows);
  const chain: any = {
    where: () => chain,
    orderBy: () => chain,
    limit: () => chain,
    then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => promise.then(resolve, reject),
    catch: (reject: (reason: unknown) => unknown) => promise.catch(reject),
  };
  return chain;
}

describe("dashboard.summary · client profitability", () => {
  it("uses persisted operatingCostRate to calculate margin independently from billed order", async () => {
    const clients = [
      { id: 1, name: "Alfa S.A.", taxCategory: "Responsable Inscripto", operatingCostRate: "0.6000" },
      { id: 2, name: "Beta S.R.L.", taxCategory: "Monotributo", operatingCostRate: "0.1000" },
    ];
    const invoices = [
      { id: 11, clientId: 1, amount: "150000", status: "paid" },
      { id: 12, clientId: 2, amount: "120000", status: "paid" },
    ];
    const rows = new Map<any, unknown[]>([
      [agents, [{ id: 1, status: "active" }]],
      [tasks, []],
      [notifications, []],
      [organizationalDnaRules, []],
      [organizationalDnaPolicies, []],
      [auditLog, []],
      [edvClients, clients],
      [edvInvoices, invoices],
    ]);
    getDbMock.mockResolvedValue({ select: () => ({ from: (table: any) => makeChain(rows.get(table) ?? []) }) });

    const context = { user: undefined, req: { protocol: "https", headers: {} }, res: {} } as TrpcContext;
    const result = await dashboardRouter.createCaller(context).summary();

    expect(result.clientProfitability).toEqual([
      expect.objectContaining({ clientId: 1, totalBilled: 150000, estimatedCost: 90000, margin: 60000 }),
      expect.objectContaining({ clientId: 2, totalBilled: 120000, estimatedCost: 12000, margin: 108000 }),
    ]);
    expect(result.clientProfitability.slice().sort((a, b) => b.margin - a.margin).map(row => row.clientId)).toEqual([2, 1]);
  });
});
