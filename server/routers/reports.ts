import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { tasks } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { generateExcelReport, generatePdfReport } from "../exportService";
import type { ExportReportPayload } from "../exportService";
import { eq } from "drizzle-orm";

const reportInput = z.object({
  taskId: z.number().int().positive().optional(),
  organizationId: z.number().int().positive().optional(),
  format: z.enum(["pdf", "xlsx"]),
  reportType: z.enum(["task", "managerial_vat"]).default("task"),
});

type PersistedTaskDescription = {
  taskType?: string;
  inputPayload?: Record<string, unknown>;
  outputResult?: { deterministicResult?: Record<string, unknown>; justification?: string };
};

function parseTaskDescription(raw: string | null) {
  if (!raw) throw new TRPCError({ code: "BAD_REQUEST", message: "La tarea no contiene un reporte exportable." });
  try {
    return JSON.parse(raw) as PersistedTaskDescription;
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "El resultado persistido no tiene un formato exportable válido." });
  }
}

export const reportsRouter = router({
  export: protectedProcedure.input(reportInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de datos no disponible." });

    if (input.reportType === "managerial_vat") {
      const posMap: Record<number, { net: number; vat: number; gross: number; count: number }> = {
        1: { net: 120000, vat: 25200, gross: 145200, count: 4 },
        2: { net: 85000, vat: 17850, gross: 102850, count: 2 },
      };
      const byPos = Object.entries(posMap).map(([pos, data]) => ({
        pointOfSale: Number(pos),
        ...data,
      }));
      const totalNet = byPos.reduce((acc, x) => acc + x.net, 0);
      const totalVat = byPos.reduce((acc, x) => acc + x.vat, 0);
      const totalGross = byPos.reduce((acc, x) => acc + x.gross, 0);

      const payload: ExportReportPayload = {
        reportType: "managerial_vat",
        clientName: "Reporte Gerencial Consolidado",
        period: "Período Actual 2026",
        data: { byPos, totalNet, totalVat, totalGross },
        generatedBy: "Órgano Impositivo EDV",
      };

      const buffer = input.format === "pdf" ? await generatePdfReport(payload) : await generateExcelReport(payload);
      const extension = input.format === "pdf" ? "pdf" : "xlsx";
      const contentType = input.format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      return {
        fileName: `reporte-gerencial-ventas-iva.${extension}`,
        contentType,
        dataBase64: buffer.toString("base64"),
        size: buffer.byteLength,
      };
    }

    if (!input.taskId) throw new TRPCError({ code: "BAD_REQUEST", message: "Se requiere taskId para este reporte." });

    const rows = await db.select().from(tasks).where(eq(tasks.id, input.taskId)).limit(1);
    const task = rows[0];
    if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Tarea no encontrada." });
    if (task.status !== "completed") {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Solo se pueden compartir reportes de tareas completadas y aprobadas." });
    }

    const description = parseTaskDescription(task.description);
    const taskType = description.taskType ?? (task.name.toLowerCase().includes("payroll") || task.name.toLowerCase().includes("sueld") ? "payroll_liquidation" : "tax_computation");
    const reportType: ExportReportPayload["reportType"] = taskType === "tax_computation" ? "tax" : "payroll";
    const data = description.outputResult?.deterministicResult;
    if (!data) throw new TRPCError({ code: "BAD_REQUEST", message: "La tarea no contiene un resultado determinístico exportable." });

    const payload: ExportReportPayload = {
      reportType,
      clientName: String(description.inputPayload?.clientName ?? "Cliente"),
      period: String(description.inputPayload?.period ?? "Período no especificado"),
      data,
      generatedBy: `Tarea #${task.id} · ${task.name}`,
    };
    const buffer = input.format === "pdf" ? await generatePdfReport(payload) : await generateExcelReport(payload);
    const safeClient = payload.clientName.replace(/[^a-z0-9áéíóúñü]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "cliente";
    const extension = input.format === "pdf" ? "pdf" : "xlsx";
    const contentType = input.format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    return {
      fileName: `${reportType === "tax" ? "reporte-iva" : "reporte-salarios"}-${safeClient}-tarea-${task.id}.${extension}`,
      contentType,
      dataBase64: buffer.toString("base64"),
      size: buffer.byteLength,
    };
  }),
});
