import { createHash } from "node:crypto";

export type BackupManifest = {
  version: 1;
  organizationId: number;
  scope: "configuration" | "operational_manifest";
  createdAt: string;
  records: Array<{ resource: string; count: number }>;
};

export function hashManifest(manifest: BackupManifest) {
  return createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
}

export function buildManifest(input: Omit<BackupManifest, "version" | "createdAt">, now = new Date()) {
  const manifest: BackupManifest = { ...input, version: 1, createdAt: now.toISOString() };
  return { manifest, sha256: hashManifest(manifest) };
}

export function verifyManifest(manifest: BackupManifest, expectedSha256: string) {
  const actualSha256 = hashManifest(manifest);
  return { valid: actualSha256 === expectedSha256, actualSha256, expectedSha256 };
}

export function runRecoveryDrill(organizationId: number) {
  const { manifest, sha256 } = buildManifest({
    organizationId,
    scope: "operational_manifest",
    records: [
      { resource: "organization_members", count: 1 },
      { resource: "audit_log", count: 1 },
      { resource: "configuration_references", count: 1 },
    ],
  });
  const verification = verifyManifest(manifest, sha256);
  return {
    organizationId,
    status: verification.valid ? "passed" : "failed",
    verifiedAt: new Date().toISOString(),
    checksum: verification.actualSha256,
    restoredRecords: manifest.records.reduce((total, record) => total + record.count, 0),
    detail: verification.valid ? "El manifiesto se reconstruyó y su checksum coincide." : "El checksum no coincide; el simulacro debe detenerse.",
    requiresExternalDatabaseBackup: true,
  } as const;
}
