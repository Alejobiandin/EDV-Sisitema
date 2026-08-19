import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { agents, organizationalDnaRules, organizationalDnaPolicies, tasks, taskExecutions, auditLog, notifications, edvClients, edvEmployees } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { runPythonCalculation } from "./pythonBridge";
import { buildAgentCoordinationPlan } from "./agentCoordination";

export type AgentTaskInput = {
  organizationId: number;
  agentId: number;
  taskType: "tax_computation" | "payroll_liquidation" | "social_charges" | "accounting_review";
  payload: {
    clientName?: string;
    period?: string;
    grossSales?: number;
    vatPurchases?: number;
    baseSalary?: number;
    overtimeHours?: number;
    cctName?: string;
    [key: string]: unknown;
  };
  userId: number;
};

type DnaRateRule = { name: string; content: string };

function readDnaRate(rules: DnaRateRule[], ruleName: string, fallback: number) {
  const rule = rules.find(candidate => candidate.name === ruleName);
  if (!rule) return fallback;
  try {
    const parsed = JSON.parse(rule.content) as { rate?: unknown };
    return typeof parsed.rate === "number" && parsed.rate >= 0 && parsed.rate <= 1 ? parsed.rate : fallback;
  } catch {
    return fallback;
  }
}

export type DeterministicAccountingResult = {
  result: Record<string, unknown>;
  requiresApproval: boolean;
  summary: string;
};

export async function calculateDeterministicAccounting(input: Pick<AgentTaskInput, "taskType" | "payload">, rules: DnaRateRule[] = []): Promise<DeterministicAccountingResult> {
  const rulesMap: Record<string, number> = {
    "IVA - alícuota general": readDnaRate(rules, "IVA - alícuota general", 0.21),
    "Aportes jubilatorios": readDnaRate(rules, "Aportes jubilatorios", 0.11),
    "Aporte obra social": readDnaRate(rules, "Aporte obra social", 0.03),
    "Aporte convencional": readDnaRate(rules, "Aporte convencional", 0.02),
    "Contribuciones patronales seguridad social": readDnaRate(rules, "Contribuciones patronales seguridad social", 0.16),
    "Contribuciones asignaciones familiares": readDnaRate(rules, "Contribuciones asignaciones familiares", 0.045),
  };

  const pyRes = await runPythonCalculation({
    taskType: input.taskType,
    payload: input.payload,
    rules: rulesMap,
  });

  if (!pyRes.success) {
    throw new Error(pyRes.error || "Fallo en el motor de cálculos Python EDV");
  }

  return {
    result: pyRes.result,
    requiresApproval: pyRes.requiresApproval,
    summary: pyRes.summary,
  };
}

function stringifyLlmContent(content: unknown) {
  return typeof content === "string" ? content : JSON.stringify(content);
}

export async function executeCognitiveAgentTask(input: AgentTaskInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible para ejecución de agentes");

  const agentRows = await db.select().from(agents).where(eq(agents.id, input.agentId)).limit(1);
  const agent = agentRows[0];
  if (!agent) throw new Error(`Célula agente con ID ${input.agentId} no encontrada`);

  // Hidratar cliente y empleado desde la base institucional EDV si existen
  let clientName = input.payload.clientName ?? "Cliente Demostración";
  const clientId = Number(input.payload.clientId);
  if (!isNaN(clientId) && clientId > 0) {
    const clientRows = await db.select().from(edvClients).where(eq(edvClients.id, clientId)).limit(1);
    if (!clientRows[0]) {
      throw new Error(`Cliente con ID ${clientId} no encontrado en el padrón institucional EDV`);
    }
    if (clientRows[0].organizationId !== input.organizationId) throw new Error("Cliente fuera de la organización de la tarea");
    clientName = clientRows[0].name;
    input.payload.clientName = clientName;
    input.payload.clientTaxId = clientRows[0].taxId;
  }

  const employeeId = Number(input.payload.employeeId);
  if (!isNaN(employeeId) && employeeId > 0) {
    const employeeRows = await db.select().from(edvEmployees).where(eq(edvEmployees.id, employeeId)).limit(1);
    if (!employeeRows[0]) {
      throw new Error(`Empleado con ID ${employeeId} no encontrado en la nómina institucional EDV`);
    }
    const employeeClient = await db.select().from(edvClients).where(eq(edvClients.id, employeeRows[0].clientId)).limit(1);
    if (!employeeClient[0] || employeeClient[0].organizationId !== input.organizationId) throw new Error("Empleado fuera de la organización de la tarea");
    input.payload.employeeName = employeeRows[0].fullName;
    input.payload.employeeTaxId = employeeRows[0].taxIdNumber;
    input.payload.baseSalary = Number(employeeRows[0].baseSalary);
    input.payload.cct = employeeRows[0].cct;
  }

  const rules = await db.select().from(organizationalDnaRules).limit(20);
  const policies = await db.select().from(organizationalDnaPolicies).limit(20);
  const dnaContext = [
    ...rules.map(rule => `[Regla ${rule.id}]: ${rule.name} - ${rule.content}`),
    ...policies.map(policy => `[Política]: ${policy.name} - ${policy.content}`),
  ].join("\n");

  await db.update(agents).set({ status: "in_task" }).where(eq(agents.id, agent.id));
  const deterministic = await calculateDeterministicAccounting(input, rules);
  const coordination = buildAgentCoordinationPlan(input.taskType);
  let requiresApproval = deterministic.requiresApproval || coordination.requiresHumanApproval;
  let llmInsight = deterministic.summary;

  try {
    const prompt = `Actúa como la célula agente "${agent.name}" (${agent.role}) en EDV, el sistema organizacional cognitivo multiagente.
Contexto de ADN Organizacional (Normas y Políticas):
${dnaContext || "No hay reglas cargadas todavía; declara esa ausencia."}

Datos de la tarea:
Tipo: ${input.taskType}
Organización: ${input.organizationId}
Payload: ${JSON.stringify(input.payload)}
Plan de coordinación: ${JSON.stringify(coordination)}
Resultado determinístico preliminar (calculado por motor Python EDV): ${JSON.stringify(deterministic.result)}

Genera una justificación técnica profesional, cita el criterio institucional utilizado cuando exista y determina si requiere revisión humana por riesgo normativo o umbral de monto. Responde únicamente con JSON válido.`;

    const llmResponse = await invokeLLM({
      model: "gpt-5-mini",
      reasoning: { effort: "low" },
      messages: [
        { role: "system", content: "Eres un agente contable cognitivo de EDV. No inventes normas: si faltan reglas en el ADN Organizacional, indícalo y recomienda revisión humana." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agent_reasoning",
          strict: true,
          schema: {
            type: "object",
            properties: {
              justification: { type: "string" },
              riskLevel: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["justification", "riskLevel"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = stringifyLlmContent(llmResponse.choices[0]?.message?.content);
    if (content) {
      const parsed = JSON.parse(content) as { justification?: unknown; riskLevel?: unknown };
      if (typeof parsed.justification === "string" && parsed.justification.trim()) llmInsight = parsed.justification;
      if (parsed.riskLevel === "high") requiresApproval = true;
    }
  } catch (error) {
    console.error("[AgentEngine] LLM invocation failed; deterministic result retained:", error);
    requiresApproval = true;
    llmInsight = `${llmInsight} La explicación cognitiva no estuvo disponible; se solicita revisión humana por precaución.`;
  }

  const taskStatus = requiresApproval ? "pending_approval" : "completed";
  const insertedTask = await db.insert(tasks).values({
    name: `${agent.name}: ${input.taskType.replaceAll("_", " ").toUpperCase()} - ${input.payload.clientName ?? "Cliente"}`,
    organizationId: input.organizationId,
    description: JSON.stringify({ taskType: input.taskType, organizationId: input.organizationId, inputPayload: input.payload, outputResult: { deterministicResult: deterministic.result, justification: llmInsight }, coordination, risk: requiresApproval ? "high" : "low" }),
    status: taskStatus,
    approvalStatus: requiresApproval ? "pending" : "not_required",
    approvalRequestedAt: requiresApproval ? new Date() : null,
    assignedAgentId: agent.id,
  });
  const taskId = Number(insertedTask[0].insertId);

  await db.insert(taskExecutions).values({
    taskId,
    agentId: agent.id,
    step: "Cálculo determinístico Python y razonamiento cognitivo EDV",
    status: "completed",
    log: JSON.stringify({ taskType: input.taskType, organizationId: input.organizationId, requiresApproval, justification: llmInsight, coordination }),
    endTime: new Date(),
  });
  await db.update(agents).set({ status: "active" }).where(eq(agents.id, agent.id));
  await db.insert(auditLog).values({
    agentId: agent.id,
    userId: input.userId,
    action: `Ejecución de tarea ${input.taskType}`,
    entityType: "task",
    entityId: taskId,
    details: JSON.stringify({ taskType: input.taskType, organizationId: input.organizationId, requiresApproval, status: taskStatus, coordination }),
  });

  if (requiresApproval) {
    await db.insert(notifications).values({
      userId: input.userId,
      agentId: agent.id,
      type: "human_approval",
      message: `EDV: La célula ${agent.name} requiere aprobación humana para ${input.taskType} (${input.payload.clientName ?? "Caso General"}).`,
      isRead: 0,
    });
  } else {
    await db.insert(notifications).values({
      userId: input.userId,
      agentId: agent.id,
      type: "task_completed",
      message: `EDV: La célula ${agent.name} completó ${input.taskType} para ${input.payload.clientName ?? "Caso General"}.`,
      isRead: 0,
    });
  }

  return {
    success: true,
    taskId,
    agentName: agent.name,
    status: taskStatus,
    deterministicResult: deterministic.result,
    justification: llmInsight,
    requiresApproval,
    organizationId: input.organizationId,
    coordination,
  };
}
