import { describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { processVerifiedPaymentWebhook } from "./webhookService";

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock("./db", () => ({ getDb: getDbMock }));

function makeChain(rows: unknown[]) {
  const promise = Promise.resolve(rows);
  const chain: any = {
    where: () => chain,
    set: () => chain,
    values: () => chain,
    then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => promise.then(resolve, reject),
    catch: (reject: (reason: unknown) => unknown) => promise.catch(reject),
  };
  return chain;
}

describe("Webhook Service Security & Idempotency", () => {
  it("rechaza peticiones con firma inválida de Stripe", async () => {
    const secret = "whsec_test123";
    const body = JSON.stringify({ event: "charge.succeeded" });
    const result = await processVerifiedPaymentWebhook(
      "stripe",
      body,
      "t=123456,v1=badsignature",
      { externalReference: "INV-001", status: "paid" },
      secret
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("Firma criptográfica de Stripe inválida");
  });

  it("procesa exitosamente un webhook firmado correctamente por Stripe y aplica idempotencia", async () => {
    const secret = "whsec_test123";
    const body = JSON.stringify({ event: "charge.succeeded" });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${body}`;
    const signature = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
    const signatureHeader = `t=${timestamp},v1=${signature}`;

    const mockInvoice = { id: 10, clientId: 1, amount: "50000", status: "pending", externalPaymentReference: "INV-001" };
    const rows = new Map<any, unknown[]>([
      [{}, [mockInvoice]],
    ]);

    getDbMock.mockResolvedValue({
      select: () => ({ from: () => ({ where: () => Promise.resolve([mockInvoice]) }) }),
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
      insert: () => ({ values: () => Promise.resolve() }),
    });

    const result = await processVerifiedPaymentWebhook(
      "stripe",
      body,
      signatureHeader,
      { externalReference: "INV-001", status: "paid" },
      secret
    );

    expect(result.success).toBe(true);
    expect(result.invoiceId).toBe(10);
  });
});
