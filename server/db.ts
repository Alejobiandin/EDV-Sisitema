import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  organizationalDnaRules,
  organizationalDnaPolicies,
  organizationalDnaWorkflows,
  agents,
  agentMetrics,
  tasks,
  taskExecutions,
  documents,
  auditLog,
  notifications,
  userPreferences,
  userPatterns,
} from "../drizzle/schema";
import type {
  OrganizationalDnaRule,
  InsertOrganizationalDnaRule,
  UpdateOrganizationalDnaRule,
  OrganizationalDnaPolicy,
  InsertOrganizationalDnaPolicy,
  UpdateOrganizationalDnaPolicy,
  OrganizationalDnaWorkflow,
  InsertOrganizationalDnaWorkflow,
  UpdateOrganizationalDnaWorkflow,
  Agent,
  InsertAgent,
  UpdateAgent,
  AgentMetric,
  InsertAgentMetric,
  UpdateAgentMetric,
  Task,
  InsertTask,
  UpdateTask,
  TaskExecution,
  InsertTaskExecution,
  UpdateTaskExecution,
  Document,
  InsertDocument,
  UpdateDocument,
  AuditLog,
  InsertAuditLog,
  UpdateAuditLog,
  Notification,
  InsertNotification,
  UpdateNotification,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Organizational DNA Rules CRUD
export async function createOrganizationalDnaRule(rule: InsertOrganizationalDnaRule): Promise<OrganizationalDnaRule | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(organizationalDnaRules).values(rule);
  return await getOrganizationalDnaRule(result[0].insertId);
}

export async function getOrganizationalDnaRule(id: number): Promise<OrganizationalDnaRule | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organizationalDnaRules).where(eq(organizationalDnaRules.id, id)).limit(1);
  return result[0];
}

export async function updateOrganizationalDnaRule(id: number, rule: UpdateOrganizationalDnaRule): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(organizationalDnaRules).set(rule).where(eq(organizationalDnaRules.id, id));
  return result[0].affectedRows > 0;
}

export async function deleteOrganizationalDnaRule(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(organizationalDnaRules).where(eq(organizationalDnaRules.id, id));
  return result[0].affectedRows > 0;
}

export async function listOrganizationalDnaRules(): Promise<OrganizationalDnaRule[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(organizationalDnaRules);
}

// Organizational DNA Policies CRUD
export async function createOrganizationalDnaPolicy(policy: InsertOrganizationalDnaPolicy): Promise<OrganizationalDnaPolicy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(organizationalDnaPolicies).values(policy);
  return await getOrganizationalDnaPolicy(result[0].insertId);
}

export async function getOrganizationalDnaPolicy(id: number): Promise<OrganizationalDnaPolicy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organizationalDnaPolicies).where(eq(organizationalDnaPolicies.id, id)).limit(1);
  return result[0];
}

export async function updateOrganizationalDnaPolicy(id: number, policy: UpdateOrganizationalDnaPolicy): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(organizationalDnaPolicies).set(policy).where(eq(organizationalDnaPolicies.id, id));
  return result[0].affectedRows > 0;
}

export async function deleteOrganizationalDnaPolicy(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(organizationalDnaPolicies).where(eq(organizationalDnaPolicies.id, id));
  return result[0].affectedRows > 0;
}

export async function listOrganizationalDnaPolicies(): Promise<OrganizationalDnaPolicy[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(organizationalDnaPolicies);
}

// Organizational DNA Workflows CRUD
export async function createOrganizationalDnaWorkflow(workflow: InsertOrganizationalDnaWorkflow): Promise<OrganizationalDnaWorkflow | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(organizationalDnaWorkflows).values(workflow);
  return await getOrganizationalDnaWorkflow(result[0].insertId);
}

export async function getOrganizationalDnaWorkflow(id: number): Promise<OrganizationalDnaWorkflow | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organizationalDnaWorkflows).where(eq(organizationalDnaWorkflows.id, id)).limit(1);
  return result[0];
}

export async function updateOrganizationalDnaWorkflow(id: number, workflow: UpdateOrganizationalDnaWorkflow): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(organizationalDnaWorkflows).set(workflow).where(eq(organizationalDnaWorkflows.id, id));
  return result[0].affectedRows > 0;
}

export async function deleteOrganizationalDnaWorkflow(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(organizationalDnaWorkflows).where(eq(organizationalDnaWorkflows.id, id));
  return result[0].affectedRows > 0;
}

export async function listOrganizationalDnaWorkflows(): Promise<OrganizationalDnaWorkflow[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(organizationalDnaWorkflows);
}

// Agents CRUD
export async function createAgent(agent: InsertAgent): Promise<Agent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(agents).values(agent);
  return await getAgent(result[0].insertId);
}

export async function getAgent(id: number): Promise<Agent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result[0];
}

export async function updateAgent(id: number, agent: UpdateAgent): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(agents).set(agent).where(eq(agents.id, id));
  return result[0].affectedRows > 0;
}

export async function deleteAgent(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(agents).where(eq(agents.id, id));
  return result[0].affectedRows > 0;
}

export async function listAgents(organ?: string, status?: string): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(agents);
  if (organ) query = query.where(eq(agents.organ as any, organ));
  if (status) query = query.where(eq(agents.status as any, status));
  return await query;
}

// Documents CRUD
export async function createDocument(doc: InsertDocument): Promise<Document | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(documents).values(doc);
  return await getDocument(result[0].insertId);
}

export async function getDocument(id: number): Promise<Document | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0];
}

export async function updateDocument(id: number, doc: UpdateDocument): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(documents).set(doc).where(eq(documents.id, id));
  return result[0].affectedRows > 0;
}

export async function deleteDocument(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(documents).where(eq(documents.id, id));
  return result[0].affectedRows > 0;
}

export async function listDocuments(linkedDnaId?: number, type?: string): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(documents);
  if (linkedDnaId) query = query.where(eq(documents.linkedDnaId, linkedDnaId));
  if (type) query = query.where(eq(documents.type as any, type));
  return await query;
}

// Audit Log CRUD
export async function createAuditLog(log: InsertAuditLog): Promise<AuditLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(auditLog).values(log);
  return await getAuditLog(result[0].insertId);
}

export async function getAuditLog(id: number): Promise<AuditLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(auditLog).where(eq(auditLog.id, id)).limit(1);
  return result[0];
}

export async function listAuditLogs(agentId?: number, userId?: number, action?: string, entityType?: string): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(auditLog);
  if (agentId) query = query.where(eq(auditLog.agentId, agentId));
  if (userId) query = query.where(eq(auditLog.userId, userId));
  if (action) query = query.where(eq(auditLog.action as any, action));
  if (entityType) query = query.where(eq(auditLog.entityType as any, entityType));
  return await query;
}

// Notifications CRUD
export async function createNotification(notification: InsertNotification): Promise<Notification | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(notifications).values(notification);
  return await getNotification(result[0].insertId);
}

export async function getNotification(id: number): Promise<Notification | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  return result[0];
}

export async function listNotifications(userId?: number, isRead?: boolean, type?: string): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(notifications);
  if (userId) query = query.where(eq(notifications.userId, userId));
  if (isRead !== undefined) query = query.where(eq(notifications.isRead, isRead ? 1 : 0));
  if (type) query = query.where(eq(notifications.type as any, type));
  return await query;
}


// Tasks CRUD
export async function createTask(task: InsertTask): Promise<Task | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(tasks).values(task);
  return await getTask(result[0].insertId);
}

export async function getTask(id: number): Promise<Task | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function updateTask(id: number, task: UpdateTask): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(tasks).set(task).where(eq(tasks.id, id));
  return result[0].affectedRows > 0;
}

export async function deleteTask(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(tasks).where(eq(tasks.id, id));
  return result[0].affectedRows > 0;
}

export async function approveTask(taskId: number, userId: number, comment?: string): Promise<Task | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const task = await getTask(taskId);
  if (!task || task.status !== "pending_approval" || task.approvalStatus !== "pending") {
    throw new Error("La tarea no está disponible para aprobación humana");
  }

  await db.update(tasks).set({
    status: "completed",
    approvalStatus: "approved",
    approvedAt: new Date(),
    approvedBy: userId,
    approvalComment: comment ?? null,
  }).where(eq(tasks.id, taskId));

  await db.insert(auditLog).values({
    agentId: task.assignedAgentId,
    userId,
    action: "Aprobación humana de tarea",
    entityType: "task",
    entityId: taskId,
    details: JSON.stringify({ decision: "approved", comment: comment ?? null }),
  });

  await db.insert(notifications).values({
    userId,
    agentId: task.assignedAgentId,
    type: "task_completed",
    message: `La tarea ${task.name} fue aprobada y finalizó su ejecución.`,
    isRead: 0,
  });

  return getTask(taskId);
}

export async function rejectTask(taskId: number, userId: number, comment: string): Promise<Task | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const task = await getTask(taskId);
  if (!task || task.status !== "pending_approval" || task.approvalStatus !== "pending") {
    throw new Error("La tarea no está disponible para rechazo humano");
  }

  await db.update(tasks).set({
    status: "rejected",
    approvalStatus: "rejected",
    approvedAt: new Date(),
    approvedBy: userId,
    approvalComment: comment,
  }).where(eq(tasks.id, taskId));

  await db.insert(auditLog).values({
    agentId: task.assignedAgentId,
    userId,
    action: "Rechazo humano de tarea",
    entityType: "task",
    entityId: taskId,
    details: JSON.stringify({ decision: "rejected", comment }),
  });

  await db.insert(notifications).values({
    userId,
    agentId: task.assignedAgentId,
    type: "system_alert",
    message: `La tarea ${task.name} fue rechazada por revisión humana.`,
    isRead: 0,
  });

  return getTask(taskId);
}

export async function listTasks(status?: string, assignedAgentId?: number, organizationId?: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(tasks);
  if (status) query = query.where(eq(tasks.status as any, status));
  if (assignedAgentId) query = query.where(eq(tasks.assignedAgentId, assignedAgentId));
  if (organizationId) query = query.where(eq(tasks.organizationId, organizationId));
  return await query;
}

export async function listTaskExecutions(taskId?: number): Promise<TaskExecution[]> {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(taskExecutions);
  if (taskId) query = query.where(eq(taskExecutions.taskId, taskId));
  return await query;
}

export async function listAgentMetrics(agentId?: number, metricName?: string): Promise<AgentMetric[]> {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(agentMetrics);
  if (agentId) query = query.where(eq(agentMetrics.agentId, agentId));
  if (metricName) query = query.where(eq(agentMetrics.metricName, metricName));
  return await query;
}

export async function updateNotification(id: number, notification: UpdateNotification): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(notifications).set(notification).where(eq(notifications.id, id));
  return result[0].affectedRows > 0;
}
