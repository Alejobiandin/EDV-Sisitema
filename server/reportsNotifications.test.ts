import { describe, expect, it, vi } from "vitest";

const insertedNotifications: Array<Record<string, unknown>> = [];
const fakeDb = {
  insert: () => ({
    values: async (value: Record<string, unknown>) => {
      insertedNotifications.push(value);
      return [{ insertId: insertedNotifications.length }];
    },
  }),
  select: () => ({
    from: () => ({
      where: () => ({ limit: async () => [] }),
    }),
  }),
};

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getDb: vi.fn(async () => fakeDb) };
});

import { reportsRouter } from "./routers/reports";

const context = {
  req: {} as never,
  res: {} as never,
  user: { id: 7, role: "partner", openId: "partner-reports" } as never,
};

describe("Reportes gerenciales y notificaciones", () => {
  it("notifica al socio cuando genera y exporta el reporte gerencial", async () => {
    insertedNotifications.length = 0;
    const caller = reportsRouter.createCaller(context);
    const result = await caller.export({ reportType: "managerial_vat", format: "xlsx" });

    expect(result.fileName).toBe("reporte-gerencial-ventas-iva.xlsx");
    expect(result.size).toBeGreaterThan(500);
    expect(insertedNotifications).toHaveLength(1);
    expect(insertedNotifications[0]).toMatchObject({
      userId: 7,
      type: "system_alert",
      isRead: 0,
    });
    expect(String(insertedNotifications[0].message)).toContain("Reporte gerencial");
  });
});
