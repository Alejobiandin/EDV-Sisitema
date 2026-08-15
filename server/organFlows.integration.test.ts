import { beforeEach, describe, expect, it, vi } from "vitest";
import { ORGAN_SCENARIOS } from "../shared/organScenarios";

let selectQueue: unknown[][] = [];

function nextQuery() {
  const data = selectQueue.shift() ?? [];
  return {
    then: (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(data).then(resolve, reject),
    orderBy: async () => data,
    where: () => ({
      orderBy: async () => data,
      limit: async () => data,
      then: (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(data).then(resolve, reject),
    }),
  };
}

const fakeDb = {
  select: () => ({ from: () => nextQuery() }),
  insert: () => ({ values: async () => [{ insertId: 42 }] }),
};

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getDb: vi.fn(async () => fakeDb) };
});

vi.mock("./agentEngine", () => ({
  executeCognitiveAgentTask: vi.fn(async (input: { taskType: string; agentId: number }) => ({
    success: true,
    taskId: 42,
    status: "completed",
    agentId: input.agentId,
    taskType: input.taskType,
    output: { reviewed: true },
  })),
}));

import { organsRouter } from "./routers/organs";
import { agentsRouter } from "./routers/agents";
import { bankingRouter } from "./routers/banking";
import { edvManagementRouter } from "./routers/edvManagement";
import { vectorSearchRouter } from "./routers/vectorSearch";

const context = { req: {} as never, res: {} as never, user: { id: 1, role: "partner", openId: "organ-flow-partner" } as never };

beforeEach(() => {
  selectQueue = [];
});

describe("EDV integrated organ flows", () => {
  it.each(ORGAN_SCENARIOS)("ejecuta el router real del escenario declarativo $organCode", async scenario => {
    switch (scenario.organCode) {
      case "executive": {
        selectQueue = [[], [], []];
        const result = await organsRouter.createCaller(context).catalog();
        expect(result.map(organ => organ.code)).toContain(scenario.organCode);
        expect(result).toHaveLength(7);
        expect(scenario.expectedOutput).toContain("prioridad");
        break;
      }
      case "tax": {
        const result = await agentsRouter.createCaller(context).executeTask({ agentId: 2, taskType: "tax_computation", payload: { period: "2026-07", grossSales: 100000 } });
        expect(result).toMatchObject({ success: true, taskType: "tax_computation", status: "completed" });
        expect(scenario.requiredAgents).toContain("Tax Data Intake Agent");
        break;
      }
      case "finance": {
        const result = await bankingRouter.createCaller(context).createConnection({ name: "Cuenta operativa", institution: "Banco EDV", provider: "open_banking_simulated", secretRef: "test-ref" });
        expect(result).toEqual({ success: true, connectionId: 42 });
        expect(scenario.expectedOutput).toContain("conciliación");
        break;
      }
      case "people": {
        const result = await agentsRouter.createCaller(context).executeTask({ agentId: 8, taskType: "payroll_liquidation", payload: { period: "2026-07", baseSalary: 250000, overtimeHours: 4, cctName: "CCT 130/75" } });
        expect(result).toMatchObject({ success: true, taskType: "payroll_liquidation", status: "completed" });
        expect(scenario.requiredAgents).toContain("Payroll Calculation Agent");
        break;
      }
      case "commercial": {
        const result = await vectorSearchRouter.createCaller(context).createInvoice({ clientId: 10, amount: 121000 });
        expect(result).toMatchObject({ success: true, invoiceId: 42 });
        expect(scenario.expectedOutput).toContain("honorarios");
        break;
      }
      case "operations": {
        const result = await edvManagementRouter.createCaller(context).createClient({ name: "Empresa Operativa", taxId: "30-12345678-9", taxCategory: "Responsable Inscripto", email: "operaciones@example.com" });
        expect(result).toEqual({ success: true, clientId: 42 });
        expect(scenario.expectedOutput).toContain("stock");
        break;
      }
      case "legal": {
        selectQueue = [[{ id: 1, name: "Contrato marco", description: "Obligaciones contractuales", content: "renovación y cumplimiento" }], [{ id: 2, name: "Política legal", content: "control contractual" }]];
        const result = await vectorSearchRouter.createCaller(context).querySemantic({ query: "contrato" });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toMatchObject({ name: "Contrato marco", type: "Regla" });
        expect(scenario.requiredAgents).toContain("Contract Intelligence Agent");
        break;
      }
    }
  });
});
