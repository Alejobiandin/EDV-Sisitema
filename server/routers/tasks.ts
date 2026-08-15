import { partnerProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createTask, getTask, updateTask, deleteTask, listTasks, listTaskExecutions, approveTask, rejectTask } from "../db";
import { z } from "zod";

export const tasksRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["pending", "in_progress", "pending_approval", "completed", "rejected", "failed", "cancelled"]).optional(),
      workflowId: z.number().optional(),
      assignedAgentId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return createTask(input);
    }),
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getTask(input.id);
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(["pending", "in_progress", "pending_approval", "completed", "rejected", "failed", "cancelled"]).optional(),
      workflowId: z.number().optional(),
      assignedAgentId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateTask(id, data);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteTask(input.id);
    }),
  list: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      assignedAgentId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return listTasks(input?.status, input?.assignedAgentId);
    }),
  executions: publicProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      return listTaskExecutions(input.taskId);
    }),

  approve: partnerProcedure
    .input(z.object({
      taskId: z.number(),
      comment: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return approveTask(input.taskId, ctx.user.id, input.comment);
    }),

  reject: partnerProcedure
    .input(z.object({
      taskId: z.number(),
      comment: z.string().min(3).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      return rejectTask(input.taskId, ctx.user.id, input.comment);
    }),
});
