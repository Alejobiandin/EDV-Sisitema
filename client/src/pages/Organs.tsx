import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, ArrowRight, Bot, CheckCircle2, Layers3, ListTodo } from "lucide-react";
import { Link } from "wouter";

function formatOrganName(name: string) {
  return name.replace("Área ", "");
}

export default function Organs() {
  const { data: organs, isLoading, error } = trpc.organs.catalog.useQuery(undefined, { refetchInterval: 15000 });
  const totalAgents = organs?.reduce((sum, organ) => sum + organ.metrics.totalAgents, 0) ?? 0;
  const activeAgents = organs?.reduce((sum, organ) => sum + organ.metrics.activeAgents, 0) ?? 0;
  const runningTasks = organs?.reduce((sum, organ) => sum + organ.metrics.runningTasks, 0) ?? 0;
  const approvalQueue = organs?.reduce((sum, organ) => sum + organ.metrics.pendingApproval, 0) ?? 0;

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-background px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-5 border-b border-border/60 pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary"><span className="h-2 w-2 rounded-full bg-emerald-500" />EDV · Arquitectura por órganos</div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">Centro operativo empresarial</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Cada órgano agrupa agentes especializados, tareas, alertas y reglas del ADN para ejecutar la operación de la empresa con trazabilidad y supervisión humana.</p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">Volver al centro de mando <ArrowRight className="h-4 w-4" /></Link>
          </header>

          {error ? <Card><CardContent className="pt-6 text-sm text-destructive">No se pudieron cargar los órganos operativos.</CardContent></Card> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Agentes registrados", value: totalAgents, hint: `${activeAgents} operativos`, icon: Bot, tone: "text-blue-600 bg-blue-50" },
              { label: "Órganos activos", value: organs?.length ?? 0, hint: "Cobertura empresarial", icon: Layers3, tone: "text-violet-600 bg-violet-50" },
              { label: "Tareas en ejecución", value: runningTasks, hint: "Procesamiento actual", icon: ListTodo, tone: "text-amber-600 bg-amber-50" },
              { label: "Revisión humana", value: approvalQueue, hint: "Decisiones pendientes", icon: AlertTriangle, tone: "text-rose-600 bg-rose-50" },
            ].map(metric => {
              const Icon = metric.icon;
              return <Card key={metric.label} className="border-border/70 shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{isLoading ? "—" : metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p></div><div className={`rounded-2xl p-3 ${metric.tone}`}><Icon className="h-5 w-5" /></div></CardContent></Card>;
            })}
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            {isLoading ? Array.from({ length: 6 }).map((_, index) => <Card key={index}><CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-72" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>) : organs?.map(organ => {
              const utilization = organ.metrics.totalAgents ? Math.round((organ.metrics.activeAgents / organ.metrics.totalAgents) * 100) : 0;
              return <Card key={organ.code} className="overflow-hidden border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                  <div className="flex items-start justify-between gap-4"><div><CardTitle className="text-lg">{formatOrganName(organ.name)}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{organ.description}</p></div><Badge variant={utilization === 100 ? "default" : "secondary"}>{utilization}% operativo</Badge></div>
                </CardHeader>
                <CardContent className="space-y-5 pt-5">
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${utilization}%` }} /></div>
                  <div className="grid grid-cols-4 gap-3 text-center"><MetricCell icon={Bot} label="Agentes" value={organ.metrics.totalAgents} /><MetricCell icon={Activity} label="Activos" value={organ.metrics.activeAgents} /><MetricCell icon={ListTodo} label="Tareas" value={organ.metrics.runningTasks} /><MetricCell icon={AlertTriangle} label="HITL" value={organ.metrics.pendingApproval} /></div>
                  <div className="flex flex-wrap gap-2">{organ.agents.slice(0, 4).map(agent => <Badge key={agent.id} variant="outline" className="gap-1.5 font-normal"><span className={`h-1.5 w-1.5 rounded-full ${agent.status === "active" || agent.status === "in_task" ? "bg-emerald-500" : "bg-muted-foreground"}`} />{agent.name}</Badge>)}{organ.agents.length > 4 ? <Badge variant="outline" className="font-normal">+{organ.agents.length - 4} agentes</Badge> : null}</div>
                </CardContent>
              </Card>;
            })}
          </section>

          <Card className="border-primary/20 bg-primary/[0.03] shadow-sm"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="font-medium">La supervisión humana permanece en el circuito</p><p className="mt-1 text-sm text-muted-foreground">Los agentes ejecutan tareas de bajo riesgo; cambios sensibles, pagos, cierres y excepciones se elevan a aprobación.</p></div></div><Link href="/asistente" className="shrink-0 text-sm font-semibold text-primary hover:underline">Consultar ADN</Link></CardContent></Card>
        </div>
      </main>
    </DashboardLayout>
  );
}

function MetricCell({ icon: Icon, label, value }: { icon: typeof Bot; label: string; value: number }) {
  return <div><Icon className="mx-auto h-4 w-4 text-muted-foreground" /><p className="mt-1 text-lg font-semibold">{value}</p><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p></div>;
}
