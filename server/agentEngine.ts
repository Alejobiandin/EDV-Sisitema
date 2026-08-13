import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { agents, organizationalDnaRules, organizationalDnaPolicies, tasks, taskExecutions, auditLog, notifications } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export type AgentTaskInput = {
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

export function calculateDeterministicAccounting(input: Pick<AgentTaskInput, "taskType" | "payload">, rules: DnaRateRule[] = []): DeterministicAccountingResult {
  const vatRate = readDnaRate(rules, "IVA - alícuota general", 0.21);
  const retirementRate = readDnaRate(rules, "Aportes jubilatorios", 0.11);
  const socialSecurityRate = readDnaRate(rules, "Aporte obra social", 0.03);
  const unionRate = readDnaRate(rules, "Aporte convencional", 0.02);
  const employerSocialRate = readDnaRate(rules, "Contribuciones patronales seguridad social", 0.16);
  const employerFamilyRate = readDnaRate(rules, "Contribuciones asignaciones familiares", 0.045);

  if (input.taskType === "tax_computation") {
    const sales = input.payload.grossSales ?? 0;
    const purchases = input.payload.vatPurchases ?? 0;
    const debits = sales * vatRate;
    const credits = purchases * vatRate;
    const vatBalance = debits - credits;
    return {
      result: {
        taxType: "IVA / IIBB",
        grossSales: sales,
        vatRate,
        vatDebits: debits,
        vatCredits: credits,
        netVatDue: vatBalance,
        status: "Calculado con éxito",
        parameterSource: "ADN Organizacional / regla vigente configurada",
      },
      requiresApproval: vatBalance > 500000,
      summary: `Determinación impositiva procesada para ${input.payload.clientName ?? "Cliente General"}. Saldo técnico IVA: $${vatBalance.toFixed(2)}.`,
    };
  }

  if (input.taskType === "payroll_liquidation" || input.taskType === "social_charges") {
    const base = input.payload.baseSalary ?? 350000;
    const overtime = input.payload.overtimeHours ?? 0;
    const overtimePay = overtime * (base / 160) * 1.5;
    const gross = base + overtimePay;
    const retirement = gross * retirementRate;
    const socialSecurity = gross * socialSecurityRate;
    const union = gross * unionRate;
    const net = gross - (retirement + socialSecurity + union);
    const employerSS = gross * employerSocialRate;
    const employerFamily = gross * employerFamilyRate;
    return {
      result: {
        baseSalary: base,
        overtimePay,
        grossSalary: gross,
        employeeDeductions: { retirement, socialSecurity, union, total: retirement + socialSecurity + union },
        netSalary: net,
        employerContributions: { socialSecurity: employerSS, familyAllowances: employerFamily, total: employerSS + employerFamily },
        parameters: { retirementRate, socialSecurityRate, unionRate, employerSocialRate, employerFamilyRate },
        parameterSource: "ADN Organizacional / regla vigente configurada",
      },
      requiresApproval: gross > 1500000 || overtime > 20,
      summary: `Liquidación de sueldos y cargas sociales calculada. Haberes brutos: $${gross.toFixed(2)}, Neto: $${net.toFixed(2)}.`,
    };
  }

  return {
    result: { message: "Revisión contable general completada sin anomalías." },
    requiresApproval: false,
    summary: "Revisión contable procesada por célula especializada.",
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

  const rules = await db.select().from(organizationalDnaRules).limit(20);
  const policies = await db.select().from(organizationalDnaPolicies).limit(20);
  const dnaContext = [
    ...rules.map(rule => `[Regla ${rule.id}]: ${rule.name} - ${rule.content}`),
    ...policies.map(policy => `[Política]: ${policy.name} - ${policy.content}`),
  ].join("\n");

  await db.update(agents).set({ status: "in_task" }).where(eq(agents.id, agent.id));
  const deterministic = calculateDeterministicAccounting(input, rules);
  let requiresApproval = deterministic.requiresApproval;
  let llmInsight = deterministic.summary;

  try {
    const prompt = `Actúa como la célula agente "${agent.name}" (${agent.role}) en un estudio contable automatizado.
Contexto de ADN Organizacional (Normas y Políticas):
${dnaContext || "No hay reglas cargadas todavía; declara esa ausencia."}

Datos de la tarea:
Tipo: ${input.taskType}
Payload: ${JSON.stringify(input.payload)}
Resultado determinístico preliminar: ${JSON.stringify(deterministic.result)}

Genera una justificación técnica profesional, cita el criterio institucional utilizado cuando exista y determina si requiere revisión humana por riesgo normativo o umbral de monto. Responde únicamente con JSON válido.`;

    const llmResponse = await invokeLLM({
      model: "gpt-5-mini",
      reasoning: { effort: "low" },
      messages: [
        { role: "system", content: "Eres un agente contable cognitivo. No inventes normas: si faltan reglas en el ADN Organizacional, indícalo y recomienda revisión humana." },
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
    description: JSON.stringify({ taskType: input.taskType, inputPayload: input.payload, outputResult: { deterministicResult: deterministic.result, justification: llmInsight }, risk: requiresApproval ? "high" : "low" }),
    status: taskStatus,
    approvalStatus: requiresApproval ? "pending" : "not_required",
    approvalRequestedAt: requiresApproval ? new Date() : null,
    assignedAgentId: agent.id,
  });
  const taskId = Number(insertedTask[0].insertId);

  await db.insert(taskExecutions).values({
    taskId,
    agentId: agent.id,
    step: "Cálculo determinístico y razonamiento cognitivo",
    status: "completed",
    log: JSON.stringify({ taskType: input.taskType, requiresApproval, justification: llmInsight }),
    endTime: new Date(),
  });
  await db.update(agents).set({ status: "active" }).where(eq(agents.id, agent.id));
  await db.insert(auditLog).values({
    agentId: agent.id,
    userId: input.userId,
    action: `Ejecución de tarea ${input.taskType}`,
    entityType: "task",
    entityId: taskId,
    details: JSON.stringify({ taskType: input.taskType, requiresApproval, status: taskStatus }),
  });

  if (requiresApproval) {
    await db.insert(notifications).values({
      userId: input.userId,
      agentId: agent.id,
      type: "human_approval",
      message: `La célula ${agent.name} requiere aprobación humana para ${input.taskType} (${input.payload.clientName ?? "Caso General"}).`,
      isRead: 0,
    });
  } else {
    await db.insert(notifications).values({
      userId: input.userId,
      agentId: agent.id,
      type: "task_completed",
      message: `La célula ${agent.name} completó ${input.taskType} para ${input.payload.clientName ?? "Caso General"}.`,
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
  };
}
