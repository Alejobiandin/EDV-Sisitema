export type CoordinationTaskType =
  | "tax_computation"
  | "payroll_liquidation"
  | "social_charges"
  | "accounting_review";
export type RiskLevel = "low" | "medium" | "high";

const workflows: Record<
  CoordinationTaskType,
  { organ: string; stages: string[]; risk: RiskLevel; externalAction: boolean }
> = {
  tax_computation: {
    organ: "Impositivo",
    stages: [
      "captura fiscal",
      "cálculo determinístico",
      "control cruzado",
      "aprobación profesional",
    ],
    risk: "high",
    externalAction: true,
  },
  payroll_liquidation: {
    organ: "Capital Humano",
    stages: [
      "legajo y CCT",
      "liquidación Python",
      "cargas sociales",
      "aprobación laboral",
    ],
    risk: "high",
    externalAction: true,
  },
  social_charges: {
    organ: "Capital Humano",
    stages: [
      "conceptos CCT",
      "F.931/LSD",
      "validación de formato",
      "aprobación laboral",
    ],
    risk: "high",
    externalAction: true,
  },
  accounting_review: {
    organ: "Contable",
    stages: [
      "mayor y asientos",
      "equilibrio",
      "análisis de variaciones",
      "cierre/aprobación",
    ],
    risk: "medium",
    externalAction: false,
  },
};

export function buildAgentCoordinationPlan(
  taskType: CoordinationTaskType,
  inputRisk: RiskLevel = workflows[taskType].risk
) {
  const workflow = workflows[taskType];
  const risk: RiskLevel =
    inputRisk === "high" || workflow.risk === "high"
      ? "high"
      : inputRisk === "medium" || workflow.risk === "medium"
        ? "medium"
        : "low";
  const requiresHumanApproval = risk !== "low" || workflow.externalAction;
  return {
    organ: workflow.organ,
    risk,
    requiresHumanApproval,
    externalAction: workflow.externalAction,
    autonomy: requiresHumanApproval
      ? ("assistive" as const)
      : ("bounded_auto" as const),
    stages: workflow.stages.map((name, index) => ({
      sequence: index + 1,
      name,
      status: index === 0 ? ("ready" as const) : ("waiting" as const),
    })),
    rule: requiresHumanApproval
      ? "No presentar, firmar, pagar ni emitir automáticamente; requiere aprobación humana."
      : "Puede completar dentro de límites internos y dejar auditoría.",
  };
}

export function shouldEscalate(input: {
  risk: RiskLevel;
  missingDnaRules: boolean;
  externalAction: boolean;
  llmAvailable: boolean;
}) {
  return (
    input.risk === "high" ||
    input.missingDnaRules ||
    input.externalAction ||
    !input.llmAvailable
  );
}

export function selectNextStage(
  stages: Array<{
    sequence: number;
    status: "ready" | "waiting" | "completed" | "blocked";
  }>
) {
  return (
    stages.find(stage => stage.status === "ready") ??
    stages.find(stage => stage.status === "waiting") ??
    null
  );
}
