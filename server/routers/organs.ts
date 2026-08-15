import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { agents, tasks, notifications } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

const organCatalog = [
  { code: "executive", name: "Dirección y Coordinación Estratégica", description: "Prioridades, gobierno, ADN y cumplimiento." },
  { code: "tax", name: "Área Impositiva y Fiscal", description: "Impuestos, IVA, retenciones y cierres." },
  { code: "finance", name: "Área Contable y Financiera", description: "Contabilidad, cobranzas, proveedores y tesorería." },
  { code: "people", name: "Capital Humano y Nómina", description: "Legajos, sueldos, novedades y cargas sociales." },
  { code: "commercial", name: "Área Comercial y Facturación", description: "Facturación, precios, honorarios y contratos comerciales." },
  { code: "operations", name: "Operaciones y Abastecimiento", description: "Inventario, activos y proveedores operativos." },
  { code: "legal", name: "Área Legal y Contractual", description: "Contratos, cumplimiento y vigilancia normativa." },
] as const;

export const organsRouter = router({
  catalog: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return organCatalog.map(organ => ({ ...organ, agents: [], metrics: { totalAgents: 0, activeAgents: 0, runningTasks: 0, pendingApproval: 0, unreadAlerts: 0 } }));

    const allAgents = await db.select().from(agents);
    const allTasks = await db.select().from(tasks);
    const allNotifications = await db.select().from(notifications);

    return organCatalog.map(organ => {
      const organAgents = allAgents.filter(agent => agent.organ === organ.name);
      const agentIds = new Set(organAgents.map(agent => agent.id));
      return {
        ...organ,
        agents: organAgents,
        metrics: {
          totalAgents: organAgents.length,
          activeAgents: organAgents.filter(agent => agent.status === "active" || agent.status === "in_task").length,
          runningTasks: allTasks.filter(task => task.assignedAgentId && agentIds.has(task.assignedAgentId) && task.status === "in_progress").length,
          pendingApproval: allTasks.filter(task => task.assignedAgentId && agentIds.has(task.assignedAgentId) && task.status === "pending_approval").length,
          unreadAlerts: allNotifications.filter(notification => notification.agentId && agentIds.has(notification.agentId) && notification.isRead === 0).length,
        },
      };
    });
  }),

  agentDirectory: protectedProcedure
    .input(z.object({ organ: z.string().optional(), status: z.enum(["active", "inactive", "in_task"]).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const allAgents = await db.select().from(agents);
      return allAgents.filter(agent => (!input?.organ || agent.organ === input.organ) && (!input?.status || agent.status === input.status));
    }),
});
