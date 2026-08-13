import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { 
  createAuditLog, getAuditLog, listAuditLogs,
  createNotification, getNotification, updateNotification, listNotifications
} from "../db";
import { z } from "zod";

export const systemLogsRouter = router({
  audit: router({
    create: protectedProcedure
      .input(z.object({
        agentId: z.number().optional(),
        userId: z.number().optional(),
        action: z.string().min(1),
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        details: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createAuditLog(input);
      }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getAuditLog(input.id);
      }),
    list: publicProcedure
      .input(z.object({
        agentId: z.number().optional(),
        userId: z.number().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return listAuditLogs(input?.agentId, input?.userId, input?.action, input?.entityType);
      }),
  }),
  notifications: router({
    create: protectedProcedure
      .input(z.object({
        userId: z.number(),
        agentId: z.number().optional(),
        type: z.enum(["task_completed", "agent_error", "human_approval", "system_alert", "pattern_detected"]),
        message: z.string().min(1),
        isRead: z.number().default(0),
      }))
      .mutation(async ({ input }) => createNotification(input)),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getNotification(input.id)),
    update: protectedProcedure
      .input(z.object({ id: z.number(), isRead: z.number().optional(), message: z.string().min(1).optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateNotification(id, data);
      }),
    list: publicProcedure
      .input(z.object({ userId: z.number().optional(), isRead: z.boolean().optional(), type: z.string().optional() }).optional())
      .query(async ({ input }) => listNotifications(input?.userId, input?.isRead, input?.type)),
  }),

});
