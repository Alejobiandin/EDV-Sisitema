import DashboardLayout from "@/components/DashboardLayout";
import PartnerOnly from "@/components/PartnerOnly";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Activity, ArrowRight, CheckCircle2, CircleAlert, ClipboardCheck, ExternalLink, Fingerprint, Gauge, LockKeyhole, RefreshCw, ShieldCheck, UserRoundCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

function statusBadge(status: string) {
  if (status === "ready" || status === "online" || status === "passed") return <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Listo</Badge>;
  if (status === "requires_user" || status === "blocked") return <Badge className="gap-1 border-amber-200 bg-amber-50 text-amber-800"><UserRoundCheck className="h-3 w-3" /> Requiere usuario</Badge>;
  if (status === "homologation") return <Badge className="gap-1 border-blue-200 bg-blue-50 text-blue-700"><Activity className="h-3 w-3" /> Homologación</Badge>;
  return <Badge variant="outline">Pendiente</Badge>;
}

export default function ProductionReadiness() {
  const [organizationId] = useState(1);
  const [baseSalary, setBaseSalary] = useState("1600000");
  const [employerRate, setEmployerRate] = useState("0.24");
  const [employeeRate, setEmployeeRate] = useState("0.17");
  const [bonusPercent, setBonusPercent] = useState("0.10");
  const [showChecks, setShowChecks] = useState(false);
  const checklistQuery = trpc.productionReadiness.getChecklist.useQuery();
  const healthQuery = trpc.productionReadiness.getExternalHealth.useQuery(undefined, { refetchInterval: 30_000 });
  const checksMutation = trpc.productionReadiness.runInternalChecks.useMutation({ onSuccess: () => { setShowChecks(true); toast.success("Controles internos ejecutados"); }, onError: error => toast.error(error.message) });
  const simulateMutation = trpc.productionReadiness.simulateCct.useMutation({ onError: error => toast.error(error.message) });
  const checklist = checklistQuery.data?.steps ?? [];
  const health = healthQuery.data?.services ?? [];
  const readyCount = checklist.filter(step => step.status === "ready").length;
  const internalProgress = checklist.length ? Math.round((readyCount / checklist.length) * 100) : 0;
  const simulation = simulateMutation.data;
  const checks = checksMutation.data?.checks ?? [];

  const simulate = () => {
    simulateMutation.mutate({
      baseSalary: Number(baseSalary) || 0,
      employerRate: Number(employerRate) || 0,
      employeeRate: Number(employeeRate) || 0,
      concepts: [{ name: "Adicional configurable CCT", percent: Number(bonusPercent) || 0, fixed: 0, kind: "earning" }],
    });
  };

  const healthSummary = useMemo(() => ({
    online: health.filter(item => item.status === "online").length,
    homologation: health.filter(item => item.status === "homologation").length,
    blocked: health.filter(item => item.status === "blocked").length,
  }), [health]);

  return (
    <DashboardLayout>
      <PartnerOnly>
        <main className="min-h-screen bg-background px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-7xl space-y-8">
            <header className="flex flex-col gap-5 border-b border-border/60 pb-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Órgano de continuidad operativa · EDV</div>
                <h1 className="text-4xl font-semibold tracking-tight">Preparación para producción</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Una consola única para distinguir lo que EDV ya automatiza de lo que necesita certificados, permisos, contratos o aprobación profesional del usuario.</p>
              </div>
              <Button className="gap-2" onClick={() => checksMutation.mutate({ organizationId })} disabled={checksMutation.isPending}><ClipboardCheck className="h-4 w-4" /> {checksMutation.isPending ? "Verificando..." : "Ejecutar controles internos"}</Button>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cobertura interna</p><Gauge className="h-5 w-5 text-primary" /></div><p className="mt-3 text-3xl font-semibold">{internalProgress}%</p><Progress value={internalProgress} className="mt-3" /><p className="mt-2 text-xs text-muted-foreground">Automatización lista dentro de EDV</p></CardContent></Card>
              <Card><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Servicios internos</p><Activity className="h-5 w-5 text-emerald-600" /></div><p className="mt-3 text-3xl font-semibold text-emerald-700">{healthSummary.online}</p><p className="mt-2 text-xs text-muted-foreground">Motores disponibles sin permisos externos</p></CardContent></Card>
              <Card><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Homologación</p><RefreshCw className="h-5 w-5 text-blue-600" /></div><p className="mt-3 text-3xl font-semibold text-blue-700">{healthSummary.homologation}</p><p className="mt-2 text-xs text-muted-foreground">Servicios preparados para pruebas controladas</p></CardContent></Card>
              <Card><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Acción del usuario</p><UserRoundCheck className="h-5 w-5 text-amber-600" /></div><p className="mt-3 text-3xl font-semibold text-amber-700">{healthSummary.blocked}</p><p className="mt-2 text-xs text-muted-foreground">Bloqueos legítimos por credenciales o contratos</p></CardContent></Card>
            </section>

            <Tabs defaultValue="checklist" className="space-y-5">
              <TabsList className="grid w-full grid-cols-3 lg:w-fit"><TabsTrigger value="checklist">Ruta productiva</TabsTrigger><TabsTrigger value="health">Salud externa</TabsTrigger><TabsTrigger value="cct">Simulador CCT</TabsTrigger></TabsList>
              <TabsContent value="checklist" className="space-y-5">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Checklist de responsabilidades</CardTitle></CardHeader><CardContent className="space-y-3">
                  {checklist.map(step => <div key={step.id} className="flex flex-col gap-4 rounded-xl border border-border/70 p-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 gap-3"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.status === "ready" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{step.status === "ready" ? <CheckCircle2 className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}</div><div><p className="font-semibold">{step.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p><p className="mt-2 text-xs font-medium text-muted-foreground">Responsable: <span className="text-foreground">{step.owner}</span> · {step.action}</p></div></div><div className="flex shrink-0 items-center gap-3">{statusBadge(step.status)}<ArrowRight className="h-4 w-4 text-muted-foreground" /></div></div>)}
                </CardContent></Card>
                {showChecks && <Card className="border-emerald-200 bg-emerald-50/30"><CardHeader><CardTitle className="text-base">Resultado de controles internos</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{checks.map(check => <div key={check.id} className="rounded-xl border border-white bg-white/80 p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{check.label}</span>{statusBadge(check.status)}</div><p className="mt-1 text-xs text-muted-foreground">{check.detail}</p></div>)}</CardContent></Card>}
              </TabsContent>
              <TabsContent value="health" className="space-y-5">
                <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Monitor de servicios</CardTitle><p className="mt-1 text-sm text-muted-foreground">El estado “requiere usuario” es deliberado: EDV no inventa certificados ni tokens.</p></div><Button variant="outline" size="sm" className="gap-2" onClick={() => void healthQuery.refetch()}><RefreshCw className="h-4 w-4" /> Actualizar</Button></CardHeader><CardContent className="space-y-3">{health.map(service => <div key={service.id} className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{service.name}</p>{statusBadge(service.status)}</div><p className="mt-1 text-sm text-muted-foreground">{service.mode}</p></div><div className="text-right text-xs text-muted-foreground">{service.latencyMs ? `${service.latencyMs} ms` : "Sin medición productiva"}<p className="mt-1 flex items-center justify-end gap-1"><ExternalLink className="h-3 w-3" /> Última lectura: {healthQuery.data?.checkedAt ? new Date(healthQuery.data.checkedAt).toLocaleTimeString("es-AR") : "—"}</p></div></div>)}</CardContent></Card>
              </TabsContent>
              <TabsContent value="cct" className="space-y-5">
                <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Fingerprint className="h-5 w-5 text-violet-600" /> Parámetros de escenario</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Sueldo básico</Label><Input value={baseSalary} onChange={event => setBaseSalary(event.target.value)} inputMode="decimal" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Aportes patronales</Label><Input value={employerRate} onChange={event => setEmployerRate(event.target.value)} inputMode="decimal" /></div><div className="space-y-2"><Label>Aportes empleado</Label><Input value={employeeRate} onChange={event => setEmployeeRate(event.target.value)} inputMode="decimal" /></div></div><div className="space-y-2"><Label>Adicional CCT configurable</Label><Input value={bonusPercent} onChange={event => setBonusPercent(event.target.value)} inputMode="decimal" /><p className="text-xs text-muted-foreground">Usa proporciones decimales: 0.10 equivale a 10%. El resultado es determinístico y requiere revisión profesional.</p></div><Button className="w-full" onClick={simulate} disabled={simulateMutation.isPending}>{simulateMutation.isPending ? "Calculando..." : "Simular impacto"}</Button></CardContent></Card>
                  <Card><CardHeader><CardTitle>Impacto estimado de la fórmula</CardTitle><p className="text-sm text-muted-foreground">Motor determinístico para comparar masa salarial antes de aprobar una plantilla.</p></CardHeader><CardContent>{simulation ? <div className="grid gap-3 sm:grid-cols-2">{[["Sueldo bruto", simulation.gross], ["Aportes patronales", simulation.employerContributions], ["Aportes empleado", simulation.employeeContributions], ["Neto estimado", simulation.net], ["Costo total empresa", simulation.totalEmployerCost], ["Conceptos aplicados", simulation.control.conceptsApplied]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{typeof value === "number" ? money.format(value) : value}</p></div>)}</div> : <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">Configura una fórmula y ejecuta la simulación para visualizar su impacto.</div>}<Separator className="my-5" /><div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><p>La simulación ayuda a anticipar impactos, pero no reemplaza la validación del convenio aplicable ni la aprobación del responsable.</p></div></CardContent></Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </PartnerOnly>
    </DashboardLayout>
  );
}
