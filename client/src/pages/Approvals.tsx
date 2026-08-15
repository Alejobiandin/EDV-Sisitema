import DashboardLayout from "@/components/DashboardLayout";
import PartnerOnly from "@/components/PartnerOnly";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Check, CheckCircle2, Download, FileCheck2, FileText, Fingerprint, Loader2, LockKeyhole, ShieldCheck, Stamp, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const balanceRows = [
  ["Activo corriente", "$ 18.420.000"],
  ["Activo no corriente", "$ 42.880.000"],
  ["Pasivo corriente", "$ 9.760.000"],
  ["Patrimonio neto", "$ 51.540.000"],
];

export default function Approvals() {
  const [signatureState, setSignatureState] = useState<"idle" | "signing" | "signed">("idle");
  const [reviewed, setReviewed] = useState(false);

  const signDocument = () => {
    setSignatureState("signing");
    window.setTimeout(() => setSignatureState("signed"), 1200);
  };

  return <DashboardLayout><PartnerOnly><main className="min-h-screen bg-background px-6 py-8 lg:px-10"><div className="mx-auto max-w-7xl space-y-8">
    <header className="flex flex-col gap-5 border-b border-border/60 pb-7 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary"><span className="h-2 w-2 rounded-full bg-emerald-500" />EDV · HITL · Firma profesional</div><h1 className="text-4xl font-semibold tracking-tight">Aprobación de documentos</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">El contador revisa el balance, confirma los controles y recién entonces solicita la firma digital. El flujo queda registrado para auditoría.</p></div><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" />Volver al centro de mando</Link></header>

    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><Card className="overflow-hidden border-border/70 shadow-sm"><CardHeader className="border-b bg-muted/20"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><FileText className="h-6 w-6" /></div><div><CardTitle className="text-xl">Balance General · Ejercicio 2025</CardTitle><p className="mt-1 text-sm text-muted-foreground">EDV-REP-2025-0042 · preparado por Financial Close &amp; Controls Agent</p></div></div><Badge variant={signatureState === "signed" ? "default" : "secondary"}>{signatureState === "signed" ? "Firmado" : "Pendiente de aprobación"}</Badge></div></CardHeader><CardContent className="space-y-6 p-6"><div className="grid gap-3 sm:grid-cols-3"><Summary label="Activo total" value="$ 61.300.000" /><Summary label="Pasivo total" value="$ 9.760.000" /><Summary label="Resultado" value="$ 8.420.000" tone="text-emerald-700" /></div><div className="overflow-hidden rounded-xl border"><table className="w-full text-sm"><thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Rubro</th><th className="px-4 py-3 text-right">Importe</th></tr></thead><tbody className="divide-y">{balanceRows.map(row => <tr key={row[0]}><td className="px-4 py-3 font-medium">{row[0]}</td><td className="px-4 py-3 text-right font-mono">{row[1]}</td></tr>)}</tbody></table></div><div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4"><div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">Vista documental previa</p><p className="mt-1 text-xs leading-5 text-muted-foreground">El PDF completo, notas y anexos se generarían desde el servicio de reportes antes de invocar el proveedor de firma.</p></div><Button variant="outline" size="sm" className="ml-auto shrink-0"><Download className="mr-2 h-3.5 w-3.5" />PDF</Button></div></div></CardContent></Card>

      <div className="space-y-6"><Card className="border-amber-200 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-amber-600" />Checklist del contador</CardTitle></CardHeader><CardContent className="space-y-3">{["Balance cuadra: Activo = Pasivo + Patrimonio", "Subdiarios conciliados con el mayor", "Período y empresa correctamente identificados", "Notas y documentación de respaldo disponibles"].map((item, index) => <button key={item} onClick={() => index === 0 && setReviewed(!reviewed)} className="flex w-full items-start gap-3 text-left"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${index === 0 && reviewed ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"}`}>{index === 0 && reviewed ? <Check className="h-3.5 w-3.5" /> : null}</span><span className="text-sm leading-5">{item}</span></button>)}<p className="pt-2 text-xs leading-5 text-muted-foreground">En esta demo, solo el primer control es interactivo. En producción, cada control proviene de una evidencia auditable.</p></CardContent></Card>

      <Card className={`shadow-sm ${signatureState === "signed" ? "border-emerald-200 bg-emerald-50/40" : "border-primary/20"}`}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Fingerprint className="h-5 w-5 text-primary" />Firma digital</CardTitle></CardHeader><CardContent className="space-y-4">{signatureState === "signed" ? <div className="space-y-4"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /><div><p className="font-semibold text-emerald-800">Documento firmado correctamente</p><p className="mt-1 text-xs leading-5 text-emerald-800/75">Hash SHA-256: 2b9c…a481 · Firmante: Socio / CPN · evento auditado</p></div></div><div className="rounded-xl border border-emerald-200 bg-white/70 p-3 text-xs text-muted-foreground"><div className="flex items-center gap-2"><Stamp className="h-4 w-4 text-emerald-600" />Sello de tiempo y certificado preparados para el proveedor homologado.</div></div><Button variant="outline" className="w-full" onClick={() => setSignatureState("idle")}>Volver a revisión</Button></div> : <><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p className="text-sm leading-5 text-muted-foreground">La firma real se ejecutará con el certificado X.509 del profesional. Esta demo representa el consentimiento y el feedback del proceso.</p></div>{signatureState === "signing" ? <><Progress value={72} /><div className="flex items-center justify-center gap-2 text-xs text-primary"><Loader2 className="h-3.5 w-3.5 animate-spin" />Validando certificado y generando evidencia…</div></> : <Button className="w-full" onClick={signDocument} disabled={!reviewed}><Fingerprint className="mr-2 h-4 w-4" />Aplicar firma digital simulada</Button>}<p className="text-center text-[11px] text-muted-foreground">{reviewed ? "Checklist confirmado por el contador" : "Confirmá el primer control para habilitar la firma"}</p></>}</CardContent></Card></div>
    </div>

    <Card className="border-slate-200 bg-slate-50/70"><CardContent className="flex items-start gap-3 p-5"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /><div><p className="text-sm font-semibold">Alcance de esta pantalla</p><p className="mt-1 text-xs leading-5 text-muted-foreground">El botón es una simulación visual: no produce una firma legal ni reemplaza el certificado, el proveedor homologado o la revisión profesional necesarios para una operación real.</p></div><X className="ml-auto h-4 w-4 text-slate-400" /></CardContent></Card>
  </div></main></PartnerOnly></DashboardLayout>;
}

function Summary({ label, value, tone = "" }: { label: string; value: string; tone?: string }) { return <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className={`mt-2 text-lg font-semibold ${tone}`}>{value}</p></div>; }
