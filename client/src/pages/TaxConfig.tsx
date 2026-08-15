import DashboardLayout from "@/components/DashboardLayout";
import PartnerOnly from "@/components/PartnerOnly";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Building2, CheckCircle2, FileKey, ShieldCheck, Stamp } from "lucide-react";
import { useState } from "react";

export default function TaxConfig() {
  const [selectedOrgId, setSelectedOrgId] = useState<number>(1);
  const [cuit, setCuit] = useState("30-71234567-9");
  const [environment, setEnvironment] = useState<"homologation" | "production">("homologation");
  const [pointOfSale, setPointOfSale] = useState(1);
  const [certContent, setCertContent] = useState("");
  const [keyContent, setKeyContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const orgs = trpc.organizations.list.useQuery();
  const taxConfig = trpc.taxConfigs.get.useQuery({ organizationId: selectedOrgId });
  const utils = trpc.useUtils();

  const saveMutation = trpc.taxConfigs.save.useMutation({
    onSuccess: () => {
      setMessage("Configuración guardada y cifrada correctamente.");
      void utils.taxConfigs.get.invalidate({ organizationId: selectedOrgId });
    },
    onError: err => setMessage(`Error: ${err.message}`),
  });

  const verifyMutation = trpc.taxConfigs.verifyConnection.useMutation({
    onSuccess: res => {
      setMessage(res.message);
      void utils.taxConfigs.get.invalidate({ organizationId: selectedOrgId });
    },
    onError: err => setMessage(`Error de conexión: ${err.message}`),
  });

  const handleSave = () => {
    saveMutation.mutate({
      organizationId: selectedOrgId,
      cuit,
      environment,
      pointOfSale,
      ...(certContent ? { certContent } : {}),
      ...(keyContent ? { keyContent } : {}),
    });
  };

  return (
    <DashboardLayout>
      <PartnerOnly>
        <main className="min-h-screen bg-background px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-5xl space-y-8">
            <header className="flex flex-col gap-5 border-b border-border/60 pb-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Órgano impositivo · Homologación ARCA
                </div>
                <h1 className="text-4xl font-semibold tracking-tight">Certificados y Conexión AFIP/ARCA</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Configurá el certificado digital X.509 y la clave privada para autenticación WSAA y emisión de comprobantes electrónicos (WSFEv1).
                </p>
              </div>
              <Badge variant="outline" className="gap-2 border-emerald-200 bg-emerald-50 text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Cifrado seguro S3
              </Badge>
            </header>

            {message && <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm text-primary">{message}</div>}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stamp className="h-5 w-5 text-primary" /> Parámetros fiscales
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
                      <Label>CUIT (sin guiones o con formato)</Label>
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

                  <div className="space-y-2">
                    <Label>Punto de Venta</Label>
                    <Input type="number" value={pointOfSale} onChange={e => setPointOfSale(Number(e.target.value))} placeholder="1" />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileKey className="h-4 w-4 text-primary" /> Contenido del Certificado X.509 (.crt)
                    </Label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      rows={4}
                      value={certContent}
                      onChange={e => setCertContent(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileKey className="h-4 w-4 text-primary" /> Clave Privada RSA (.key)
                    </Label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      rows={4}
                      value={keyContent}
                      onChange={e => setKeyContent(e.target.value)}
                      placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    />
                  </div>

                  <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
                    Guardar configuración fiscal
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Estado de conexión</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">Estado actual</span>
                        <Badge variant={taxConfig.data?.status === "verified" ? "default" : "secondary"}>
                          {taxConfig.data?.status ?? "Sin configurar"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">CUIT: {taxConfig.data?.cuit ?? cuit}</p>
                      <p className="text-xs text-muted-foreground">Ambiente: {taxConfig.data?.environment ?? environment}</p>
                      <p className="text-xs text-muted-foreground">Punto de venta: {taxConfig.data?.pointOfSale ?? pointOfSale}</p>
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

                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="p-5 flex items-start gap-3">
                    <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Seguridad y Privacidad</p>
                      <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                        Los certificados y claves privadas se resguardan de forma segura en almacenamiento cifrado y solo se utilizan al invocar los WebServices oficiales.
                      </p>
                    </div>
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
