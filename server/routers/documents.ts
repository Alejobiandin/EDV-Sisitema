import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createDocument, getDocument, updateDocument, deleteDocument, listDocuments } from "../db";
import { z } from "zod";

export const documentsRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      s3Key: z.string().min(1),
      s3Url: z.string().url(),
      type: z.string().optional(),
      metadata: z.string().optional(),
      linkedDnaId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return createDocument(input);
    }),
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getDocument(input.id);
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      s3Key: z.string().min(1).optional(),
      s3Url: z.string().url().optional(),
      type: z.string().optional(),
      metadata: z.string().optional(),
      linkedDnaId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateDocument(id, data);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteDocument(input.id);
    }),
  list: publicProcedure
    .input(z.object({
      linkedDnaId: z.number().optional(),
      type: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return listDocuments(input?.linkedDnaId, input?.type);
    }),
});
