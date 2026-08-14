import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const organizationalDnaRules = mysqlTable("organizational_dna_rules", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["fiscal", "contable", "laboral", "general"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const organizationalDnaPolicies = mysqlTable("organizational_dna_policies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const organizationalDnaWorkflows = mysqlTable("organizational_dna_workflows", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  bpmnDefinition: text("bpmnDefinition").notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "in_task"]).default("inactive").notNull(),
  organ: varchar("organ", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agentMetrics = mysqlTable("agent_metrics", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull().references(() => agents.id),
  metricName: varchar("metricName", { length: 255 }).notNull(),
  metricValue: varchar("metricValue", { length: 255 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "pending_approval", "completed", "rejected", "failed", "cancelled"]).default("pending").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["not_required", "pending", "approved", "rejected"]).default("not_required").notNull(),
  approvalRequestedAt: timestamp("approvalRequestedAt"),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy").references(() => users.id),
  approvalComment: text("approvalComment"),
  workflowId: int("workflowId").references(() => organizationalDnaWorkflows.id),
  assignedAgentId: int("assignedAgentId").references(() => agents.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const taskExecutions = mysqlTable("task_executions", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => tasks.id),
  agentId: int("agentId").notNull().references(() => agents.id),
  step: varchar("step", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).notNull(),
  log: text("log"),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
});

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  s3Key: varchar("s3Key", { length: 255 }).notNull(),
  s3Url: varchar("s3Url", { length: 512 }).notNull(),
  type: varchar("type", { length: 100 }),
  metadata: text("metadata"),
  linkedDnaId: int("linkedDnaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").references(() => agents.id),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 255 }),
  entityId: int("entityId"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  agentId: int("agentId").references(() => agents.id),
  type: mysqlEnum("type", ["task_completed", "agent_error", "human_approval", "system_alert", "pattern_detected"]).notNull(),
  message: text("message").notNull(),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  theme: varchar("theme", { length: 50 }).default("light").notNull(),
  dashboardLayout: text("dashboardLayout"),
  density: mysqlEnum("density", ["compact", "comfortable"]).default("comfortable").notNull(),
  notificationSettings: text("notificationSettings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userPatterns = mysqlTable("user_patterns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  patternType: varchar("patternType", { length: 255 }).notNull(),
  patternValue: text("patternValue").notNull(),
  lastDetected: timestamp("lastDetected").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type OrganizationalDnaRule = typeof organizationalDnaRules.$inferSelect;
export type InsertOrganizationalDnaRule = typeof organizationalDnaRules.$inferInsert;
export type UpdateOrganizationalDnaRule = Partial<typeof organizationalDnaRules.$inferInsert>;

export type OrganizationalDnaPolicy = typeof organizationalDnaPolicies.$inferSelect;
export type InsertOrganizationalDnaPolicy = typeof organizationalDnaPolicies.$inferInsert;
export type UpdateOrganizationalDnaPolicy = Partial<typeof organizationalDnaPolicies.$inferInsert>;

export type OrganizationalDnaWorkflow = typeof organizationalDnaWorkflows.$inferSelect;
export type InsertOrganizationalDnaWorkflow = typeof organizationalDnaWorkflows.$inferInsert;
export type UpdateOrganizationalDnaWorkflow = Partial<typeof organizationalDnaWorkflows.$inferInsert>;

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;
export type UpdateAgent = Partial<typeof agents.$inferInsert>;

export type AgentMetric = typeof agentMetrics.$inferSelect;
export type InsertAgentMetric = typeof agentMetrics.$inferInsert;
export type UpdateAgentMetric = Partial<typeof agentMetrics.$inferInsert>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type UpdateTask = Partial<typeof tasks.$inferInsert>;

export type TaskExecution = typeof taskExecutions.$inferSelect;
export type InsertTaskExecution = typeof taskExecutions.$inferInsert;
export type UpdateTaskExecution = Partial<typeof taskExecutions.$inferInsert>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type UpdateDocument = Partial<typeof documents.$inferInsert>;

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;
export type UpdateAuditLog = Partial<typeof auditLog.$inferInsert>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type UpdateNotification = Partial<typeof notifications.$inferInsert>;

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;
export type UpdateUserPreference = Partial<typeof userPreferences.$inferInsert>;

export type UserPattern = typeof userPatterns.$inferSelect;
export type InsertUserPattern = typeof userPatterns.$inferInsert;
export type UpdateUserPattern = Partial<typeof userPatterns.$inferInsert>;

export const edvClients = mysqlTable("edv_clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  taxId: varchar("taxId", { length: 50 }).notNull().unique(),
  taxCategory: varchar("taxCategory", { length: 100 }).notNull(), // Responsable Inscripto, Monotributo, etc.
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  status: mysqlEnum("status", ["active", "suspended", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const edvEmployees = mysqlTable("edv_employees", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => edvClients.id),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  taxIdNumber: varchar("taxIdNumber", { length: 50 }).notNull().unique(), // CUIL / CUIT
  baseSalary: decimal("baseSalary", { precision: 12, scale: 2 }).notNull(),
  cct: varchar("cct", { length: 100 }), // Convenio Colectivo de Trabajo
  status: mysqlEnum("status", ["active", "leave", "terminated"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
