import { describe, expect, it } from "vitest";
import { feedTransaction } from "./routers/banking";

describe("Banking feed contract", () => {
  it("acepta payloads bancarios arbitrarios mediante z.record tipado", () => {
    const parsed = feedTransaction.parse({
      externalId: "bank-001",
      bookedAt: "2026-08-14T12:00:00.000Z",
      description: "Cobranza factura EDV",
      amount: 125000.5,
      direction: "credit",
      rawPayload: { provider: "manual_csv", category: "collection", nested: { source: "bank" } },
    });

    expect(parsed.externalId).toBe("bank-001");
    expect(parsed.bookedAt).toBeInstanceOf(Date);
    expect(parsed.rawPayload?.provider).toBe("manual_csv");
  });

  it("rechaza importes no finitos y direcciones desconocidas", () => {
    expect(() => feedTransaction.parse({
      externalId: "bank-002",
      bookedAt: new Date(),
      amount: Number.NaN,
      direction: "credit",
    })).toThrow();

    expect(() => feedTransaction.parse({
      externalId: "bank-003",
      bookedAt: new Date(),
      amount: 10,
      direction: "transfer",
    })).toThrow();
  });
});
