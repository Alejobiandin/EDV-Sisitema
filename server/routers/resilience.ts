import { z } from "zod";
import { partnerProcedure, router } from "../_core/trpc";
import { assertOrganizationAccess } from "../organizationAccess";
import { buildManifest, runRecoveryDrill, verifyManifest } from "../backupRecovery";

export const resilienceRouter = router({
  getPolicy: partnerProcedure.query(() => ({
    retentionDays: 30,
    targetRpoMinutes: 60,
    targetRtoMinutes: 120,
    backupKinds: ["configuration_manifest", "operational_audit", "managed_database_backup"],
    status: "managed_database_backup_requires_hosting_policy",
    note: "EDV verifica manifiestos y referencias; el backup físico de la base depende del proveedor de hosting y su política habilitada.",
  })),
  runRecoveryDrill: partnerProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "read");
      return runRecoveryDrill(input.organizationId);
    }),
  verifyManifest: partnerProcedure
    .input(z.object({
      organizationId: z.number().int().positive(),
      manifest: z.object({
        version: z.literal(1),
        organizationId: z.number().int().positive(),
        scope: z.enum(["configuration", "operational_manifest"]),
        createdAt: z.string(),
        records: z.array(z.object({ resource: z.string(), count: z.number().int().nonnegative() })),
      }),
      expectedSha256: z.string().length(64),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "read");
      if (input.manifest.organizationId !== input.organizationId) return { valid: false, reason: "manifest_organization_mismatch" as const };
      return verifyManifest(input.manifest, input.expectedSha256);
    }),
  createManifest: partnerProcedure
    .input(z.object({ organizationId: z.number().int().positive(), resources: z.array(z.object({ resource: z.string().min(1), count: z.number().int().nonnegative() })).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "read");
      return buildManifest({ organizationId: input.organizationId, scope: "operational_manifest", records: input.resources });
    }),
});
