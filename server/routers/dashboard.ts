import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { agents, agentMetrics, tasks, notifications, auditLog, organizationalDnaRules, organizationalDnaPolicies } from "../../drizzle/schema";
import { count, eq, sql } from "drizzle-orm";

export const dashboardRouter = router({
  summary: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        activeAgents: 0,
        totalAgents: 0,
        runningTasks: 0,
        pendingTasks: 0,
        unreadNotifications: 0,
        totalRules: 0,
        totalPolicies: 0,
        recentActivity: [],
        notificationsList: [],
        agentsList: [],
        tasksList: [],
      };
    }

    const allAgents = await db.select().from(agents);
    const totalAgents = allAgents.length;
    const activeAgents = allAgents.filter(a => a.status === 'active' || a.status === 'in_task').length;

    const allTasks = await db.select().from(tasks);
    const runningTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;

    const unreadNotifs = await db.select().from(notifications).where(eq(notifications.isRead, 0));
    const unreadNotifications = unreadNotifs.length;
    const notificationsList = await db.select().from(notifications).orderBy(sql`${notifications.createdAt} DESC`).limit(6);

    const rules = await db.select().from(organizationalDnaRules);
    const policies = await db.select().from(organizationalDnaPolicies);

    const recentActivity = await db.select().from(auditLog).orderBy(sql`${auditLog.timestamp} DESC`).limit(10);

    return {
      activeAgents,
      totalAgents,
      runningTasks,
      pendingTasks,
      unreadNotifications,
      totalRules: rules.length,
      totalPolicies: policies.length,
      recentActivity,
      notificationsList,
      agentsList: allAgents,
      tasksList: allTasks.slice(0, 10),
    };
  }),
});
