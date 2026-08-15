import { beforeEach, describe, expect, it, vi } from "vitest";

let fakeOrgs = [
  { id: 1, name: "Empresa Alpha SRL", taxId: "30-11111111-9", status: "active", createdAt: new Date() },
  { id: 2, name: "Empresa Beta SA", taxId: "30-22222222-9", status: "active", createdAt: new Date() },
];

let fakeMembers = [
  { id: 1, organizationId: 1, userId: 2, roleInOrg: "partner" },
];

const fakeDb = {
  select: () => ({
    from: (table: unknown) => {
      // @ts-expect-error table inspection
      const tableName = table.config?.name ?? "";
      const data = tableName === "organization_members" ? fakeMembers : fakeOrgs;
      return {
        orderBy: () => Promise.resolve(data),
        where: () => Promise.resolve(data),
        then: (resolve: (v: unknown[]) => unknown) => Promise.resolve(data).then(resolve),
      };
    },
  }),
  insert: () => ({
    values: async (vals: unknown) => {
      const isOrg = (vals as { name?: string })?.name !== undefined;
      if (isOrg) {
        const newOrg = { id: 3, ...(vals as Record<string, unknown>), status: "active", createdAt: new Date() };
        fakeOrgs.push(newOrg as never);
        return [{ insertId: 3 }];
      }
      return [{ insertId: 10 }];
    },
  }),
};

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getDb: vi.fn(async () => fakeDb) };
});

import { organizationsRouter } from "./routers/organizations";

describe("EDV Multi-organization router", () => {
  beforeEach(() => {
    fakeOrgs = [
      { id: 1, name: "Empresa Alpha SRL", taxId: "30-11111111-9", status: "active", createdAt: new Date() },
      { id: 2, name: "Empresa Beta SA", taxId: "30-22222222-9", status: "active", createdAt: new Date() },
    ];
    fakeMembers = [{ id: 1, organizationId: 1, userId: 2, roleInOrg: "partner" }];
  });

  it("permite a un socio ver todas las organizaciones", async () => {
    const caller = organizationsRouter.createCaller({
      req: {} as never,
      res: {} as never,
      user: { id: 1, role: "partner", openId: "partner-1" } as never,
    });
    const result = await caller.list();
    expect(result).toHaveLength(2);
  });

  it("permite a un socio crear una nueva organización", async () => {
    const caller = organizationsRouter.createCaller({
      req: {} as never,
      res: {} as never,
      user: { id: 1, role: "partner", openId: "partner-1" } as never,
    });
    const res = await caller.create({ name: "Empresa Gamma SA", taxId: "30-33333333-9" });
    expect(res.success).toBe(true);
    expect(res.organizationId).toBe(3);
    const list = await caller.list();
    expect(list).toHaveLength(3);
  });
});
