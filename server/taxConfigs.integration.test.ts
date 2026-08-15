import { beforeEach, describe, expect, it, vi } from "vitest";

let fakeConfigs: unknown[] = [];

const fakeDb = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => fakeConfigs,
      }),
    }),
  }),
  insert: () => ({
    values: async (vals: unknown) => {
      fakeConfigs.push({ id: 1, ...(vals as Record<string, unknown>) });
      return [{ insertId: 1 }];
    },
  }),
  update: () => ({
    set: (vals: unknown) => ({
      where: async () => {
        if (fakeConfigs[0]) {
          Object.assign(fakeConfigs[0] as object, vals);
        }
        return [{ affectedRows: 1 }];
      },
    }),
  }),
};

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getDb: vi.fn(async () => fakeDb) };
});

vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({ key, url: `/manus-storage/${key}` })),
}));

import { taxConfigsRouter } from "./routers/taxConfigs";

const context = { req: {} as never, res: {} as never, user: { id: 1, role: "partner", openId: "partner-tax" } as never };

describe("EDV Tax Configurations Router", () => {
  beforeEach(() => {
    fakeConfigs = [];
  });

  it("permite guardar y verificar la configuración fiscal y de homologación", async () => {
    const caller = taxConfigsRouter.createCaller(context);
    const saveRes = await caller.save({
      organizationId: 1,
      cuit: "30-71234567-9",
      environment: "homologation",
      pointOfSale: 1,
      autoEmitOnApproval: true,
      certContent: "-----BEGIN CERTIFICATE-----\nFAKE\n-----END CERTIFICATE-----",
      keyContent: "-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----",
    });
    expect(saveRes.success).toBe(true);

    const config = await caller.get({ organizationId: 1 });
    expect(config).toMatchObject({ cuit: "30-71234567-9", environment: "homologation", pointOfSale: 1, autoEmitOnApproval: 1 });

    const syncRes = await caller.syncPointsOfSale({ organizationId: 1 });
    expect(syncRes.success).toBe(true);
    expect(syncRes.points).toHaveLength(3);

    const verifyRes = await caller.verifyConnection({ organizationId: 1 });
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.status).toBe("verified");
  });
});
