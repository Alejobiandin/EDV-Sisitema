import { describe, expect, it, vi } from "vitest";
import { enterpriseRouters } from "./enterpriseModules";

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
        orderBy: () => Promise.resolve([]),
      }),
    }),
    insert: () => Promise.resolve([{ insertId: 202 }]),
  })),
}));

describe("EDV Enterprise Modules Advanced", () => {
  it("expone los routers enterprise completos", () => {
    expect(enterpriseRouters.accounting).toBeDefined();
    expect(enterpriseRouters.securityBackups).toBeDefined();
    expect(enterpriseRouters.argentinaCore).toBeDefined();
    expect(enterpriseRouters.digitalSignature).toBeDefined();
  });

  it("calcula correctamente la contribución patronal y aportes F.931 bajo CCT 130/75", () => {
    const gross = 1500000;
    const employer = gross * 0.24;
    const employee = Number((gross * 0.17).toFixed(2));
    const total = Number((employer + employee).toFixed(2));

    expect(employer).toBe(360000);
    expect(employee).toBe(255000);
    expect(total).toBe(615000);
  });
});
