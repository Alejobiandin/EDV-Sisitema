import { beforeEach, describe, expect, it, vi } from "vitest";

const organNames = [
  "Dirección y Coordinación Estratégica",
  "Área Impositiva y Fiscal",
  "Área Contable y Financiera",
  "Capital Humano y Nómina",
  "Área Comercial y Facturación",
  "Operaciones y Abastecimiento",
  "Área Legal y Contractual",
];

const fakeAgents = organNames.flatMap((organ, organIndex) => [
  { id: organIndex * 3 + 1, organ, status: "active" },
  { id: organIndex * 3 + 2, organ, status: "in_task" },
  { id: organIndex * 3 + 3, organ, status: "active" },
]);
const fakeTasks = fakeAgents.slice(0, 7).map((agent, index) => ({
  assignedAgentId: agent.id,
  status: index % 2 === 0 ? "in_progress" : "pending_approval",
}));
const fakeNotifications = fakeAgents.slice(0, 7).map((agent, index) => ({
  agentId: agent.id,
  isRead: index % 2,
}));
let selectIndex = 0;

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDb: vi.fn(async () => ({
      select: () => ({
        from: async () => {
          const rows = [fakeAgents, fakeTasks, fakeNotifications][selectIndex] ?? [];
          selectIndex += 1;
          return rows;
        },
      }),
    })),
  };
});

import { organsRouter } from "./routers/organs";
import { ORGAN_SCENARIOS, getOrganScenario } from "../shared/organScenarios";
import { executeOrganScenario } from "../shared/organFlowEngine";

function caller() {
  return organsRouter.createCaller({
    req: {} as never,
    res: {} as never,
    user: { id: 1, role: "partner", openId: "integration-partner" } as never,
  });
}

describe("EDV organ integration coverage", () => {
  beforeEach(() => {
    selectIndex = 0;
  });

  it("exposes seven organs, three cells per organ and operational metrics", async () => {
    const result = await caller().catalog();
    expect(result).toHaveLength(7);
    expect(result.every(organ => organ.agents.length === 3)).toBe(true);
    expect(result.reduce((total, organ) => total + organ.metrics.totalAgents, 0)).toBe(21);
    expect(result.every(organ => organ.metrics.activeAgents >= 2)).toBe(true);
    expect(result.some(organ => organ.metrics.runningTasks > 0)).toBe(true);
    expect(result.some(organ => organ.metrics.pendingApproval > 0)).toBe(true);
    expect(result.some(organ => organ.metrics.unreadAlerts > 0)).toBe(true);
  });

  it.each(ORGAN_SCENARIOS)("valida el contrato del flujo representativo del órgano $organCode", scenario => {
    const resolved = getOrganScenario(scenario.organCode);
    expect(resolved).toEqual(scenario);
    expect(scenario.inputLabel.length).toBeGreaterThan(10);
    expect(scenario.expectedOutput.length).toBeGreaterThan(10);
    expect(scenario.requiredAgents.length).toBeGreaterThanOrEqual(2);
  });

  it.each([
    ["executive", { risk: "high" }, { priority: "urgent", hitlRequired: true, status: "escalated" }],
    ["tax", { period: "2026-07", documents: ["iva-001", "iva-002"] }, { validDocuments: 2, exceptions: 0, status: "ready" }],
    ["finance", { direction: "credit", transactionAmount: 12500, invoiceAmount: 12500 }, { matched: true, reconciliationAmount: 12500, status: "ready" }],
    ["people", { employees: [{ gross: 100000 }, { gross: 80000 }] }, { employees: 2, grossTotal: 180000, socialCharges: 41400, status: "ready" }],
    ["commercial", { serviceAmount: 100000, feeRate: 1.21 }, { invoiceAmount: 121000, requiresApproval: true, status: "ready" }],
    ["operations", { received: 100, consumed: 90, minimum: 20 }, { stock: 10, reorderAlert: true, status: "ready" }],
    ["legal", { contractRenewalAt: "2026-12-31", regulatoryChange: true }, { obligationsDetected: 1, ruleReviewRequired: true, status: "review" }],
  ] as const)("ejecuta funcionalmente el escenario del órgano %s", (organCode, input, expected) => {
    const scenario = getOrganScenario(organCode);
    expect(scenario).toBeDefined();
    const result = executeOrganScenario(scenario!, input);
    expect(result.organCode).toBe(organCode);
    expect(result.status).toBe(expected.status);
    for (const [key, value] of Object.entries(expected)) {
      if (key !== "status") expect(result.output[key]).toBe(value);
    }
    expect(result.events).toContain(`${organCode}:input_received`);
    expect(result.events).toContain(`${organCode}:output_emitted`);
  });
});
