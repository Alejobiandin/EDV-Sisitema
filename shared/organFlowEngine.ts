import type { OrganScenario } from "./organScenarios";

export type OrganFlowResult = {
  organCode: string;
  status: "ready" | "review" | "escalated";
  output: Record<string, string | number | boolean>;
  events: string[];
};

export function executeOrganScenario(scenario: OrganScenario, input: Record<string, unknown>): OrganFlowResult {
  const events = [`${scenario.organCode}:input_received`, `${scenario.organCode}:agents_dispatched`];
  let output: Record<string, string | number | boolean>;
  let status: OrganFlowResult["status"] = "ready";

  switch (scenario.organCode) {
    case "executive": {
      const risk = String(input.risk ?? "medium");
      const priority = risk === "high" ? "urgent" : risk === "low" ? "planned" : "normal";
      status = risk === "high" ? "escalated" : "ready";
      output = { priority, hitlRequired: risk === "high" };
      break;
    }
    case "tax": {
      const documents = Array.isArray(input.documents) ? input.documents : [];
      const period = String(input.period ?? "");
      status = documents.length > 0 && period.length > 0 ? "ready" : "review";
      output = { validDocuments: documents.length, period, exceptions: documents.length === 0 ? 1 : 0 };
      break;
    }
    case "finance": {
      const transactionAmount = Number(input.transactionAmount ?? 0);
      const invoiceAmount = Number(input.invoiceAmount ?? 0);
      const matched = input.direction === "credit" && transactionAmount === invoiceAmount && transactionAmount > 0;
      status = matched ? "ready" : "review";
      output = { matched, reconciliationAmount: transactionAmount, auditRequired: true };
      break;
    }
    case "people": {
      const employees = Array.isArray(input.employees) ? input.employees : [];
      const grossTotal = employees.reduce((total, employee) => total + Number((employee as { gross?: number }).gross ?? 0), 0);
      const socialCharges = Math.round(grossTotal * 0.23 * 100) / 100;
      output = { employees: employees.length, grossTotal, socialCharges, payrollReady: employees.length > 0 };
      status = employees.length > 0 ? "ready" : "review";
      break;
    }
    case "commercial": {
      const serviceAmount = Number(input.serviceAmount ?? 0);
      const feeRate = Number(input.feeRate ?? 0);
      const invoiceAmount = Math.round(serviceAmount * feeRate * 100) / 100;
      output = { invoiceAmount, requiresApproval: invoiceAmount > 100000 };
      status = invoiceAmount > 0 ? "ready" : "review";
      break;
    }
    case "operations": {
      const received = Number(input.received ?? 0);
      const consumed = Number(input.consumed ?? 0);
      const minimum = Number(input.minimum ?? 0);
      const stock = received - consumed;
      output = { stock, reorderAlert: stock < minimum };
      status = stock < 0 ? "review" : "ready";
      break;
    }
    case "legal": {
      const contractRenewalAt = String(input.contractRenewalAt ?? "");
      const regulatoryChange = Boolean(input.regulatoryChange);
      output = { obligationsDetected: contractRenewalAt.length > 0 ? 1 : 0, ruleReviewRequired: regulatoryChange };
      status = regulatoryChange ? "review" : "ready";
      break;
    }
    default:
      throw new Error(`Órgano no soportado: ${scenario.organCode}`);
  }

  events.push(`${scenario.organCode}:output_emitted`);
  if (status !== "ready") events.push(`${scenario.organCode}:hitl_review_required`);
  return { organCode: scenario.organCode, status, output, events };
}
