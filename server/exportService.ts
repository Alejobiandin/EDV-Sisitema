import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export type ExportReportPayload = {
  reportType: "tax" | "payroll";
  clientName: string;
  period: string;
  data: Record<string, unknown>;
  generatedBy?: string;
};

export async function generateExcelReport(payload: ExportReportPayload): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema Organizacional Cognitivo Multiagente";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(payload.reportType === "tax" ? "Determinación IVA" : "Liquidación Haberes");

  sheet.columns = [
    { header: "Concepto / Parámetro", key: "concept", width: 36 },
    { header: "Valor / Importe", key: "value", width: 24 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A8A" } };

  sheet.addRow({ concept: "Reporte Institucional", value: payload.reportType === "tax" ? "Determinación Impositiva (IVA)" : "Liquidación de Sueldos y Cargas" });
  sheet.addRow({ concept: "Cliente / Entidad", value: payload.clientName });
  sheet.addRow({ concept: "Período Fiscal", value: payload.period });
  sheet.addRow({ concept: "Fecha de Emisión", value: new Date().toLocaleString() });
  sheet.addRow({ concept: "Generado por", value: payload.generatedBy ?? "Célula Cognitiva Autorizada" });
  sheet.addRow({ concept: "", value: "" });

  const data = payload.data;
  if (payload.reportType === "tax") {
    sheet.addRow({ concept: "Ventas Gravadas", value: data.grossSales ?? 0 });
    sheet.addRow({ concept: "Alícuota IVA Aplicada", value: `${((Number(data.vatRate ?? 0.21)) * 100).toFixed(1)}%` });
    sheet.addRow({ concept: "Débito Fiscal IVA", value: data.vatDebits ?? 0 });
    sheet.addRow({ concept: "Crédito Fiscal IVA", value: data.vatCredits ?? 0 });
    sheet.addRow({ concept: "Saldo Técnico a Pagar", value: data.netVatDue ?? 0 });
    sheet.addRow({ concept: "Fuente Normativa / ADN", value: data.parameterSource ?? "ADN Organizacional" });
  } else {
    sheet.addRow({ concept: "Sueldo Básico", value: data.baseSalary ?? 0 });
    sheet.addRow({ concept: "Pago Horas Extra", value: data.overtimePay ?? 0 });
    sheet.addRow({ concept: "Haberes Brutos Totales", value: data.grossSalary ?? 0 });
    const deductions = data.employeeDeductions as { retirement?: number; socialSecurity?: number; union?: number; total?: number } | undefined;
    sheet.addRow({ concept: "Aportes Jubilatorios (11%)", value: deductions?.retirement ?? 0 });
    sheet.addRow({ concept: "Aporte Obra Social (3%)", value: deductions?.socialSecurity ?? 0 });
    sheet.addRow({ concept: "Aporte Sindical / Convencional", value: deductions?.union ?? 0 });
    sheet.addRow({ concept: "Total Deducciones Ley", value: deductions?.total ?? 0 });
    sheet.addRow({ concept: "Neto a Percibir", value: data.netSalary ?? 0 });
    const employer = data.employerContributions as { socialSecurity?: number; familyAllowances?: number; total?: number } | undefined;
    sheet.addRow({ concept: "Contribuciones Patronales F.931", value: employer?.total ?? 0 });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generatePdfReport(payload: ExportReportPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", err => reject(err));

    // Encabezado institucional
    doc.fontSize(20).fillColor("#1E3A8A").text("ESTUDIO CONTABLE COGNITIVO", { align: "left" });
    doc.fontSize(10).fillColor("#4B5563").text("Arquitectura Organizacional Multiagente con Memoria Institucional", { align: "left" });
    doc.moveDown(1);

    doc.fontSize(14).fillColor("#111827").text(payload.reportType === "tax" ? "REPORTE DE DETERMINACIÓN IMPOSITIVA (IVA)" : "REPORTE DE LIQUIDACIÓN DE HABERES", { continued: false });
    doc.fontSize(10).fillColor("#374151").text(`Cliente / Entidad: ${payload.clientName}`);
    doc.text(`Período: ${payload.period}`);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`);
    doc.text(`Célula Emisora: ${payload.generatedBy ?? "Área Especializada Cognitiva"}`);
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#D1D5DB").stroke();
    doc.moveDown(1);

    const data = payload.data;
    doc.fontSize(11).fillColor("#1F2937");

    if (payload.reportType === "tax") {
      doc.text(`Ventas Gravadas: $${Number(data.grossSales ?? 0).toLocaleString()}`);
      doc.text(`Alícuota IVA: ${(Number(data.vatRate ?? 0.21) * 100).toFixed(1)}%`);
      doc.text(`Débito Fiscal: $${Number(data.vatDebits ?? 0).toLocaleString()}`);
      doc.text(`Crédito Fiscal: $${Number(data.vatCredits ?? 0).toLocaleString()}`);
      doc.fontSize(12).fillColor("#1E3A8A").text(`Saldo Técnico Neto a Pagar: $${Number(data.netVatDue ?? 0).toLocaleString()}`, { continued: false });
    } else {
      doc.text(`Sueldo Básico: $${Number(data.baseSalary ?? 0).toLocaleString()}`);
      doc.text(`Horas Extra: $${Number(data.overtimePay ?? 0).toLocaleString()}`);
      doc.text(`Sueldo Bruto Total: $${Number(data.grossSalary ?? 0).toLocaleString()}`);
      const deductions = data.employeeDeductions as { retirement?: number; socialSecurity?: number; union?: number; total?: number } | undefined;
      doc.text(`Total Deducciones de Ley: $${Number(deductions?.total ?? 0).toLocaleString()}`);
      doc.fontSize(12).fillColor("#1E3A8A").text(`Sueldo Neto a Cobrar: $${Number(data.netSalary ?? 0).toLocaleString()}`, { continued: false });
      const employer = data.employerContributions as { total?: number } | undefined;
      doc.fontSize(10).fillColor("#374151").text(`Contribuciones Patronales (F.931): $${Number(employer?.total ?? 0).toLocaleString()}`);
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#6B7280").text("Este documento fue generado automáticamente por la plataforma multiagente cognitiva. Los cálculos se basan en las reglas parametrizadas en el ADN Organizacional y deben ser validados por un profesional responsable antes de su presentación oficial.", { align: "justify" });

    doc.end();
  });
}
