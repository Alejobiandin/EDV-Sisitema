import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { 
  createOrganizationalDnaRule, getOrganizationalDnaRule, updateOrganizationalDnaRule, deleteOrganizationalDnaRule, listOrganizationalDnaRules,
  createOrganizationalDnaPolicy, getOrganizationalDnaPolicy, updateOrganizationalDnaPolicy, deleteOrganizationalDnaPolicy, listOrganizationalDnaPolicies,
  createOrganizationalDnaWorkflow, getOrganizationalDnaWorkflow, updateOrganizationalDnaWorkflow, deleteOrganizationalDnaWorkflow, listOrganizationalDnaWorkflows
} from "../db";
import { z } from "zod";

export const dnaRouter = router({
  rules: router({
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["fiscal", "contable", "laboral", "general"]),
        name: z.string().min(1),
        description: z.string().optional(),
        content: z.string().min(1),
        jurisdiction: z.string().optional(),
        collectiveAgreement: z.string().optional(),
        effectiveFrom: z.coerce.date().optional(),
        effectiveTo: z.coerce.date().optional(),
        priority: z.number().int().min(0).optional(),
        isActive: z.number().int().min(0).max(1).optional(),
      }))
      .mutation(async ({ input }) => {
        return createOrganizationalDnaRule(input);
      }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getOrganizationalDnaRule(input.id);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["fiscal", "contable", "laboral", "general"]).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        content: z.string().min(1).optional(),
        jurisdiction: z.string().optional(),
        collectiveAgreement: z.string().optional(),
        effectiveFrom: z.coerce.date().optional(),
        effectiveTo: z.coerce.date().optional(),
        priority: z.number().int().min(0).optional(),
        isActive: z.number().int().min(0).max(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateOrganizationalDnaRule(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteOrganizationalDnaRule(input.id);
      }),
    list: publicProcedure
      .query(async () => {
        return listOrganizationalDnaRules();
      }),
  }),
  policies: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return createOrganizationalDnaPolicy(input);
      }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getOrganizationalDnaPolicy(input.id);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        content: z.string().min(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateOrganizationalDnaPolicy(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteOrganizationalDnaPolicy(input.id);
      }),
    list: publicProcedure
      .query(async () => {
        return listOrganizationalDnaPolicies();
      }),
  }),
  workflows: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        bpmnDefinition: z.string().min(1),
        version: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return createOrganizationalDnaWorkflow(input);
      }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getOrganizationalDnaWorkflow(input.id);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        bpmnDefinition: z.string().min(1).optional(),
        version: z.string().min(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateOrganizationalDnaWorkflow(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteOrganizationalDnaWorkflow(input.id);
      }),
    list: publicProcedure
      .query(async () => {
        return listOrganizationalDnaWorkflows();
      }),
  }),
});
