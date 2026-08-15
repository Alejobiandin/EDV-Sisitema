import { beforeEach, describe, expect, it, vi } from "vitest";

const fakeDb = {
  insert: () => ({
    values: async () => [{ insertId: 7 }],
  }),
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => [{ id: 1, name: "Balance 2025", description: "Reporte", status: "completed" }],
      }),
    }),
  }),
};

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDb: vi.fn(async () => fakeDb),
    approveTask: vi.fn(async (taskId: number, userId: number, comment?: string) => ({ id: taskId, status: "completed", approvedBy: userId, approvalComment: comment ?? null })),
    rejectTask: vi.fn(async (taskId: number, userId: number, comment: string) => ({ id: taskId, status: "rejected", approvedBy: userId, approvalComment: comment })),
  };
});

import { appRouter } from "./routers";

type TestRole = "admin" | "partner" | "client" | "user";

function callerFor(role: TestRole) {
  return appRouter.createCaller({
    req: {} as never,
    res: {} as never,
    user: { id: role === "admin" ? 1 : 2, role, openId: `test-${role}` } as never,
  });
}

const connectionInput = {
  name: "Cuenta operativa",
  institution: "Banco de prueba",
  provider: "open_banking_simulated",
  accountMasked: "**** 4821",
  secretRef: "test-secret-ref",
};

describe("EDV backend RBAC enforcement", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["client", "user"] as const)("bloquea banca, aprobación y firma para %s", async role => {
    const caller = callerFor(role);
    await expect(caller.banking.createConnection(connectionInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.banking.importFeed({ connectionId: 1, transactions: [{ externalId: "tx-001", bookedAt: new Date(), amount: 100, direction: "credit" }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.banking.reconcile({ transactionId: 1, invoiceId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.tasks.approve({ taskId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.tasks.reject({ taskId: 1, comment: "Revisar" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.vectorSearch.signAndCertifyReport({ taskId: 1, recipientEmail: "cliente@example.com" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it.each(["partner", "admin"] as const)("permite operaciones sensibles a %s", async role => {
    const caller = callerFor(role);
    await expect(caller.banking.createConnection(connectionInput)).resolves.toMatchObject({ success: true, connectionId: 7 });
    await expect(caller.tasks.approve({ taskId: 1, comment: "Aprobado" })).resolves.toMatchObject({ status: "completed" });
    await expect(caller.vectorSearch.signAndCertifyReport({ taskId: 1, recipientEmail: "cliente@example.com" })).resolves.toMatchObject({ success: true });
  });
});
