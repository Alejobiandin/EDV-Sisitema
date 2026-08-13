import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createAgent, getAgent, updateAgent, deleteAgent, listAgents, listAgentMetrics } from "../db";
import { z } from "zod";

export const agentsRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      status: z.enum(["active", "inactive", "in_task"]).optional(),
      organ: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createAgent(input);
    }),
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getAgent(input.id);
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      role: z.string().min(1).optional(),
      status: z.enum(["active", "inactive", "in_task"]).optional(),
      organ: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateAgent(id, data);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteAgent(input.id);
    }),
  list: publicProcedure
    .input(z.object({
      organ: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return listAgents(input?.organ, input?.status);
    }),
  metrics: publicProcedure
    .input(z.object({
      agentId: z.number().optional(),
      metricName: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return listAgentMetrics(input?.agentId, input?.metricName);
    }),

  executeTask: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      taskType: z.enum(["tax_computation", "payroll_liquidation", "social_charges", "accounting_review"]),
      payload: z.object({
        clientName: z.string().optional(),
        period: z.string().optional(),
        grossSales: z.number().optional(),
        vatPurchases: z.number().optional(),
        baseSalary: z.number().optional(),
        overtimeHours: z.number().optional(),
        cctName: z.string().optional(),
      }).passthrough(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { executeCognitiveAgentTask } = await import("../agentEngine");
      return executeCognitiveAgentTask({
        agentId: input.agentId,
        taskType: input.taskType,
        payload: input.payload,
        userId: ctx.user.id,
      });
    }),
});
