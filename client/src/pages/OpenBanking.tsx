import DashboardLayout from "@/components/DashboardLayout";
import PartnerOnly from "@/components/PartnerOnly";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Banknote, Check, ChevronRight, CircleDot, Eye, EyeOff, Landmark, LockKeyhole, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const banks = [
  { id: "galicia", name: "Banco Galicia", color: "bg-orange-500", initials: "G" },
  { id: "santander", name: "Santander", color: "bg-red-600", initials: "S" },
  { id: "bbva", name: "BBVA", color: "bg-blue-700", initials: "B" },
  { id: "macro", name: "Banco Macro", color: "bg-blue-500", initials: "M" },
  { id: "mercado-pago", name: "Mercado Pago", color: "bg-cyan-500", initials: "MP" },
  { id: "otro", name: "Otra institución", color: "bg-slate-500", initials: "···" },
];

const steps = ["Elegir banco", "Autorizar acceso", "Sincronización"];

export default function OpenBanking() {
  const [step, setStep] = useState(0);
  const [bankId, setBankId] = useState<string | null>(null);
  const [account, setAccount] = useState("Cuenta corriente operativa");
  const [showSecurity, setShowSecurity] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "done">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const createConnection = trpc.banking.createConnection.useMutation({
    onSuccess: () => { setErrorMessage(null); setSyncState("done"); void utils.banking.listConnections.invalidate(); },
    onError: error => { setSyncState("idle"); setStep(1); setErrorMessage(error.message || "No se pudo registrar la conexión"); },
  });
  const bank = useMemo(() => banks.find(item => item.id === bankId), [bankId]);

  const authorize = () => {
    setErrorMessage(null);
    setStep(2);
    setSyncState("syncing");
    window.setTimeout(() => createConnection.mutate({ name: account, institution: bank?.name ?? "Institución bancaria", provider: "open_banking_simulated", accountMasked: "**** 4821", secretRef: `open-banking:${bankId ?? "unknown"}` }), 700);
  };

  return <DashboardLayout><PartnerOnly><main className="min-h-screen bg-background px-6 py-8 lg:px-10"><div className="mx-auto max-w-5xl space-y-8">
    <header className="flex flex-col gap-5 border-b border-border/60 pb-7 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary"><span className="h-2 w-2 rounded-full bg-emerald-500" />Órgano financiero · Conexión segura</div><h1 className="text-4xl font-semibold tracking-tight">Conectar una cuenta bancaria</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Un flujo guiado para autorizar la lectura de movimientos. En producción, las credenciales se ingresan dentro del widget del proveedor y nunca pasan por EDV.</p></div><Link href="/banca" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="h-4 w-4" />Volver a banca</Link></header>

    {errorMessage ? <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{errorMessage}</span><Button size="sm" variant="outline" onClick={() => { setErrorMessage(null); setStep(1); }}>Reintentar</Button></div> : null}

    <div className="grid gap-8 lg:grid-cols-[1fr_320px]"><Card className="shadow-sm"><CardContent className="p-6 sm:p-8"><div className="mb-10 flex items-start justify-between gap-2">{steps.map((label, index) => <div key={label} className="flex flex-1 items-center gap-2"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${step > index ? "bg-emerald-100 text-emerald-700" : step === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step > index ? <Check className="h-4 w-4" /> : index + 1}</div><span className={`hidden text-xs font-medium sm:block ${step === index ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>{index < steps.length - 1 ? <div className={`mx-1 h-px flex-1 ${step > index ? "bg-emerald-300" : "bg-border"}`} /> : null}</div>)}</div>

      {step === 0 ? <section className="space-y-6"><div><h2 className="text-xl font-semibold">Seleccioná tu institución</h2><p className="mt-1 text-sm text-muted-foreground">Elegí el banco o billetera que querés sincronizar con el órgano financiero.</p></div><div className="grid gap-3 sm:grid-cols-2">{banks.map(item => <button key={item.id} onClick={() => setBankId(item.id)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${bankId === item.id ? "border-primary bg-primary/[0.05] ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}><span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white ${item.color}`}>{item.initials}</span><span className="min-w-0"><span className="block text-sm font-semibold">{item.name}</span><span className="mt-1 block text-xs text-muted-foreground">Conexión protegida</span></span>{bankId === item.id ? <Check className="ml-auto h-4 w-4 text-primary" /> : <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />}</button>)}</div><Button className="w-full" onClick={() => setStep(1)} disabled={!bankId}>Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button></section> : null}

      {step === 1 ? <section className="space-y-6"><div><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white ${bank?.color}`}>{bank?.initials}</span><div><h2 className="text-xl font-semibold">Autorizar {bank?.name}</h2><p className="text-sm text-muted-foreground">El proveedor abriría su entorno seguro de autenticación.</p></div></div></div><div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-medium">EDV no recibe tu contraseña bancaria</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Esta pantalla representa el consentimiento. En una integración real, el login ocurre dentro del widget del agregador Open Banking.</p></div></div></div><div className="space-y-2"><label className="text-sm font-medium" htmlFor="account-name">Nombre de la cuenta en EDV</label><input id="account-name" value={account} onChange={event => setAccount(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" /></div><div className="space-y-3 rounded-xl border p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Permisos solicitados</p>{["Leer saldos y movimientos", "Detectar cobros para conciliación", "Recibir avisos de nuevos movimientos"].map(permission => <div key={permission} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-emerald-600" />{permission}</div>)}</div><div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Atrás</Button><Button className="flex-1" onClick={authorize} disabled={!account.trim()}>Autorizar sincronización <ArrowRight className="ml-2 h-4 w-4" /></Button></div></section> : null}

      {step === 2 ? <section className="space-y-6 text-center"><div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${syncState === "done" ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"}`}>{syncState === "done" ? <Check className="h-8 w-8" /> : <RefreshCw className="h-8 w-8 animate-spin" />}</div><div><h2 className="text-2xl font-semibold">{syncState === "done" ? "Cuenta conectada" : "Sincronizando cuenta"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{syncState === "done" ? "La cuenta quedó registrada. Los movimientos podrán llegar automáticamente y también podés revisarlos en Banca y conciliación." : "Estamos validando el consentimiento y preparando la primera sincronización."}</p></div><Progress value={syncState === "done" ? 100 : 65} className="mx-auto max-w-sm" />{syncState === "done" ? <div className="flex flex-col gap-3 sm:flex-row sm:justify-center"><Link href="/banca"><Button>Ver conexión en banca</Button></Link><Button variant="outline" onClick={() => { setStep(0); setBankId(null); setSyncState("idle"); setErrorMessage(null); }}>Conectar otra cuenta</Button></div> : <Badge variant="secondary" className="mx-auto">No cierres esta ventana</Badge>}</section> : null}
    </CardContent></Card>

    <aside className="space-y-4"><Card className="border-emerald-200 bg-emerald-50/50"><CardContent className="p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><p className="text-sm font-semibold text-emerald-900">Seguridad por diseño</p><p className="mt-1 text-xs leading-5 text-emerald-800/80">EDV guarda una referencia de conexión, no las credenciales del banco. El acceso se revoca desde el proveedor.</p></div></div></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Qué ocurre después</CardTitle></CardHeader><CardContent className="space-y-4 text-sm text-muted-foreground"><div className="flex gap-3"><CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>El Treasury Agent recibe movimientos normalizados.</p></div><div className="flex gap-3"><WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Accounts Receivable propone coincidencias con facturas.</p></div><div className="flex gap-3"><Banknote className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Una persona confirma los casos ambiguos.</p></div></CardContent></Card><button onClick={() => setShowSecurity(!showSecurity)} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">{showSecurity ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {showSecurity ? "Ocultar" : "Ver"} detalle de seguridad</button>{showSecurity ? <p className="text-xs leading-5 text-muted-foreground">En producción, el proveedor debe emitir tokens revocables, validar webhooks firmados y limitar permisos a lectura. La simulación no representa una autorización bancaria real.</p> : null}</aside>
    </div>
  </div></main></PartnerOnly></DashboardLayout>;
}
