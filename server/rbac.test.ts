import { describe, expect, it } from "vitest";
import { canManageSensitiveOperations, getEdvRolePolicy } from "../shared/rbac";

describe("EDV RBAC role policies", () => {
  it("permite al Socio aprobar, firmar y gestionar banca", () => {
    const policy = getEdvRolePolicy("partner");
    expect(policy.canApprove).toBe(true);
    expect(policy.canSign).toBe(true);
    expect(policy.canManageBanking).toBe(true);
    expect(policy.menu).toContain("Aprobaciones");
  });

  it("mantiene al Cliente en lectura de su propia información", () => {
    const policy = getEdvRolePolicy("client");
    expect(policy.canApprove).toBe(false);
    expect(policy.canSign).toBe(false);
    expect(policy.canViewAllClients).toBe(false);
    expect(policy.menu).not.toContain("Aprobaciones");
  });

  it("protege operaciones sensibles según el rol del servidor", () => {
    expect(canManageSensitiveOperations("admin")).toBe(true);
    expect(canManageSensitiveOperations("partner")).toBe(true);
    expect(canManageSensitiveOperations("client")).toBe(false);
    expect(canManageSensitiveOperations("user")).toBe(false);
  });
});
