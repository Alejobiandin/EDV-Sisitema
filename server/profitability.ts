export type ProfitabilityClient = {
  id: number;
  name: string;
  taxCategory: string;
};

export type ProfitabilityInvoice = {
  clientId: number;
  amount: string | number;
};

export type ProfitabilityRow = {
  clientId: number;
  clientName: string;
  taxCategory: string;
  totalBilled: number;
  estimatedCost: number;
  margin: number;
  invoicesCount: number;
};

/**
 * Calcula una vista gerencial de rentabilidad sin mutar datos persistidos.
 * El costo operativo es un parámetro demostrativo configurable del modelo EDV.
 */
export function buildClientProfitability(
  clients: ProfitabilityClient[],
  invoices: ProfitabilityInvoice[],
  operatingCostRate = 0.35,
  clientOperatingCostRates: Record<number, number> = {},
): ProfitabilityRow[] {
  return clients.map(client => {
    const clientInvoices = invoices.filter(invoice => invoice.clientId === client.id);
    const totalBilled = clientInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const effectiveCostRate = clientOperatingCostRates[client.id] ?? operatingCostRate;
    const estimatedCost = totalBilled * effectiveCostRate;
    return {
      clientId: client.id,
      clientName: client.name,
      taxCategory: client.taxCategory,
      totalBilled,
      estimatedCost,
      margin: totalBilled - estimatedCost,
      invoicesCount: clientInvoices.length,
    };
  });
}

export function sortProfitabilityRows(
  rows: ProfitabilityRow[],
  metric: "margin" | "totalBilled",
): ProfitabilityRow[] {
  return [...rows].sort((a, b) => b[metric] - a[metric]);
}
