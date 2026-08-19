import { z } from "zod";
import { partnerProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  bankConnections,
  bankTransactions,
  edvInvoices,
  auditLog,
} from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { assertOrganizationAccess } from "../organizationAccess";

export const feedTransaction = z.object({
  externalId: z.string().min(3),
  bookedAt: z.coerce.date(),
  description: z.string().optional(),
  amount: z.number().finite(),
  direction: z.enum(["credit", "debit"]),
  rawPayload: z.record(z.string(), z.unknown()).optional(),
});

export const bankingRouter = router({
  createConnection: partnerProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive().default(1),
        name: z.string().min(2),
        institution: z.string().min(2),
        provider: z.string().min(2),
        accountMasked: z.string().optional(),
        secretRef: z.string().min(2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "write");
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      const inserted = await db
        .insert(bankConnections)
        .values({ ...input, accountMasked: input.accountMasked || null });
      return { success: true, connectionId: Number(inserted[0].insertId) };
    }),

  listConnections: partnerProcedure
    .input(z.object({ organizationId: z.number().int().positive().default(1) }))
    .query(async ({ input, ctx }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "read");
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(bankConnections)
        .where(eq(bankConnections.organizationId, input.organizationId))
        .orderBy(desc(bankConnections.updatedAt));
      return rows.map(
        ({ secretRef: _secretRef, ...safeConnection }) => safeConnection
      );
    }),

  listInvoices: partnerProcedure
    .input(z.object({ organizationId: z.number().int().positive().default(1) }))
    .query(async ({ input, ctx }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "read");
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(edvInvoices)
        .where(eq(edvInvoices.organizationId, input.organizationId))
        .orderBy(desc(edvInvoices.createdAt));
    }),

  listTransactions: partnerProcedure
    .input(
      z
        .object({
          organizationId: z.number().int().positive().default(1),
          connectionId: z.number().optional(),
          status: z
            .enum(["unmatched", "matched", "ignored", "review"])
            .optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const organizationId = input?.organizationId ?? 1;
      await assertOrganizationAccess(ctx, organizationId, "read");
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(bankTransactions)
        .where(eq(bankTransactions.organizationId, organizationId))
        .orderBy(desc(bankTransactions.bookedAt));
      return rows.filter(
        row =>
          (!input?.connectionId ||
            row.bankConnectionId === input.connectionId) &&
          (!input?.status || row.status === input.status)
      );
    }),

  importFeed: partnerProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive().default(1),
        connectionId: z.number(),
        transactions: z.array(feedTransaction).min(1).max(5000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "write");
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      const connection = await db
        .select()
        .from(bankConnections)
        .where(eq(bankConnections.id, input.connectionId));
      if (!connection[0]) throw new Error("Conexión bancaria inexistente");
      if (
        connection[0].organizationId !== undefined &&
        connection[0].organizationId !== input.organizationId
      )
        throw new Error("Conexión fuera de la organización seleccionada");

      let importedCount = 0;
      for (const transaction of input.transactions) {
        await db
          .insert(bankTransactions)
          .values({
            organizationId: input.organizationId,
            bankConnectionId: input.connectionId,
            externalId: transaction.externalId,
            bookedAt: transaction.bookedAt,
            description: transaction.description || null,
            amount: String(transaction.amount),
            direction: transaction.direction,
            rawPayload: transaction.rawPayload
              ? JSON.stringify(transaction.rawPayload)
              : null,
          })
          .onDuplicateKeyUpdate({
            set: {
              bookedAt: transaction.bookedAt,
              description: transaction.description || null,
              amount: String(transaction.amount),
              direction: transaction.direction,
              rawPayload: transaction.rawPayload
                ? JSON.stringify(transaction.rawPayload)
                : null,
            },
          });
        importedCount += 1;
      }

      await db
        .update(bankConnections)
        .set({ status: "active", lastSyncedAt: new Date() })
        .where(eq(bankConnections.id, input.connectionId));
      return { success: true, importedCount };
    }),

  reconcile: partnerProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive().default(1),
        transactionId: z.number(),
        invoiceId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "write");
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      const transactions = await db
        .select()
        .from(bankTransactions)
        .where(eq(bankTransactions.id, input.transactionId));
      const invoices = await db
        .select()
        .from(edvInvoices)
        .where(eq(edvInvoices.id, input.invoiceId));
      if (!transactions[0]) throw new Error("Movimiento bancario inexistente");
      if (!invoices[0]) throw new Error("Factura inexistente");
      if (
        transactions[0].organizationId !== undefined &&
        transactions[0].organizationId !== input.organizationId
      )
        throw new Error("Movimiento fuera de la organización seleccionada");
      if (
        invoices[0].organizationId !== undefined &&
        invoices[0].organizationId !== input.organizationId
      )
        throw new Error("Factura fuera de la organización seleccionada");
      if (transactions[0].direction !== "credit")
        throw new Error("Solo se pueden conciliar créditos contra facturas");

      await db
        .update(bankTransactions)
        .set({ status: "matched", matchedInvoiceId: input.invoiceId })
        .where(eq(bankTransactions.id, input.transactionId));
      await db
        .update(edvInvoices)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(edvInvoices.id, input.invoiceId));
      await db.insert(auditLog).values({
        userId: ctx.user?.id,
        action: "bank_transaction_reconciled",
        entityType: "bank_transaction",
        entityId: input.transactionId,
        details: JSON.stringify({
          invoiceId: input.invoiceId,
          amount: transactions[0].amount,
        }),
      });
      return {
        success: true,
        transactionId: input.transactionId,
        invoiceId: input.invoiceId,
      };
    }),
});
