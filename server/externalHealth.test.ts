import { describe, expect, it } from "vitest";
import { buildRetryPlan, classifyExternalFailure, describeServiceState } from "./externalHealth";

describe("external connector health", () => {
  it("clasifica credenciales ausentes como bloqueo y no programa reintentos", () => {
    const state = classifyExternalFailure({ configured: false, reachable: false });
    expect(state).toBe("blocked");
    expect(buildRetryPlan(state, 0).retryable).toBe(false);
    expect(describeServiceState(state)).toContain("credenciales");
  });

  it("aplica backoff progresivo a fallas transitorias", () => {
    expect(buildRetryPlan("degraded", 0).nextRetrySeconds).toBe(5);
    expect(buildRetryPlan("degraded", 1).nextRetrySeconds).toBe(30);
    expect(buildRetryPlan("degraded", 2).nextRetrySeconds).toBe(120);
    expect(buildRetryPlan("degraded", 3).terminal).toBe(true);
  });

  it("clasifica autenticación como bloqueo y servidor como degradación", () => {
    expect(classifyExternalFailure({ configured: true, reachable: false, statusCode: 401 })).toBe("blocked");
    expect(classifyExternalFailure({ configured: true, reachable: false, statusCode: 503 })).toBe("degraded");
  });
});
