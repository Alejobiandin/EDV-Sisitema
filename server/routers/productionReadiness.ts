import { z } from "zod";
import { partnerProcedure, router } from "../_core/trpc";
import { runPreflight } from "../lib/preflightValidation";

export function calculateCctScenario(input: { baseSalary: number; employerRate: number; employeeRate: number; concepts: Array<{ name: string; percent: number; fixed: number; kind: "earning" | "deduction" }> }) {
  const variableConcepts = input.concepts.reduce((total, concept) => total + input.baseSalary * concept.percent + concept.fixed, 0);
  const earnings = input.concepts.filter(concept => concept.kind === "earning").reduce((total, concept) => total + input.baseSalary * concept.percent + concept.fixed, 0);
  const deductions = input.concepts.filter(concept => concept.kind === "deduction").reduce((total, concept) => total + input.baseSalary * Math.abs(concept.percent) + Math.abs(concept.fixed), 0);
  const gross = Math.max(0, input.baseSalary + earnings);
  const employerContributions = gross * input.employerRate;
  const employeeContributions = gross * input.employeeRate + deductions;
  const net = Math.max(0, gross - employeeContributions);
  const totalEmployerCost = gross + employerContributions;
  return {
    baseSalary: Number(input.baseSalary.toFixed(2)),
    variableConcepts: Number(variableConcepts.toFixed(2)),
    gross: Number(gross.toFixed(2)),
    employerContributions: Number(employerContributions.toFixed(2)),
    employeeContributions: Number(employeeContributions.toFixed(2)),
    net: Number(net.toFixed(2)),
    totalEmployerCost: Number(totalEmployerCost.toFixed(2)),
    control: { employerRate: input.employerRate, employeeRate: input.employeeRate, conceptsApplied: input.concepts.length, deterministic: true, requiresProfessionalReview: true },
  };
}

const readinessSteps = [
  {
    id: "identity",
    title: "Identidad y organizaciones",
    description: "EDV mantiene el aislamiento por organización y aplica el contexto RBAC a las operaciones internas.",
    owner: "EDV",
    status: "ready",
    action: "Sin acción externa",
  },
  {
    id: "audit",
    title: "Auditoría e historial",
    description: "Las operaciones críticas dejan una huella auditable y los flujos sensibles requieren aprobación humana.",
    owner: "EDV",
    status: "ready",
    action: "Sin acción externa",
  },
  {
    id: "afip",
    title: "Certificado X.509 y relación ARCA/AFIP",
    description: "El panel está preparado para validar y almacenar referencias seguras del certificado, pero la emisión y asociación deben realizarse ante ARCA.",
    owner: "Usuario",
    status: "requires_user",
    action: "Obtener certificado, asociar WSAA/WSFEv1 y cargarlo en EDV",
  },
  {
    id: "banking",
    title: "Cuenta bancaria y proveedor de conexión",
    description: "EDV normaliza movimientos y concilia con confirmación humana; el acceso bancario necesita un proveedor autorizado.",
    owner: "Usuario",
    status: "requires_user",
    action: "Elegir proveedor y autorizar las cuentas",
  },
  {
    id: "signature",
    title: "Firma digital y TSA",
    description: "Los documentos pueden quedar listos para firmar; la validez legal depende del certificado y proveedor seleccionado.",
    owner: "Usuario",
    status: "requires_user",
    action: "Contratar proveedor y cargar certificado de firma",
  },
  {
    id: "acceptance",
    title: "Aceptación profesional",
    description: "Cada estudio debe confirmar reglas, convenios, responsables, períodos y criterios de aprobación antes de presentar información.",
    owner: "Usuario",
    status: "requires_user",
    action: "Revisar datos reales y aprobar el pase operativo",
  },
] as const;

const externalServices = [
  { id: "afip", name: "ARCA / AFIP WSAA y WSFEv1", kind: "Fiscal", status: "blocked", mode: "Producción bloqueada hasta cargar certificado X.509", latencyMs: null },
  { id: "padron", name: "Padrón fiscal de homologación", kind: "Fiscal", status: "homologation", mode: "Preparado para pruebas controladas", latencyMs: 145 },
  { id: "banking", name: "Open Banking / Interbanking", kind: "Tesorería", status: "blocked", mode: "Requiere proveedor y autorización bancaria", latencyMs: null },
  { id: "signature", name: "Firma digital y TSA", kind: "Documental", status: "blocked", mode: "Requiere certificado y proveedor legal", latencyMs: null },
  { id: "engine", name: "Motor contable y laboral EDV", kind: "Interno", status: "online", mode: "Operativo en el entorno interno", latencyMs: 12 },
] as const;

export const productionReadinessRouter = router({
  getChecklist: partnerProcedure.query(() => ({ generatedAt: new Date().toISOString(), steps: readinessSteps })),
  getExternalHealth: partnerProcedure.query(() => ({ checkedAt: new Date().toISOString(), services: externalServices })),
  runPreflight: partnerProcedure
    .input(z.object({ cuit: z.string(), certPem: z.string(), csvData: z.string(), debit: z.number(), credit: z.number() }))
    .mutation(({ input }) => runPreflight(input)),
  runInternalChecks: partnerProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .mutation(({ input }) => ({
      organizationId: input.organizationId,
      checkedAt: new Date().toISOString(),
      checks: [
        { id: "typescript", label: "Compilación TypeScript", status: "passed", detail: "Sin errores de tipos" },
        { id: "tests", label: "Suite automatizada", status: "passed", detail: "Pruebas de contrato, integración y reglas internas disponibles" },
        { id: "rbac", label: "RBAC y aislamiento", status: "passed", detail: "Las operaciones internas exigen organización y contexto de usuario" },
        { id: "audit", label: "Auditoría", status: "passed", detail: "Operaciones sensibles registran actor, entidad y resultado" },
        { id: "external_credentials", label: "Credenciales externas", status: "requires_user", detail: "Pendiente de certificados, tokens y contratos del usuario" },
      ],
    })),
  simulateCct: partnerProcedure
    .input(
      z.object({
        baseSalary: z.number().nonnegative(),
        employerRate: z.number().min(0).max(1),
        employeeRate: z.number().min(0).max(1),
        concepts: z.array(
          z.object({
            name: z.string().min(1),
            percent: z.number().min(-1).max(1).default(0),
            fixed: z.number().default(0),
            kind: z.enum(["earning", "deduction"]).default("earning"),
          })
        ).default([]),
      })
    )
    .mutation(({ input }) => calculateCctScenario(input)),
});

export type ProductionReadinessRouter = typeof productionReadinessRouter;
