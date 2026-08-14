import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { agents, agentMetrics, tasks, notifications, auditLog, organizationalDnaRules, organizationalDnaPolicies, edvClients, edvInvoices } from "../../drizzle/schema";
import { count, eq, sql } from "drizzle-orm";
import { buildClientProfitability } from "../profitability";

export const dashboardRouter = router({
  summary: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        activeAgents: 0,
        totalAgents: 0,
        runningTasks: 0,
        pendingTasks: 0,
        approvalTasks: 0,
        approvedTasks: 0,
        rejectedTasks: 0,
        unreadNotifications: 0,
        totalRules: 0,
        totalPolicies: 0,
        clientProfitability: [],
        recentActivity: [],
        notificationsList: [],
        agentsList: [],
        tasksList: [],
        approvalTasksList: [],
      };
    }

    const allAgents = await db.select().from(agents);
    const totalAgents = allAgents.length;
    const activeAgents = allAgents.filter(a => a.status === 'active' || a.status === 'in_task').length;

    const allTasks = await db.select().from(tasks);
    const runningTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
    const approvalTasks = allTasks.filter(t => t.status === 'pending_approval').length;
    const approvedTasks = allTasks.filter(t => t.approvalStatus === 'approved').length;
    const rejectedTasks = allTasks.filter(t => t.approvalStatus === 'rejected').length;

    const unreadNotifs = await db.select().from(notifications).where(eq(notifications.isRead, 0));
    const unreadNotifications = unreadNotifs.length;
    const notificationsList = await db.select().from(notifications).orderBy(sql`${notifications.createdAt} DESC`).limit(6);

    const rules = await db.select().from(organizationalDnaRules);
    const policies = await db.select().from(organizationalDnaPolicies);

    const recentActivity = await db.select().from(auditLog).orderBy(sql`${auditLog.timestamp} DESC`).limit(10);
    const approvalTasksList = await db.select().from(tasks).where(eq(tasks.status, 'pending_approval')).orderBy(sql`${tasks.createdAt} DESC`);

    const clients = await db.select().from(edvClients);
    const invoices = await db.select().from(edvInvoices);

    const clientOperatingCostRates = Object.fromEntries(
      clients.map(client => [client.id, Number(client.operatingCostRate)]),
    );
    const clientProfitability = buildClientProfitability(clients, invoices, 0.35, clientOperatingCostRates);

    return {
      clientProfitability,
      activeAgents,
      totalAgents,
      runningTasks,
      pendingTasks,
      approvalTasks,
      approvedTasks,
      rejectedTasks,
      unreadNotifications,
      totalRules: rules.length,
      totalPolicies: policies.length,
      recentActivity,
      notificationsList,
      agentsList: allAgents,
      tasksList: allTasks.slice(0, 10),
      approvalTasksList,
    };
  }),
});
