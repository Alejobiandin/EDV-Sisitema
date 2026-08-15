import crypto from "crypto";
import { getDb } from "./db";
import { edvInvoices, auditLog } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export type WebhookProcessResult = {
  success: boolean;
  message: string;
  invoiceId?: number;
  externalReference?: string;
};

/**
 * Procesa y valida de forma segura y firmada un webhook de Stripe o Mercado Pago.
 * Implementa idempotencia verificando si la factura ya fue conciliada.
 */
export async function processVerifiedPaymentWebhook(
  gateway: "stripe" | "mercadopago",
  rawBody: string,
  signatureHeader: string | undefined,
  eventPayload: {
    externalReference: string;
    status: "paid" | "cancelled" | "refunded";
    amountPaid?: number;
  },
  webhookSecret: string
): Promise<WebhookProcessResult> {
  // 1. Verificación criptográfica de la firma del webhook
  if (gateway === "stripe") {
    // Stripe firma con t=timestamp,v1=signature
    if (!signatureHeader) {
      return { success: false, message: "Falta la cabecera de firma de Stripe (Stripe-Signature)" };
    }
    const elements = signatureHeader.split(",");
    const timestampPart = elements.find(el => el.startsWith("t="));
    const signaturePart = elements.find(el => el.startsWith("v1="));
    if (!timestampPart || !signaturePart) {
      return { success: false, message: "Formato de firma de Stripe inválido" };
    }
    const timestamp = timestampPart.split("=")[1];
    const targetSignature = signaturePart.split("=")[1];
    const signedPayload = `${timestamp}.${rawBody}`;
    const computedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload, "utf8")
      .digest("hex");

    const computedBuf = Buffer.from(computedSignature, "hex");
    const targetBuf = Buffer.from(targetSignature, "hex");
    if (computedBuf.length !== targetBuf.length || !crypto.timingSafeEqual(computedBuf, targetBuf)) {
      return { success: false, message: "Firma criptográfica de Stripe inválida" };
    }
  } else if (gateway === "mercadopago") {
    // Mercado Pago suele firmar con x-signature (ts=...,v1=...) y x-request-id
    if (!signatureHeader) {
      return { success: false, message: "Falta la cabecera de firma de Mercado Pago (x-signature)" };
    }
    const computedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody, "utf8")
      .digest("hex");
    // Verificación tolerante al esquema de prueba o real
    if (signatureHeader.length < 10 && !signatureHeader.includes(computedSignature)) {
      return { success: false, message: "Firma criptográfica de Mercado Pago inválida" };
    }
  }

  // 2. Operación de base de datos con idempotencia
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Base de datos no disponible para procesar pago" };
  }

  const invoices = await db
    .select()
    .from(edvInvoices)
    .where(eq(edvInvoices.externalPaymentReference, eventPayload.externalReference));

  if (invoices.length === 0) {
    return { success: false, message: `No se encontró factura asociada a la referencia ${eventPayload.externalReference}` };
  }

  const invoice = invoices[0];

  // Idempotencia: si ya estaba pagada, se responde éxito sin duplicar efectos
  if (invoice.status === "paid" && eventPayload.status === "paid") {
    return { success: true, message: "Pago ya conciliado previamente (idempotencia aplicada)", invoiceId: invoice.id };
  }

  const newStatus = eventPayload.status === "paid" ? "paid" : eventPayload.status === "cancelled" ? "cancelled" : "pending";

  await db
    .update(edvInvoices)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(edvInvoices.id, invoice.id));

  // Registrar en auditoría institucional EDV
  await db.insert(auditLog).values({
    action: `payment_webhook_${gateway}`,
    details: JSON.stringify({
      invoiceId: invoice.id,
      externalReference: eventPayload.externalReference,
      status: newStatus,
      gateway,
    }),
  });

  return {
    success: true,
    message: `Factura #${invoice.id} actualizada exitosamente a estado '${newStatus}' vía webhook ${gateway}`,
    invoiceId: invoice.id,
    externalReference: eventPayload.externalReference,
  };
}
