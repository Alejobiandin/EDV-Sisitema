export type ReportExportFeedback = {
  setMessage: (message: string) => void;
  invalidateNotifications: () => Promise<unknown> | unknown;
};

export async function handleManagerialReportExportSuccess({ setMessage, invalidateNotifications }: ReportExportFeedback) {
  setMessage("Reporte exportado. El socio recibió una notificación en el centro de mando.");
  await invalidateNotifications();
}
