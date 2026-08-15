export type OrganScenario = {
  organCode: string;
  inputLabel: string;
  expectedOutput: string;
  requiredAgents: string[];
};

export const ORGAN_SCENARIOS: OrganScenario[] = [
  { organCode: "executive", inputLabel: "objetivo empresarial y nivel de riesgo", expectedOutput: "prioridad coordinada y escalamiento HITL", requiredAgents: ["CEO-Agent", "DNA-Governor Agent", "Audit & Compliance Agent"] },
  { organCode: "tax", inputLabel: "comprobantes fiscales del período", expectedOutput: "posición fiscal validada y excepciones", requiredAgents: ["Tax Data Intake Agent", "VAT & Sales Tax Agent", "Withholding & Compliance Agent"] },
  { organCode: "finance", inputLabel: "movimiento bancario y factura pendiente", expectedOutput: "conciliación propuesta y asiento auditable", requiredAgents: ["Accounts Receivable Agent", "General Ledger Agent", "Treasury & Cash Flow Agent"] },
  { organCode: "people", inputLabel: "legajo y novedades laborales", expectedOutput: "liquidación de haberes y cargas sociales", requiredAgents: ["Personnel Administration Agent", "Payroll Calculation Agent", "Social Charges & F931 Agent"] },
  { organCode: "commercial", inputLabel: "servicio prestado y acuerdo comercial", expectedOutput: "propuesta de honorarios y comprobante", requiredAgents: ["Pricing & Fee Agent", "Invoicing Agent"] },
  { organCode: "operations", inputLabel: "compra, recepción y existencia", expectedOutput: "movimiento de stock y alerta de abastecimiento", requiredAgents: ["Vendor Management Agent", "Inventory & Stock Agent"] },
  { organCode: "legal", inputLabel: "contrato y cambio normativo", expectedOutput: "obligaciones extraídas y regla pendiente de revisión", requiredAgents: ["Contract Intelligence Agent", "Regulatory Watch Agent"] },
];

export function getOrganScenario(code: string) {
  return ORGAN_SCENARIOS.find(scenario => scenario.organCode === code);
}
