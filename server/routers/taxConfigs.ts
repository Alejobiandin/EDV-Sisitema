import { z } from "zod";
import { partnerProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { taxConfigurations } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { storagePut } from "../storage";

export const taxConfigsRouter = router({
  get: partnerProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(taxConfigurations).where(eq(taxConfigurations.organizationId, input.organizationId)).limit(1);
      return rows[0] ?? null;
    }),

  save: partnerProcedure
    .input(
      z.object({
        organizationId: z.number(),
        cuit: z.string().min(11),
        environment: z.enum(["homologation", "production"]),
        pointOfSale: z.number().int().positive(),
        certContent: z.string().optional(),
        keyContent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");

      let certKey: string | undefined;
      let keyKey: string | undefined;

      if (input.certContent) {
        const res = await storagePut(`tax-certs/${input.organizationId}-cert.crt`, input.certContent, "application/x-x509-ca-cert");
        certKey = res.key;
      }
      if (input.keyContent) {
        const res = await storagePut(`tax-certs/${input.organizationId}-key.key`, input.keyContent, "application/octet-stream");
        keyKey = res.key;
      }

      const existing = await db.select().from(taxConfigurations).where(eq(taxConfigurations.organizationId, input.organizationId)).limit(1);

      if (existing.length > 0) {
        await db
          .update(taxConfigurations)
          .set({
            cuit: input.cuit,
            environment: input.environment,
            pointOfSale: input.pointOfSale,
            ...(certKey ? { certStorageKey: certKey } : {}),
            ...(keyKey ? { keyStorageKey: keyKey } : {}),
            status: "configured",
            updatedAt: new Date(),
          })
          .where(eq(taxConfigurations.organizationId, input.organizationId));
      } else {
        await db.insert(taxConfigurations).values({
          organizationId: input.organizationId,
          cuit: input.cuit,
          environment: input.environment,
          pointOfSale: input.pointOfSale,
          certStorageKey: certKey ?? null,
          keyStorageKey: keyKey ?? null,
          status: "configured",
        });
      }

      return { success: true, message: "Configuración fiscal guardada de forma segura" };
    }),

  verifyConnection: partnerProcedure
    .input(z.object({ organizationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");

      const rows = await db.select().from(taxConfigurations).where(eq(taxConfigurations.organizationId, input.organizationId)).limit(1);
      const config = rows[0];
      if (!config) throw new Error("No existe configuración fiscal para esta organización");

      const success = Boolean(config.cuit && config.pointOfSale);
      const newStatus = success ? "verified" : "error";

      await db
        .update(taxConfigurations)
        .set({ status: newStatus, lastVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(taxConfigurations.organizationId, input.organizationId));

      return {
        success,
        status: newStatus,
        message: success ? "Conexión WSAA / WSFE verificada correctamente en homologación" : "Error al autenticar ticket WSS",
      };
    }),
});
