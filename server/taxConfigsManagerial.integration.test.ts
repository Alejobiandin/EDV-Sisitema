import { describe, expect, it, vi } from "vitest";

const fakeDb = {
  select: () => ({
    from: (table: unknown) => {
      // @ts-expect-error table inspection
      const name = table?.config?.name ?? "";
      const resultData = name === "edv_invoices"
        ? [{ id: 1, amount: "121000" }]
        : [{ id: 1, organizationId: 1, syncType: "points_of_sale", status: "success", details: "OK", createdAt: new Date() }];
      return {
        where: () => ({
          orderBy: async () => resultData,
          limit: async () => resultData,
        }),
        orderBy: async () => resultData,
        then: (resolve: (v: unknown[]) => unknown) => Promise.resolve(resultData).then(resolve),
      };
    },
  }),
};

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getDb: vi.fn(async () => fakeDb) };
});

import { taxConfigsRouter } from "./routers/taxConfigs";

const context = { req: {} as never, res: {} as never, user: { id: 1, role: "partner", openId: "partner-managerial" } as never };

describe("EDV Managerial Tax & Email Router", () => {
  it("permite obtener reportes gerenciales de IVA e historial de sincronización", async () => {
    const caller = taxConfigsRouter.createCaller(context);
    const report = await caller.getManagerialReport({ organizationId: 1 });
    expect(report).toHaveProperty("byPos");
    expect(report).toHaveProperty("totalNet");
    expect(report).toHaveProperty("totalVat");

    const logs = await caller.getSyncLogs({ organizationId: 1 });
    expect(Array.isArray(logs)).toBe(true);

    const emailRes = await caller.sendInvoiceEmail({ invoiceId: 1, clientEmail: "test@example.com" });
    expect(emailRes.success).toBe(true);
  });
});
