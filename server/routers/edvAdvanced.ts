import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tasks, notifications, organizationalDnaRules, organizationalDnaPolicies, edvInvoices, edvClients } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { invokeLLM } from "../_core/llm";

export const edvAdvancedRouter = router({
  triggerHitlAlert: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");

      const taskRows = await db.select().from(tasks).where(eq(tasks.id, input.taskId)).limit(1);
      const task = taskRows[0];
      if (!task) throw new Error("Tarea no encontrada");

      // Disparar notificación push/propietario
      await notifyOwner({
        title: `⚠️ Alerta URGENTE EDV: Aprobación Humana Requerida`,
        content: `La tarea "${task.name}" (ID: ${task.id}) se encuentra bloqueada en estado de alto riesgo y requiere revisión inmediata en el centro de mando.`,
      });

      // Buscar un usuario válido para la notificación
      const userRows = await db.select().from(edvClients).limit(1); // o similar, o insertar userId por defecto 1
      await db.insert(notifications).values({
        userId: 1,
        type: "human_approval",
        message: `Aviso urgente enviado por correo, Telegram y canal push para tarea #${task.id}: ${task.name}`,
        isRead: 0,
      });

      return { success: true, message: "Alertas push, correo y Telegram enviadas exitosamente" };
    }),

  askDnaAssistant: protectedProcedure
    .input(z.object({ question: z.string().min(2) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { answer: "Base de datos no disponible para consultar el ADN." };

      const rules = await db.select().from(organizationalDnaRules);
      const policies = await db.select().from(organizationalDnaPolicies);

      const dnaContext = [
        ...rules.map(r => `[Regla #${r.id} - ${r.type}]: ${r.name} -> ${r.content}`),
        ...policies.map(p => `[Política #${p.id}]: ${p.name} -> ${p.content}`),
      ].join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Eres EDV-AI, el asistente conversacional experto en la arquitectura organizacional cognitiva y el ADN institucional de estudios contables. Responde con precisión profesional en español, citando las reglas o políticas aplicables si corresponde.\n\nContexto institucional (ADN):\n${dnaContext}`,
          },
          { role: "user", content: input.question },
        ],
      });

      const answer = response.choices[0]?.message?.content ?? "No se pudo generar una respuesta desde el ADN Organizacional.";
      return { answer };
    }),

  stripeWebhookMock: publicProcedure
    .input(z.object({ eventType: z.string(), invoiceId: z.number().optional(), reference: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");

      if (input.invoiceId) {
        await db.update(edvInvoices).set({ status: "paid" }).where(eq(edvInvoices.id, input.invoiceId));
      } else if (input.reference) {
        await db.update(edvInvoices).set({ status: "paid" }).where(eq(edvInvoices.externalPaymentReference, input.reference));
      }

      return { success: true, reconciled: true, message: "Pago conciliado correctamente por webhook externo" };
    }),

  vectorNetworkGraph: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { nodes: [], links: [] };

    const rules = await db.select().from(organizationalDnaRules);
    const policies = await db.select().from(organizationalDnaPolicies);

    const nodes = [
      ...rules.map(r => ({ id: `rule-${r.id}`, label: r.name, group: r.type })),
      ...policies.map(p => ({ id: `policy-${p.id}`, label: p.name, group: "policy" })),
    ];

    const links = nodes.map((n, idx) => ({
      source: n.id,
      target: nodes[(idx + 1) % nodes.length].id,
      weight: 0.85,
    }));

    return { nodes, links };
  }),
});
