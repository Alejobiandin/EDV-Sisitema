export type ExternalState = "online" | "homologation" | "blocked" | "degraded" | "failed";

export function classifyExternalFailure(input: { configured: boolean; reachable: boolean; statusCode?: number }): ExternalState {
  if (!input.configured) return "blocked";
  if (input.reachable && (!input.statusCode || input.statusCode < 400)) return "online";
  if (input.statusCode === 401 || input.statusCode === 403) return "blocked";
  if (input.statusCode === 429 || (input.statusCode ?? 500) >= 500) return "degraded";
  return "failed";
}

export function buildRetryPlan(state: ExternalState, attempt: number) {
  const safeAttempt = Math.max(0, Math.floor(attempt));
  const delays = [5, 30, 120];
  const retryable = state === "degraded" || state === "failed";
  const hasRetries = safeAttempt < delays.length;
  return {
    state,
    attempt: safeAttempt,
    retryable: retryable && hasRetries,
    maxAttempts: delays.length,
    nextRetrySeconds: retryable && hasRetries ? delays[safeAttempt] : null,
    terminal: !retryable || !hasRetries,
  } as const;
}

export function describeServiceState(state: ExternalState) {
  const descriptions: Record<ExternalState, string> = {
    online: "Servicio disponible y respuesta válida.",
    homologation: "Servicio preparado para pruebas controladas.",
    blocked: "Se requieren credenciales, permisos o contrato externo.",
    degraded: "El servicio respondió con falla transitoria; se puede reintentar.",
    failed: "La solicitud falló; revisar configuración y reintentar según política.",
  };
  return descriptions[state];
}
