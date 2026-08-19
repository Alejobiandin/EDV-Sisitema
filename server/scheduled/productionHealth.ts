import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";

export async function productionHealthHandler(req: Request, res: Response) {
  const timestamp = new Date().toISOString();
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only", timestamp });
    }

    // Este callback es intencionalmente idempotente. Hasta que el usuario cargue
    // certificados y tokens, solo informa el estado de preparación y no afirma
    // que exista una conexión productiva real.
    return res.json({
      ok: true,
      taskUid: user.taskUid,
      timestamp,
      services: [
        { id: "internal-engine", status: "online" },
        { id: "afip-production", status: "requires_credentials" },
        { id: "banking-production", status: "requires_authorization" },
        { id: "signature-provider", status: "requires_provider" },
      ],
    });
  } catch (error) {
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl, timestamp },
      timestamp,
    });
  }
}
