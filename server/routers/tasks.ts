import { protectedProcedure, partnerProcedure, router } from "../_core/trpc";
import {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  listTasks,
  listTaskExecutions,
  approveTask,
  rejectTask,
} from "../db";
import { assertOrganizationAccess } from "../organizationAccess";
import { z } from "zod";

const taskStatus = z.enum([
  "pending",
  "in_progress",
  "pending_approval",
  "completed",
  "rejected",
  "failed",
  "cancelled",
]);

async function assertTaskBelongsToOrganization(
  ctx: unknown,
  taskId: number,
  organizationId?: number,
  mode: "read" | "write" | "admin" = "read"
) {
  const task = await getTask(taskId);
  if (!task) throw new Error("Tarea no encontrada");
  if (organizationId !== undefined && task.organizationId !== organizationId)
    throw new Error("Tarea fuera de la organización seleccionada");
  await assertOrganizationAccess(ctx as never, task.organizationId, mode);
  return task;
}

export const tasksRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive().default(1),
        name: z.string().min(1),
        description: z.string().optional(),
        status: taskStatus.optional(),
        workflowId: z.number().optional(),
        assignedAgentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "write");
      return createTask(input);
    }),
  get: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        organizationId: z.number().int().positive().default(1),
      })
    )
    .query(async ({ input, ctx }) =>
      assertTaskBelongsToOrganization(
        ctx,
        input.id,
        input.organizationId,
        "read"
      )
    ),
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        organizationId: z.number().int().positive().default(1),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        status: taskStatus.optional(),
        workflowId: z.number().optional(),
        assignedAgentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertTaskBelongsToOrganization(
        ctx,
        input.id,
        input.organizationId,
        "write"
      );
      const { id, organizationId: _organizationId, ...data } = input;
      return updateTask(id, data);
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        organizationId: z.number().int().positive().default(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertTaskBelongsToOrganization(
        ctx,
        input.id,
        input.organizationId,
        "write"
      );
      return deleteTask(input.id);
    }),
  list: protectedProcedure
    .input(
      z
        .object({
          organizationId: z.number().int().positive().default(1),
          status: z.string().optional(),
          assignedAgentId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const organizationId = input?.organizationId ?? 1;
      await assertOrganizationAccess(ctx, organizationId, "read");
      return listTasks(input?.status, input?.assignedAgentId, organizationId);
    }),
  executions: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        organizationId: z.number().int().positive().default(1),
      })
    )
    .query(async ({ input, ctx }) => {
      await assertTaskBelongsToOrganization(
        ctx,
        input.taskId,
        input.organizationId,
        "read"
      );
      return listTaskExecutions(input.taskId);
    }),
  approve: partnerProcedure
    .input(
      z.object({
        taskId: z.number(),
        organizationId: z.number().int().positive().optional(),
        comment: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await assertTaskBelongsToOrganization(
        ctx,
        input.taskId,
        input.organizationId,
        "write"
      );
      return approveTask(task.id, ctx.user.id, input.comment);
    }),
  reject: partnerProcedure
    .input(
      z.object({
        taskId: z.number(),
        organizationId: z.number().int().positive().optional(),
        comment: z.string().min(3).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await assertTaskBelongsToOrganization(
        ctx,
        input.taskId,
        input.organizationId,
        "write"
      );
      return rejectTask(task.id, ctx.user.id, input.comment);
    }),
});
