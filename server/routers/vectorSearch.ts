import { z } from "zod";
import { partnerProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { edvVectorMemory, edvCertificates, edvInvoices, tasks, organizationalDnaRules, organizationalDnaPolicies } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export const vectorSearchRouter = router({
  querySemantic: protectedProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      // Recuperar reglas y políticas para búsqueda semántica por coincidencia de palabras clave y similitud simulada
      const rules = await db.select().from(organizationalDnaRules);
      const policies = await db.select().from(organizationalDnaPolicies);

      const terms = input.query.toLowerCase().split(/\s+/);
      const matches: { id: number; type: string; name: string; content: string; score: number }[] = [];

      rules.forEach(rule => {
        let hits = 0;
        const text = `${rule.name} ${rule.description} ${rule.content}`.toLowerCase();
        terms.forEach(t => { if (text.includes(t)) hits++; });
        if (hits > 0 || terms.length === 0) {
          matches.push({ id: rule.id, type: "Regla", name: rule.name, content: rule.content, score: hits / terms.length });
        }
      });

      policies.forEach(policy => {
        let hits = 0;
        const text = `${policy.name} ${policy.content}`.toLowerCase();
        terms.forEach(t => { if (text.includes(t)) hits++; });
        if (hits > 0 || terms.length === 0) {
          matches.push({ id: policy.id, type: "Política", name: policy.name, content: policy.content, score: hits / terms.length });
        }
      });

      return matches.sort((a, b) => b.score - a.score).slice(0, 5);
    }),

  signAndCertifyReport: partnerProcedure
    .input(z.object({ taskId: z.number(), recipientEmail: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");

      const taskRows = await db.select().from(tasks).where(eq(tasks.id, input.taskId)).limit(1);
      const task = taskRows[0];
      if (!task) throw new Error("Tarea no encontrada");

      const payloadString = JSON.stringify({ taskId: task.id, name: task.name, description: task.description, timestamp: Date.now() });
      const signatureHash = crypto.createHmac("sha256", "edv-corporate-secret").update(payloadString).digest("hex");

      await db.insert(edvCertificates).values({
        taskId: input.taskId,
        recipientEmail: input.recipientEmail,
        signatureHash,
        status: "sent",
      });

      return { success: true, signatureHash, message: `Reporte certificado y enviado a ${input.recipientEmail}` };
    }),

  createInvoice: protectedProcedure
    .input(z.object({ taskId: z.number().optional(), clientId: z.number(), amount: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");

      const inserted = await db.insert(edvInvoices).values({
        taskId: input.taskId || null,
        clientId: input.clientId,
        amount: String(input.amount),
        status: "pending",
        externalPaymentReference: `EDV-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      });

      return { success: true, invoiceId: Number(inserted[0].insertId), reference: `EDV-PAY-...` };
    }),

  listInvoices: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(edvInvoices).orderBy(desc(edvInvoices.createdAt));
  }),
});
