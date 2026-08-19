import { describe, expect, it, vi } from "vitest";

const { authenticateRequest } = vi.hoisted(() => ({ authenticateRequest: vi.fn() }));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest } }));

import { productionHealthHandler } from "./scheduled/productionHealth";

describe("productionHealthHandler", () => {
  it("rechaza una solicitud que no proviene de Heartbeat", async () => {
    authenticateRequest.mockResolvedValueOnce({ isCron: false });
    const json = vi.fn();
    const res = { status: vi.fn().mockReturnThis(), json } as never;
    await productionHealthHandler({ originalUrl: "/api/scheduled/productionHealth" } as never, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: "cron-only" }));
  });

  it("responde un snapshot idempotente sin afirmar credenciales productivas", async () => {
    authenticateRequest.mockResolvedValueOnce({ isCron: true, taskUid: "cron-health-1" });
    const json = vi.fn();
    const res = { json } as never;
    await productionHealthHandler({ originalUrl: "/api/scheduled/productionHealth" } as never, res);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, taskUid: "cron-health-1" }));
    expect(json.mock.calls[0][0].services).toEqual(expect.arrayContaining([{ id: "afip-production", status: "requires_credentials" }]));
  });
});
