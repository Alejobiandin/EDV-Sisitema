import { describe, expect, it, vi } from "vitest";
import { handleManagerialReportExportSuccess } from "../client/src/lib/reportExportFeedback";

describe("feedback de exportación gerencial", () => {
  it("muestra el aviso al socio e invalida las notificaciones inmediatamente", async () => {
    const setMessage = vi.fn();
    const invalidateNotifications = vi.fn(async () => undefined);

    await handleManagerialReportExportSuccess({ setMessage, invalidateNotifications });

    expect(setMessage).toHaveBeenCalledWith("Reporte exportado. El socio recibió una notificación en el centro de mando.");
    expect(invalidateNotifications).toHaveBeenCalledTimes(1);
  });
});
