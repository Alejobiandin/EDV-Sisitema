import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export type ExportReportPayload = {
  reportType: "tax" | "payroll" | "managerial_vat";
  clientName: string;
  period: string;
  data: Record<string, unknown>;
  generatedBy?: string;
  companyTaxId?: string;
  companyName?: string;
  logoText?: string;
};

export async function generateExcelReport(payload: ExportReportPayload): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = payload.companyName ?? "EDV - Sistema Organizacional Cognitivo";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(
    payload.reportType === "managerial_vat" ? "Ventas e IVA por PV" : payload.reportType === "tax" ? "Determinación IVA EDV" : "Liquidación Haberes EDV"
  );

  sheet.columns = [
    { header: "Concepto / Parámetro Institucional", key: "concept", width: 40 },
    { header: "Valor / Importe", key: "value", width: 30 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A8A" } };

  sheet.addRow({ concept: "Sistema Organizacional", value: "EDV · Plataforma Cognitiva Multiagente" });
  sheet.addRow({ concept: "Empresa / Contribuyente", value: payload.companyName ?? "Estudio Contable EDV S.A." });
  sheet.addRow({ concept: "CUIT / Datos Fiscales", value: payload.companyTaxId ?? "CUIT: 30-71458921-4" });
  sheet.addRow({
    concept: "Reporte Institucional",
    value:
      payload.reportType === "managerial_vat"
        ? "Reporte Gerencial de Ventas e IVA"
        : payload.reportType === "tax"
          ? "Determinación Impositiva (IVA)"
          : "Liquidación de Sueldos y Cargas",
  });
  sheet.addRow({ concept: "Período Fiscal", value: payload.period });
  sheet.addRow({ concept: "Fecha de Emisión", value: new Date().toLocaleString() });
  sheet.addRow({ concept: "", value: "" });

  const data = payload.data;
  if (payload.reportType === "managerial_vat") {
    sheet.addRow({ concept: "Punto de Venta", value: "Comprobantes / Neto / IVA" });
    const byPos = (data.byPos as Array<{ pointOfSale: number; count: number; net: number; vat: number; gross: number }>) ?? [];
    for (const p of byPos) {
      sheet.addRow({
        concept: `Punto de Venta #${p.pointOfSale} (${p.count} comps)`,
        value: `Neto: $${p.net.toFixed(2)} | IVA: $${p.vat.toFixed(2)} | Total: $${p.gross.toFixed(2)}`,
      });
    }
    sheet.addRow({ concept: "", value: "" });
    sheet.addRow({ concept: "Total Neto Gravado", value: data.totalNet ?? 0 });
    sheet.addRow({ concept: "Total IVA Discriminado", value: data.totalVat ?? 0 });
    sheet.addRow({ concept: "Total Bruto General", value: data.totalGross ?? 0 });
  } else if (payload.reportType === "tax") {
    sheet.addRow({ concept: "Ventas Gravadas", value: data.grossSales ?? 0 });
    sheet.addRow({ concept: "Alícuota IVA Aplicada", value: `${(Number(data.vatRate ?? 0.21) * 100).toFixed(1)}%` });
    sheet.addRow({ concept: "Débito Fiscal IVA", value: data.vatDebits ?? 0 });
    sheet.addRow({ concept: "Crédito Fiscal IVA", value: data.vatCredits ?? 0 });
    sheet.addRow({ concept: "Saldo Técnico a Pagar", value: data.netVatDue ?? 0 });
  } else {
    sheet.addRow({ concept: "Sueldo Básico", value: data.baseSalary ?? 0 });
    sheet.addRow({ concept: "Haberes Brutos Totales", value: data.grossSalary ?? 0 });
    sheet.addRow({ concept: "Neto a Percibir", value: data.netSalary ?? 0 });
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

    doc.rect(50, 45, 495, 65).fill("#1E3A8A");
    doc.fontSize(22).fillColor("#FFFFFF").text(payload.logoText ?? "EDV", 65, 57, { continued: true });
    doc.fontSize(10).fillColor("#93C5FD").text("  |  SISTEMA COGNITIVO MULTIAGENTE", { baseline: "bottom" });
    doc.fontSize(9.5)
      .fillColor("#E2E8F0")
      .text(`${payload.companyName ?? "Estudio Contable EDV S.A."}  ·  ${payload.companyTaxId ?? "CUIT: 30-71458921-4"}`, 65, 82);
    doc.moveDown(3);

    if (payload.reportType === "managerial_vat") {
      doc.fontSize(16).fillColor("#1E3A8A").text("Reporte Gerencial: Ventas e IVA por Punto de Venta", 50, 130);
      doc.fontSize(10).fillColor("#475569").text(`Organización: ${payload.companyName ?? "Estudio Contable EDV"}`, 50, 155);
      doc.text(`Período: ${payload.period}`, 50, 170);

      let y = 205;
      doc.rect(50, y, 495, 22).fill("#F1F5F9");
      doc.fontSize(9).fillColor("#0F172A").text("Pto Venta", 60, y + 6);
      doc.text("Comprobantes", 150, y + 6);
      doc.text("Neto Gravado", 260, y + 6);
      doc.text("IVA (21%)", 370, y + 6);
      doc.text("Total Bruto", 470, y + 6);
      y += 22;

      const data = payload.data;
      const byPos = (data.byPos as Array<{ pointOfSale: number; count: number; net: number; vat: number; gross: number }>) ?? [];
      for (const p of byPos) {
        doc.fontSize(9).fillColor("#334155").text(`PV #${p.pointOfSale}`, 60, y + 6);
        doc.text(String(p.count), 150, y + 6);
        doc.text(`$${p.net.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`, 260, y + 6);
        doc.text(`$${p.vat.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`, 370, y + 6);
        doc.text(`$${p.gross.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`, 470, y + 6);
        y += 20;
      }

      y += 10;
      doc.moveTo(50, y).lineTo(545, y).strokeColor("#CBD5E1").stroke();
      y += 15;
      doc.fontSize(10).fillColor("#0F172A").font("Helvetica-Bold").text("Totales Generales:", 60, y);
      doc.text(`Neto: $${Number(data.totalNet ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 2 })}`, 220, y);
      doc.text(`IVA: $${Number(data.totalVat ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 2 })}`, 350, y);
      doc.text(`Total: $${Number(data.totalGross ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 2 })}`, 450, y);

      doc.end();
    } else {
      doc.fontSize(14).fillColor("#111827").text(payload.reportType === "tax" ? "REPORTE DE DETERMINACIÓN IMPOSITIVA (IVA)" : "REPORTE DE LIQUIDACIÓN DE HABERES");
      doc.fontSize(10).fillColor("#374151").text(`Cliente / Entidad: ${payload.clientName}`);
      doc.text(`Período Fiscal: ${payload.period}`);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`);
      doc.end();
    }
  });
}
