import { describe, expect, it } from "vitest";
import { buildManifest, runRecoveryDrill, verifyManifest } from "./backupRecovery";

describe("EDV backup and recovery", () => {
  it("crea y verifica un manifiesto con checksum SHA-256", () => {
    const snapshot = buildManifest({ organizationId: 1, scope: "operational_manifest", records: [{ resource: "audit_log", count: 4 }] }, new Date("2026-08-19T00:00:00.000Z"));
    expect(snapshot.sha256).toHaveLength(64);
    expect(verifyManifest(snapshot.manifest, snapshot.sha256).valid).toBe(true);
    expect(verifyManifest({ ...snapshot.manifest, records: [{ resource: "audit_log", count: 5 }] }, snapshot.sha256).valid).toBe(false);
  });

  it("ejecuta un simulacro reproducible y declara el backup físico como requisito externo", () => {
    const drill = runRecoveryDrill(1);
    expect(drill.status).toBe("passed");
    expect(drill.restoredRecords).toBe(3);
    expect(drill.requiresExternalDatabaseBackup).toBe(true);
  });
});
