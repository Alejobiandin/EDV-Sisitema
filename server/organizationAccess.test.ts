import { describe, expect, it, vi } from "vitest";

const { getDb, makeMembershipRows } = vi.hoisted(() => ({
  getDb: vi.fn(),
  makeMembershipRows: vi.fn(() => [] as Array<{ roleInOrg: string }>),
}));
vi.mock("./db", () => ({ getDb }));

import { assertOrganizationAccess } from "./organizationAccess";

function fakeDb() {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => makeMembershipRows(),
        }),
      }),
    }),
  };
}

describe("organization access guard", () => {
  it("rechaza a un usuario sin membresía", async () => {
    getDb.mockResolvedValue(fakeDb());
    makeMembershipRows.mockReturnValueOnce([]);
    await expect(assertOrganizationAccess({ user: { id: 10, role: "client" } } as never, 7, "read")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite escribir a un accountant de su propia organización", async () => {
    getDb.mockResolvedValue(fakeDb());
    makeMembershipRows.mockReturnValueOnce([{ roleInOrg: "accountant" }]);
    await expect(assertOrganizationAccess({ user: { id: 10, role: "client" } } as never, 7, "write")).resolves.toMatchObject({ organizationId: 7, roleInOrg: "accountant" });
  });

  it("impide que un client_viewer modifique datos", async () => {
    getDb.mockResolvedValue(fakeDb());
    makeMembershipRows.mockReturnValueOnce([{ roleInOrg: "client_viewer" }]);
    await expect(assertOrganizationAccess({ user: { id: 10, role: "client" } } as never, 7, "write")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
