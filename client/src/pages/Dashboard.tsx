import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  Clock3,
  Download,
  FileSpreadsheet,
  Command,
  FileText,
  LayoutGrid,
  ListTodo,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TriangleAlert,
  Users,
  XCircle,
  Zap,
  BarChart3,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type AgentTaskType =
  | "tax_computation"
  | "payroll_liquidation"
  | "social_charges"
  | "accounting_review";

const statusCopy = {
  active: {
    label: "Activo",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  in_task: {
    label: "En tarea",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  inactive: {
    label: "Inactivo",
    className: "border-slate-200 bg-slate-50 text-slate-500",
  },
} as const;

const taskTypeCopy: Record<AgentTaskType, string> = {
  tax_computation: "Determinación impositiva",
  payroll_liquidation: "Liquidación de sueldos",
  social_charges: "Cargas sociales / F.931",
  accounting_review: "Revisión contable",
};

const taskStatusCopy: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "text-amber-700" },
  in_progress: { label: "En curso", className: "text-blue-700" },
  pending_approval: {
    label: "Requiere aprobación",
    className: "text-amber-700",
  },
  completed: { label: "Completada", className: "text-emerald-700" },
  rejected: { label: "Rechazada", className: "text-rose-700" },
  failed: { label: "Con error", className: "text-rose-700" },
  cancelled: { label: "Cancelada", className: "text-slate-500" },
};

const activityColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
];
const notificationCopy: Record<string, { label: string; tone: string }> = {
  task_completed: {
    label: "Tarea completada",
    tone: "text-emerald-700 bg-emerald-50",
  },
  agent_error: { label: "Error de célula", tone: "text-rose-700 bg-rose-50" },
  human_approval: {
    label: "Aprobación humana",
    tone: "text-amber-700 bg-amber-50",
  },
  system_alert: {
    label: "Alerta del sistema",
    tone: "text-blue-700 bg-blue-50",
  },
  pattern_detected: {
    label: "Patrón detectado",
    tone: "text-violet-700 bg-violet-50",
  },
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Activity;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-[0_12px_35px_rgba(15,32,54,0.06)] transition-transform duration-200 hover:-translate-y-0.5">
      <CardContent className="relative p-5">
        <div
          className={`absolute right-0 top-0 h-20 w-20 rounded-bl-[32px] ${accent} opacity-[0.08]`}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#10253f]">
              {value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent} text-white shadow-lg shadow-slate-200`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6 p-4">
      <div className="space-y-3">
        <Skeleton className="h-3 w-52" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-[30rem] max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-lg border-rose-200 bg-white shadow-lg">
        <CardContent className="p-8 text-center">
          <TriangleAlert className="mx-auto h-10 w-10 text-rose-500" />
          <h2 className="mt-4 text-xl font-semibold text-[#10253f]">
            No pudimos leer las señales
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            El centro de mando no pudo obtener el resumen del organismo. Revisa
            la conexión y vuelve a intentarlo.
          </p>
          <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
            {message}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function getDashboardRenderState(input: {
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
}) {
  if (input.isLoading) return "loading" as const;
  if (input.isError) return "error" as const;
  return input.hasData ? ("ready" as const) : ("empty" as const);
}

function parseTaskMeta(description: string | null) {
  try {
    return JSON.parse(description ?? "{}") as {
      taskType?: string;
      inputPayload?: Record<string, unknown>;
      outputResult?: {
        deterministicResult?: Record<string, unknown>;
        justification?: string;
      };
      risk?: string;
    };
  } catch {
    return {};
  }
}

function downloadBase64File(file: {
  dataBase64: string;
  contentType: string;
  fileName: string;
}) {
  const bytes = Uint8Array.from(atob(file.dataBase64), character =>
    character.charCodeAt(0)
  );
  const blob = new Blob([bytes], { type: file.contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ReportExportActions({
  taskId,
  taskType,
  onExport,
  disabled,
}: {
  taskId: number;
  taskType?: string;
  onExport: (taskId: number, format: "pdf" | "xlsx") => void;
  disabled: boolean;
}) {
  if (taskType !== "tax_computation" && taskType !== "payroll_liquidation")
    return null;
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 border-slate-200 bg-white px-2 text-[11px] text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        onClick={() => onExport(taskId, "pdf")}
        disabled={disabled}
        title="Descargar PDF"
      >
        <Download className="h-3.5 w-3.5" /> PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 border-slate-200 bg-white px-2 text-[11px] text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
        onClick={() => onExport(taskId, "xlsx")}
        disabled={disabled}
        title="Descargar Excel"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
      </Button>
    </div>
  );
}

type ProfitabilityRow = {
  clientId: number;
  clientName: string;
  taxCategory: string;
  totalBilled: number;
  estimatedCost: number;
  margin: number;
  invoicesCount: number;
};

export function getProfitabilityChartRows(
  data: ProfitabilityRow[],
  metric: "margin" | "totalBilled"
) {
  return [...data].sort((a, b) => b[metric] - a[metric]);
}

function ProfitabilityChart({ data }: { data: ProfitabilityRow[] }) {
  const [metric, setMetric] = useState<"margin" | "totalBilled">("margin");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const sorted = getProfitabilityChartRows(data, metric);
  const maxValue = Math.max(...sorted.map(row => row[metric]), 1);
  const selected =
    sorted.find(row => row.clientId === selectedClientId) ?? sorted[0];

  return (
    <Card className="border-emerald-200/80 bg-white/95 shadow-[0_12px_35px_rgba(15,32,54,0.06)]">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-emerald-600">
            <BarChart3 className="h-3.5 w-3.5" /> Rentabilidad por cliente
          </div>
          <CardTitle className="mt-2 text-xl tracking-[-0.03em] text-[#10253f]">
            Quién aporta más margen a EDV
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Comparativa basada en honorarios facturados y costo operativo
            estimado de las células.
          </p>
        </div>
        <div className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMetric("margin")}
            className={`rounded-md px-3 py-1.5 font-semibold transition ${metric === "margin" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}
          >
            Margen
          </button>
          <button
            type="button"
            onClick={() => setMetric("totalBilled")}
            className={`rounded-md px-3 py-1.5 font-semibold transition ${metric === "totalBilled" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
          >
            Facturado
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <EmptyState message="Todavía no hay facturas asociadas a clientes para calcular rentabilidad." />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
            <div
              className="space-y-3"
              role="list"
              aria-label="Rentabilidad comparada por cliente"
            >
              {sorted.slice(0, 8).map(row => {
                const percentage = Math.max(
                  (row[metric] / maxValue) * 100,
                  row[metric] > 0 ? 3 : 0
                );
                const isSelected = selected?.clientId === row.clientId;
                return (
                  <button
                    type="button"
                    key={row.clientId}
                    onClick={() => setSelectedClientId(row.clientId)}
                    className={`group w-full rounded-xl p-2 text-left transition ${isSelected ? "bg-emerald-50" : "hover:bg-slate-50"}`}
                    title={`${row.clientName}: $${row[metric].toLocaleString("es-AR")}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="max-w-[55%] truncate font-semibold text-slate-700">
                        {row.clientName}
                      </span>
                      <span className="font-semibold text-slate-500">
                        $
                        {row[metric].toLocaleString("es-AR", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${metric === "margin" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-blue-400 to-blue-600"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            {selected && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Cliente seleccionado
                </p>
                <p className="mt-2 truncate text-lg font-semibold text-[#102c4b]">
                  {selected.clientName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selected.taxCategory}
                </p>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Facturado</span>
                    <strong>
                      ${selected.totalBilled.toLocaleString("es-AR")}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Costo estimado</span>
                    <strong className="text-rose-600">
                      -${selected.estimatedCost.toLocaleString("es-AR")}
                    </strong>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">Margen</span>
                    <strong className="text-emerald-700">
                      ${selected.margin.toLocaleString("es-AR")}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Comprobantes</span>
                    <span className="font-semibold text-slate-600">
                      {selected.invoicesCount}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const summaryQuery = trpc.dashboard.summary.useQuery(undefined, {
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  const orgsQuery = trpc.organizations.list.useQuery();
  const [selectedOrgId, setSelectedOrgId] = useState(1);
  const markNotificationRead =
    trpc.systemLogs.notifications.update.useMutation();
  const executeTask = trpc.agents.executeTask.useMutation();
  const approveTask = trpc.tasks.approve.useMutation();
  const rejectTask = trpc.tasks.reject.useMutation();
  const exportReport = trpc.reports.export.useMutation();
  const clientsQuery = trpc.edvManagement.listClients.useQuery({
    organizationId: selectedOrgId,
  });
  const [selectedClientId, setSelectedClientId] = useState<
    number | undefined
  >();
  const employeesQuery = trpc.edvManagement.listEmployees.useQuery(
    selectedClientId
      ? { organizationId: selectedOrgId, clientId: selectedClientId }
      : undefined,
    { enabled: Boolean(selectedClientId) }
  );
  const summary = summaryQuery.data;
  const agents = summary?.agentsList ?? [];
  const tasks = summary?.tasksList ?? [];
  const approvalTasks = summary?.approvalTasksList ?? [];
  const recentActivity = summary?.recentActivity ?? [];
  const notifications = summary?.notificationsList ?? [];
  const activeRatio = summary?.totalAgents
    ? Math.round((summary.activeAgents / summary.totalAgents) * 100)
    : 0;
  const dnaEntries = (summary?.totalRules ?? 0) + (summary?.totalPolicies ?? 0);
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(
    undefined
  );
  const [taskType, setTaskType] = useState<AgentTaskType>("tax_computation");
  const [clientName, setClientName] = useState("Cliente demostración");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<
    number | undefined
  >();
  const [period, setPeriod] = useState("2026-07");
  const [grossSales, setGrossSales] = useState("4000000");
  const [vatPurchases, setVatPurchases] = useState("800000");
  const [baseSalary, setBaseSalary] = useState("1600000");
  const [overtimeHours, setOvertimeHours] = useState("0");
  const [rejectingTaskId, setRejectingTaskId] = useState<number | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");

  useEffect(() => {
    if (
      orgsQuery.data?.[0] &&
      !orgsQuery.data.some(org => org.id === selectedOrgId)
    )
      setSelectedOrgId(orgsQuery.data[0].id);
  }, [orgsQuery.data, selectedOrgId]);

  useEffect(() => {
    if (!selectedClientId && clientsQuery.data?.[0])
      setSelectedClientId(clientsQuery.data[0].id);
  }, [clientsQuery.data, selectedClientId]);

  useEffect(() => {
    const selectedClient = clientsQuery.data?.find(
      client => client.id === selectedClientId
    );
    if (selectedClient) setClientName(selectedClient.name);
  }, [clientsQuery.data, selectedClientId]);

  useEffect(() => {
    if (!selectedEmployeeId && employeesQuery.data?.[0]) {
      setSelectedEmployeeId(employeesQuery.data[0].id);
      setBaseSalary(String(employeesQuery.data[0].baseSalary));
    }
  }, [employeesQuery.data, selectedEmployeeId]);

  useEffect(() => {
    const selectedEmployee = employeesQuery.data?.find(
      employee => employee.id === selectedEmployeeId
    );
    if (selectedEmployee) setBaseSalary(String(selectedEmployee.baseSalary));
  }, [employeesQuery.data, selectedEmployeeId]);

  useEffect(() => {
    if (selectedAgentId === undefined && agents[0])
      setSelectedAgentId(agents[0].id);
    if (
      selectedAgentId !== undefined &&
      !agents.some(agent => agent.id === selectedAgentId)
    )
      setSelectedAgentId(agents[0]?.id);
  }, [agents, selectedAgentId]);

  const taskBreakdown = useMemo(() => {
    const counts = {
      pending: 0,
      in_progress: 0,
      pending_approval: 0,
      completed: 0,
      rejected: 0,
      failed: 0,
    };
    tasks.forEach(task => {
      if (task.status in counts)
        counts[task.status as keyof typeof counts] += 1;
    });
    return counts;
  }, [tasks]);
  const renderState = getDashboardRenderState({
    isLoading: summaryQuery.isLoading,
    isError: summaryQuery.isError,
    hasData: Boolean(summary),
  });

  if (renderState === "loading")
    return (
      <DashboardLayout>
        <DashboardLoading />
      </DashboardLayout>
    );
  if (renderState === "error")
    return (
      <DashboardLayout>
        <DashboardError
          message={summaryQuery.error?.message ?? "Error desconocido"}
        />
      </DashboardLayout>
    );

  const handleRefresh = async () => {
    await summaryQuery.refetch();
    toast.success("Estado del organismo actualizado");
  };
  const handleMarkRead = async (id: number) => {
    await markNotificationRead.mutateAsync({ id, isRead: 1 });
    await summaryQuery.refetch();
    toast.success("Alerta marcada como revisada");
  };
  const handleExecute = async () => {
    if (!selectedAgentId) {
      toast.error("Selecciona una célula agente antes de ejecutar");
      return;
    }
    const payload =
      taskType === "tax_computation"
        ? {
            clientName,
            period,
            grossSales: Number(grossSales) || 0,
            vatPurchases: Number(vatPurchases) || 0,
            clientId: selectedClientId,
          }
        : {
            clientName,
            period,
            baseSalary: Number(baseSalary) || 0,
            overtimeHours: Number(overtimeHours) || 0,
            employeeId: selectedEmployeeId,
            clientId: selectedClientId,
          };
    try {
      const result = await executeTask.mutateAsync({
        organizationId: selectedOrgId,
        agentId: selectedAgentId,
        taskType,
        payload,
      });
      await summaryQuery.refetch();
      toast.success(
        result.requiresApproval
          ? "La célula pausó la tarea: requiere aprobación humana"
          : "La tarea fue completada por la célula"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo ejecutar la tarea"
      );
    }
  };
  const handleApprove = async (taskId: number) => {
    try {
      await approveTask.mutateAsync({ taskId, organizationId: selectedOrgId });
      await summaryQuery.refetch();
      toast.success("Tarea aprobada y finalizada");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo aprobar la tarea"
      );
    }
  };
  const handleReject = async () => {
    if (!rejectingTaskId || rejectionComment.trim().length < 3) {
      toast.error("Ingresa un motivo de rechazo de al menos 3 caracteres");
      return;
    }
    try {
      await rejectTask.mutateAsync({
        taskId: rejectingTaskId,
        organizationId: selectedOrgId,
        comment: rejectionComment.trim(),
      });
      await summaryQuery.refetch();
      setRejectingTaskId(null);
      setRejectionComment("");
      toast.success("Tarea rechazada y registrada en auditoría");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo rechazar la tarea"
      );
    }
  };
  const handleExport = async (taskId: number, format: "pdf" | "xlsx") => {
    try {
      const file = await exportReport.mutateAsync({
        taskId,
        organizationId: selectedOrgId,
        format,
      });
      downloadBase64File(file);
      toast.success(
        `Reporte ${format === "pdf" ? "PDF" : "Excel"} descargado y listo para compartir`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo exportar el reporte"
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f6f8fb] text-[#10253f]">
        <div className="mx-auto max-w-[1480px] space-y-6 px-1 pb-10 sm:px-4">
          <header className="flex flex-col justify-between gap-5 pt-2 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />{" "}
                EDV · Sistema Organizacional Cognitivo
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.045em] text-[#10253f] sm:text-4xl">
                Centro de Mando EDV
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Arquitectura multiagente con motor determinístico Python y
                memoria institucional para estudios contables.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Empresa
                <select
                  value={String(selectedOrgId)}
                  onChange={event =>
                    setSelectedOrgId(Number(event.target.value))
                  }
                  className="mt-1 block h-9 min-w-44 rounded-lg border border-slate-200 bg-white px-2 text-xs normal-case tracking-normal text-slate-700"
                >
                  <option value="1">Organización #1</option>
                  {(orgsQuery.data ?? [])
                    .filter(org => org.id !== 1)
                    .map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                Actualización automática · 15 s
              </div>
              <Button
                variant="outline"
                size="icon"
                className="border-slate-200 bg-white text-slate-600 shadow-sm"
                onClick={handleRefresh}
                disabled={summaryQuery.isFetching}
                aria-label="Actualizar dashboard"
              >
                <RefreshCw
                  className={`h-4 w-4 ${summaryQuery.isFetching ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                className="gap-2 bg-[#102c4b] text-white shadow-lg shadow-blue-950/10 hover:bg-[#173d64]"
                onClick={() =>
                  toast.info(
                    "Usa el panel de ejecución para enviar una tarea a una célula"
                  )
                }
              >
                <Command className="h-4 w-4" /> Centro de comandos
              </Button>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Células activas"
              value={`${summary?.activeAgents ?? 0}/${summary?.totalAgents ?? 0}`}
              detail={`${activeRatio}% del organismo operativo`}
              icon={Users}
              accent="bg-blue-600"
            />
            <MetricCard
              label="Tareas en curso"
              value={summary?.runningTasks ?? 0}
              detail={`${summary?.approvalTasks ?? 0} esperan aprobación`}
              icon={ListTodo}
              accent="bg-violet-600"
            />
            <MetricCard
              label="Alertas sin leer"
              value={summary?.unreadNotifications ?? 0}
              detail="Notificaciones que requieren revisión"
              icon={Bell}
              accent="bg-amber-500"
            />
            <MetricCard
              label="Entradas de ADN"
              value={dnaEntries}
              detail={`${summary?.totalRules ?? 0} reglas · ${summary?.totalPolicies ?? 0} políticas`}
              icon={BrainCircuit}
              accent="bg-emerald-600"
            />
          </section>

          <ProfitabilityChart data={summary?.clientProfitability ?? []} />

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-blue-200/80 bg-white/95 shadow-[0_12px_35px_rgba(15,32,54,0.08)]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-blue-600">
                  <Zap className="h-3.5 w-3.5" /> Orquestador de tareas
                </div>
                <CardTitle className="mt-2 text-xl tracking-[-0.03em] text-[#10253f]">
                  Enviar una tarea a una célula
                </CardTitle>
                <p className="text-sm leading-6 text-slate-500">
                  El cálculo determinístico se ejecuta primero; el razonamiento
                  cognitivo agrega contexto del ADN Organizacional y detiene los
                  casos de alto riesgo.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                    Célula agente
                    <select
                      value={selectedAgentId ?? ""}
                      onChange={event =>
                        setSelectedAgentId(Number(event.target.value))
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
                    >
                      <option value="" disabled>
                        Seleccionar célula
                      </option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} · {agent.organ ?? "Órgano"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                    Tipo de tarea
                    <select
                      value={taskType}
                      onChange={event =>
                        setTaskType(event.target.value as AgentTaskType)
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
                    >
                      {Object.entries(taskTypeCopy).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                    Cliente precargado
                    <select
                      value={selectedClientId ?? ""}
                      onChange={event =>
                        setSelectedClientId(Number(event.target.value))
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
                    >
                      <option value="">Cliente demostración</option>
                      {clientsQuery.data?.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} · {client.taxId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                    Período
                    <input
                      value={period}
                      onChange={event => setPeriod(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
                    />
                  </label>
                </div>
                {taskType !== "tax_computation" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                      Empleado precargado
                      <select
                        value={selectedEmployeeId ?? ""}
                        onChange={event =>
                          setSelectedEmployeeId(Number(event.target.value))
                        }
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
                      >
                        <option value="">Liquidación manual</option>
                        {employeesQuery.data?.map(employee => (
                          <option key={employee.id} value={employee.id}>
                            {employee.fullName} · $
                            {Number(employee.baseSalary).toLocaleString(
                              "es-AR"
                            )}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                      Cliente / entidad
                      <input
                        value={clientName}
                        onChange={event => setClientName(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
                      />
                    </label>
                  </div>
                )}
                {taskType === "tax_computation" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                      Ventas gravadas
                      <input
                        type="number"
                        value={grossSales}
                        onChange={event => setGrossSales(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
                      />
                    </label>
                    <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                      Compras con crédito fiscal
                      <input
                        type="number"
                        value={vatPurchases}
                        onChange={event => setVatPurchases(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                      Sueldo base
                      <input
                        type="number"
                        value={baseSalary}
                        onChange={event => setBaseSalary(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
                      />
                    </label>
                    <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                      Horas suplementarias
                      <input
                        type="number"
                        value={overtimeHours}
                        onChange={event => setOvertimeHours(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none ring-blue-200 transition focus:ring-2"
                      />
                    </label>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f2f6fb] p-3 text-xs text-slate-500">
                  <span>
                    El ejemplo fiscal supera deliberadamente el umbral de
                    revisión para demostrar HITL.
                  </span>
                  <Button
                    className="bg-[#102c4b] text-white hover:bg-[#173d64]"
                    onClick={handleExecute}
                    disabled={executeTask.isPending || agents.length === 0}
                  >
                    {executeTask.isPending
                      ? "Procesando célula…"
                      : "Ejecutar tarea"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 bg-[#102c4b] text-white shadow-[0_18px_45px_rgba(16,44,75,0.18)]">
              <CardContent className="relative h-full p-6">
                <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-white/10" />
                <div className="absolute -bottom-20 -left-8 h-40 w-40 rounded-full border border-white/10" />
                <div className="relative flex h-full flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-blue-200">
                      <Sparkles className="h-3.5 w-3.5" /> Estado del organismo
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                      Coordinación estable
                    </h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100/70">
                      Las células ejecutan cálculos determinísticos, consultan
                      la memoria institucional y elevan las decisiones sensibles
                      a una persona responsable.
                    </p>
                  </div>
                  <div className="mt-8">
                    <div className="mb-2 flex items-center justify-between text-xs text-blue-100/70">
                      <span>Disponibilidad de células</span>
                      <span className="font-semibold text-white">
                        {activeRatio}%
                      </span>
                    </div>
                    <Progress
                      value={activeRatio}
                      className="h-2 bg-white/15 [&>div]:bg-emerald-400"
                    />
                    <div className="mt-5 flex items-center gap-2 text-xs text-blue-100/70">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />{" "}
                      Riesgo humano contenido por aprobación explícita
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-amber-200/80 bg-white/95 shadow-[0_12px_35px_rgba(15,32,54,0.06)]">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-amber-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Human-in-the-loop
                  </div>
                  <CardTitle className="mt-2 text-xl tracking-[-0.03em] text-[#10253f]">
                    Cola de decisiones humanas
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Una tarea de alto riesgo no puede finalizar sin una decisión
                    explícita y auditable.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-amber-700"
                >
                  {summary?.approvalTasks ?? approvalTasks.length} pendientes
                </Badge>
              </CardHeader>
              <CardContent>
                {approvalTasks.length === 0 ? (
                  <EmptyState message="No hay tareas bloqueadas esperando aprobación." />
                ) : (
                  <div className="space-y-3">
                    {approvalTasks.map(task => {
                      const meta = parseTaskMeta(task.description);
                      const status =
                        taskStatusCopy[task.status] ?? taskStatusCopy.pending;
                      return (
                        <div
                          key={task.id}
                          className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                              <TriangleAlert className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-800">
                                  {task.name}
                                </p>
                                <span
                                  className={`text-xs font-semibold ${status.className}`}
                                >
                                  {status.label}
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Riesgo: {meta.risk ?? "alto"}. La célula
                                solicitó revisión antes de consolidar el
                                resultado.
                              </p>
                              {meta.outputResult?.justification && (
                                <p className="mt-2 rounded-xl bg-white/80 p-3 text-sm leading-6 text-slate-600">
                                  {meta.outputResult.justification}
                                </p>
                              )}
                              <p className="mt-2 text-[11px] text-slate-400">
                                Creada:{" "}
                                {new Date(task.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() => handleApprove(task.id)}
                                disabled={
                                  approveTask.isPending || rejectTask.isPending
                                }
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                                onClick={() =>
                                  setRejectingTaskId(
                                    rejectingTaskId === task.id ? null : task.id
                                  )
                                }
                              >
                                <XCircle className="h-3.5 w-3.5" /> Rechazar
                              </Button>
                            </div>
                          </div>
                          {rejectingTaskId === task.id && (
                            <div className="mt-3 flex flex-col gap-2 border-t border-amber-200 pt-3 sm:flex-row">
                              <input
                                value={rejectionComment}
                                onChange={event =>
                                  setRejectionComment(event.target.value)
                                }
                                placeholder="Motivo de rechazo y próxima acción…"
                                className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-rose-200 focus:ring-2"
                              />
                              <Button
                                size="sm"
                                className="bg-rose-600 text-white hover:bg-rose-700"
                                onClick={handleReject}
                                disabled={rejectTask.isPending}
                              >
                                Confirmar rechazo
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="border-slate-200/80 bg-white/90 shadow-[0_12px_35px_rgba(15,32,54,0.06)]">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-slate-400">
                    <Bell className="h-3.5 w-3.5 text-amber-500" /> Señales que
                    requieren atención
                  </div>
                  <CardTitle className="mt-2 text-xl tracking-[-0.03em] text-[#10253f]">
                    Alertas y aprobaciones
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-amber-700"
                >
                  {summary?.unreadNotifications ?? 0} sin leer
                </Badge>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <EmptyState message="Aguardando señales de atención. No hay alertas pendientes." />
                ) : (
                  <div className="grid gap-2 lg:grid-cols-2">
                    {notifications.map(notification => {
                      const copy = notificationCopy[notification.type] ?? {
                        label: "Señal del sistema",
                        tone: "text-slate-700 bg-slate-50",
                      };
                      return (
                        <div
                          key={notification.id}
                          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm"
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${copy.tone}`}
                          >
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-700">
                                {copy.label}
                              </span>
                              {notification.isRead === 0 && (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              )}
                            </div>
                            <p className="mt-1 truncate text-sm text-slate-600">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>
                          {notification.isRead === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0 text-xs text-[#173d64]"
                              onClick={() => handleMarkRead(notification.id)}
                              disabled={markNotificationRead.isPending}
                            >
                              Revisar
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
            <Card className="border-slate-200/80 bg-white/90 shadow-[0_12px_35px_rgba(15,32,54,0.06)]">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-slate-400">
                    <Users className="h-3.5 w-3.5 text-violet-500" /> Células
                    agente
                  </div>
                  <CardTitle className="mt-2 text-xl tracking-[-0.03em] text-[#10253f]">
                    Pulso del equipo cognitivo
                  </CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-xs text-slate-600"
                  onClick={() =>
                    toast.info(
                      "La gestión detallada de células se habilitará en la próxima fase"
                    )
                  }
                >
                  Ver todas
                </Button>
              </CardHeader>
              <CardContent>
                {agents.length === 0 ? (
                  <EmptyState message="No hay células agente registradas todavía." />
                ) : (
                  <div className="space-y-2">
                    {agents.slice(0, 5).map(agent => {
                      const status =
                        statusCopy[agent.status as keyof typeof statusCopy] ??
                        statusCopy.inactive;
                      return (
                        <div
                          key={agent.id}
                          className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition-colors hover:border-slate-100 hover:bg-slate-50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3fa] text-[#173d64]">
                            <Zap className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-700">
                              {agent.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {agent.role} ·{" "}
                              {agent.organ ?? "Órgano no asignado"}
                            </p>
                          </div>
                          <Badge variant="outline" className={status.className}>
                            {status.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white/90 shadow-[0_12px_35px_rgba(15,32,54,0.06)]">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-slate-400">
                    <ListTodo className="h-3.5 w-3.5 text-emerald-500" />{" "}
                    Workflows
                  </div>
                  <CardTitle className="mt-2 text-xl tracking-[-0.03em] text-[#10253f]">
                    Flujo de ejecución
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400"
                  onClick={() =>
                    toast.info(
                      "El historial de workflows se habilitará en la próxima fase"
                    )
                  }
                  aria-label="Abrir workflows"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[
                    {
                      label: "Pendientes",
                      value: taskBreakdown.pending,
                      icon: Clock3,
                      color: "text-amber-600 bg-amber-50",
                    },
                    {
                      label: "En curso",
                      value: taskBreakdown.in_progress,
                      icon: TimerReset,
                      color: "text-blue-600 bg-blue-50",
                    },
                    {
                      label: "HITL",
                      value: taskBreakdown.pending_approval,
                      icon: ShieldCheck,
                      color: "text-orange-600 bg-orange-50",
                    },
                    {
                      label: "Completadas",
                      value: taskBreakdown.completed,
                      icon: CheckCircle2,
                      color: "text-emerald-600 bg-emerald-50",
                    },
                    {
                      label: "Rechazadas",
                      value: taskBreakdown.rejected,
                      icon: XCircle,
                      color: "text-rose-600 bg-rose-50",
                    },
                    {
                      label: "Con error",
                      value: taskBreakdown.failed,
                      icon: TriangleAlert,
                      color: "text-rose-600 bg-rose-50",
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="rounded-2xl bg-slate-50 p-3 text-center"
                    >
                      <div
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-xl ${item.color}`}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-xl font-semibold text-[#10253f]">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
                <Separator className="my-5 bg-slate-100" />
                {tasks.length === 0 ? (
                  <EmptyState message="No hay tareas para mostrar en este momento." />
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map(task => {
                      const status =
                        taskStatusCopy[task.status] ?? taskStatusCopy.pending;
                      const meta = parseTaskMeta(task.description);
                      return (
                        <div
                          key={task.id}
                          className="flex flex-wrap items-center gap-3"
                        >
                          <CircleDot className="h-4 w-4 text-blue-500" />
                          <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                            {task.name}
                          </span>
                          <span
                            className={`text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                          {task.status === "completed" && (
                            <ReportExportActions
                              taskId={task.id}
                              taskType={meta.taskType}
                              onExport={handleExport}
                              disabled={exportReport.isPending}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
            <Card className="border-slate-200/80 bg-white/90 shadow-[0_12px_35px_rgba(15,32,54,0.06)]">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-slate-400">
                    <Activity className="h-3.5 w-3.5 text-blue-500" /> Señales
                    operativas
                  </div>
                  <CardTitle className="mt-2 text-xl tracking-[-0.03em] text-[#10253f]">
                    Actividad reciente
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400"
                  onClick={() =>
                    toast.info(
                      "La trazabilidad detallada estará disponible en su módulo"
                    )
                  }
                  aria-label="Más opciones"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <EmptyState message="Aún no hay señales registradas en el organismo." />
                ) : (
                  <div className="space-y-1">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="group flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-50"
                      >
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${activityColors[index % activityColors.length]}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium text-slate-700">
                              {activity.action}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {activity.entityType ?? "Sistema"}
                            {activity.entityId
                              ? ` · #${activity.entityId}`
                              : ""}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-1 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white/90 shadow-[0_12px_35px_rgba(15,32,54,0.06)]">
              <CardContent className="flex h-full flex-col justify-center p-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-emerald-600">
                  <FileText className="h-3.5 w-3.5" /> Memoria institucional
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[#10253f]">
                  ADN Organizacional conectado
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {dnaEntries} entradas disponibles para contextualizar las
                  decisiones de las células agente. Las reglas deben mantenerse
                  actualizadas por el equipo profesional.
                </p>
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                  <strong className="text-slate-700">Última lectura:</strong>{" "}
                  {summaryQuery.dataUpdatedAt
                    ? new Date(summaryQuery.dataUpdatedAt).toLocaleString()
                    : "—"}
                </div>
              </CardContent>
            </Card>
          </section>

          <footer className="flex flex-col justify-between gap-2 border-t border-slate-200/80 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center">
            <span className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Motor cognitivo conectado ·
              supervisión humana activa
            </span>
            <span>
              Actualización:{" "}
              {summaryQuery.dataUpdatedAt
                ? new Date(summaryQuery.dataUpdatedAt).toLocaleTimeString()
                : "—"}
            </span>
          </footer>
        </div>
      </div>
    </DashboardLayout>
  );
}

export { Dashboard };
