import DashboardLayout from "@/components/DashboardLayout";
import PartnerOnly from "@/components/PartnerOnly";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, FileKey, Mail, RefreshCw, ShieldCheck, Stamp, TrendingUp, History } from "lucide-react";
import { useEffect, useState } from "react";

export default function TaxConfig() {
  const [selectedOrgId, setSelectedOrgId] = useState<number>(1);
  const [cuit, setCuit] = useState("30-71234567-9");
  const [environment, setEnvironment] = useState<"homologation" | "production">("homologation");
  const [pointOfSale, setPointOfSale] = useState(1);
  const [autoEmit, setAutoEmit] = useState(false);
  const [certContent, setCertContent] = useState("");
  const [keyContent, setKeyContent] = useState("");
  const [clientEmail, setClientEmail] = useState("cliente@empresa.com");
  const [message, setMessage] = useState<string | null>(null);

  const orgs = trpc.organizations.list.useQuery();
  const taxConfig = trpc.taxConfigs.get.useQuery({ organizationId: selectedOrgId });
  const syncLogs = trpc.taxConfigs.getSyncLogs.useQuery({ organizationId: selectedOrgId });
  const report = trpc.taxConfigs.getManagerialReport.useQuery({ organizationId: selectedOrgId });
  const utils = trpc.useUtils();

  useEffect(() => {
    if (taxConfig.data) {
      setCuit(taxConfig.data.cuit);
      setEnvironment(taxConfig.data.environment as "homologation" | "production");
      setPointOfSale(taxConfig.data.pointOfSale);
      setAutoEmit(taxConfig.data.autoEmitOnApproval === 1);
    }
  }, [taxConfig.data]);

  const saveMutation = trpc.taxConfigs.save.useMutation({
    onSuccess: () => {
      setMessage("Configuración fiscal y emisión automática guardadas correctamente.");
      void utils.taxConfigs.get.invalidate({ organizationId: selectedOrgId });
    },
    onError: err => setMessage(`Error: ${err.message}`),
  });

  const syncPosMutation = trpc.taxConfigs.syncPointsOfSale.useMutation({
    onSuccess: res => {
      setMessage(res.message);
      void utils.taxConfigs.get.invalidate({ organizationId: selectedOrgId });
      void utils.taxConfigs.getSyncLogs.invalidate({ organizationId: selectedOrgId });
    },
    onError: err => {
      setMessage(`Error sincronizando puntos de venta: ${err.message}`);
      void utils.taxConfigs.getSyncLogs.invalidate({ organizationId: selectedOrgId });
    },
  });

  const verifyMutation = trpc.taxConfigs.verifyConnection.useMutation({
    onSuccess: res => {
      setMessage(res.message);
      void utils.taxConfigs.get.invalidate({ organizationId: selectedOrgId });
    },
    onError: err => setMessage(`Error de conexión: ${err.message}`),
  });

  const emailMutation = trpc.taxConfigs.sendInvoiceEmail.useMutation({
    onSuccess: res => setMessage(res.message),
    onError: err => setMessage(`Error enviando correo: ${err.message}`),
  });

  const isCertValid = !certContent || (certContent.includes("-----BEGIN CERTIFICATE-----") && certContent.includes("-----END CERTIFICATE-----"));
  const isKeyValid = !keyContent || (keyContent.includes("-----BEGIN") && keyContent.includes("KEY-----"));

  const handleSave = () => {
    if (!isCertValid || !isKeyValid) {
      setMessage("Error: El formato del certificado o clave privada es inválido.");
      return;
    }
    saveMutation.mutate({
      organizationId: selectedOrgId,
      cuit,
      environment,
      pointOfSale,
      autoEmitOnApproval: autoEmit,
      ...(certContent ? { certContent } : {}),
      ...(keyContent ? { keyContent } : {}),
    });
  };

  let syncedPoints: Array<{ nro: number; emisionTipo: string; bloqueado: string }> = [];
  try {
    if (taxConfig.data?.syncedPointsOfSale) {
      syncedPoints = JSON.parse(taxConfig.data.syncedPointsOfSale);
    }
  } catch {
    syncedPoints = [];
  }

  return (
    <DashboardLayout>
      <PartnerOnly>
        <main className="min-h-screen bg-background px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-8">
            <header className="flex flex-col gap-5 border-b border-border/60 pb-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Órgano impositivo · Reportes gerenciales y WSFEv1
                </div>
                <h1 className="text-4xl font-semibold tracking-tight">Centro Fiscal y Ventas con IVA Discriminado</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Administración de certificados X.509, sincronización AFIP, reportes de ventas por punto de venta y envío automático de comprobantes con CAE.
                </p>
              </div>
              <Badge variant="outline" className="gap-2 border-emerald-200 bg-emerald-50 text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Auditoría y sincronización activa
              </Badge>
            </header>

            {message && <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm text-primary">{message}</div>}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stamp className="h-5 w-5 text-primary" /> Parámetros fiscales y emisión automática
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Empresa / Organización</Label>
                      <Select value={String(selectedOrgId)} onValueChange={v => setSelectedOrgId(Number(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {(orgs.data ?? []).map(org => (
                            <SelectItem key={org.id} value={String(org.id)}>
                              {org.name} ({org.taxId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>CUIT</Label>
                        <Input value={cuit} onChange={e => setCuit(e.target.value)} placeholder="30-71234567-9" />
                      </div>
                      <div className="space-y-2">
                        <Label>Ambiente</Label>
                        <Select value={environment} onValueChange={v => setEnvironment(v as "homologation" | "production")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="homologation">Homologación (Testing)</SelectItem>
                            <SelectItem value="production">Producción</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Punto de Venta predeterminado</Label>
                        <Input type="number" value={pointOfSale} onChange={e => setPointOfSale(Number(e.target.value))} placeholder="1" />
                      </div>
                      <div className="flex flex-col justify-end pb-1">
                        <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Emisión automática</Label>
                            <p className="text-xs text-muted-foreground">Emitir CAE al aprobar liquidación</p>
                          </div>
                          <Switch checked={autoEmit} onCheckedChange={setAutoEmit} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileKey className="h-4 w-4 text-primary" /> Certificado X.509 (.crt)
                        </span>
                        {!isCertValid && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" /> Formato certificado inválido
                          </span>
                        )}
                      </Label>
                      <textarea
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        rows={3}
                        value={certContent}
                        onChange={e => setCertContent(e.target.value)}
                        placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileKey className="h-4 w-4 text-primary" /> Clave Privada RSA (.key)
                        </span>
                        {!isKeyValid && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" /> Formato RSA inválido
                          </span>
                        )}
                      </Label>
                      <textarea
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        rows={3}
                        value={keyContent}
                        onChange={e => setKeyContent(e.target.value)}
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                      />
                    </div>

                    <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending || !isCertValid || !isKeyValid}>
                      Guardar configuración fiscal
                    </Button>
                  </CardContent>
                </Card>

                {/* Reporte gerencial de ventas e IVA por punto de venta */}
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" /> Ventas e IVA Discriminado por Punto de Venta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pto Venta</TableHead>
                          <TableHead className="text-right">Comprobantes</TableHead>
                          <TableHead className="text-right">Neto Gravado</TableHead>
                          <TableHead className="text-right">IVA (21%)</TableHead>
                          <TableHead className="text-right">Total Bruto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(report.data?.byPos ?? []).map(row => (
                          <TableRow key={row.pointOfSale}>
                            <TableCell className="font-medium">PV #{row.pointOfSale}</TableCell>
                            <TableCell className="text-right">{row.count}</TableCell>
                            <TableCell className="text-right">${row.net.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right">${row.vat.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-right font-semibold">${row.gross.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm font-semibold">
                      <span>Total General</span>
                      <div className="flex gap-6 text-right">
                        <span>Neto: ${report.data?.totalNet.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</span>
                        <span>IVA: ${report.data?.totalVat.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</span>
                        <span className="text-primary">Total: ${report.data?.totalGross.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Puntos de Venta WSFEv1</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncPosMutation.mutate({ organizationId: selectedOrgId })}
                        disabled={syncPosMutation.isPending}
                      >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncPosMutation.isPending ? "animate-spin" : ""}`} /> Sincronizar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {syncedPoints.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin puntos sincronizados. Hacé clic en Sincronizar para consultar WSFEv1.</p>
                    ) : (
                      <div className="space-y-2">
                        {syncedPoints.map(p => (
                          <div key={p.nro} className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                            <span className="font-medium">PV #{p.nro} ({p.emisionTipo})</span>
                            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
                              Activo
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Envío automático por correo */}
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" /> Envío automático de facturas con CAE
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Correo del Cliente</Label>
                      <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="cliente@empresa.com" />
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => emailMutation.mutate({ invoiceId: 1, clientEmail })}
                      disabled={emailMutation.isPending}
                    >
                      <Mail className="mr-2 h-4 w-4" /> Enviar factura con CAE de prueba
                    </Button>
                  </CardContent>
                </Card>

                {/* Historial de sincronización AFIP */}
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" /> Historial de Sincronización AFIP
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-72 overflow-y-auto">
                    {(syncLogs.data ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No hay registros de sincronización recientes.</p>
                    ) : (
                      <div className="space-y-2">
                        {(syncLogs.data ?? []).map(log => (
                          <div key={log.id} className="rounded-lg border bg-muted/10 p-3 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{log.syncType}</span>
                              <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                            </div>
                            <p className="text-muted-foreground">{log.details ?? log.errorMessage ?? "Sin detalles"}</p>
                            <span className="text-[10px] text-muted-foreground/70">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Estado de conexión</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">Estado</span>
                        <Badge variant={taxConfig.data?.status === "verified" ? "default" : "secondary"}>
                          {taxConfig.data?.status ?? "Sin configurar"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">CUIT: {taxConfig.data?.cuit ?? cuit}</p>
                      <p className="text-xs text-muted-foreground">Ambiente: {taxConfig.data?.environment ?? environment}</p>
                      <p className="text-xs text-muted-foreground">Emisión automática: {taxConfig.data?.autoEmitOnApproval === 1 ? "Activada" : "Desactivada"}</p>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => verifyMutation.mutate({ organizationId: selectedOrgId })}
                      disabled={verifyMutation.isPending}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Probar conexión WSAA / WSFE
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </PartnerOnly>
    </DashboardLayout>
  );
}
