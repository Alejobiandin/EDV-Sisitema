import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowDownLeft, ArrowUpRight, Building2, Check, FileUp, Landmark, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";

function parseCsv(content: string) {
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const header = lines[0]?.toLowerCase() ?? "";
  const start = header.includes("external") || header.includes("fecha") ? 1 : 0;
  return lines.slice(start).map(line => {
    const [externalId, bookedAt, description, amount, direction] = line.split(",").map(value => value.trim());
    return { externalId, bookedAt, description, amount: Number(amount?.replace("$", "").replace(".", "").replace(",", ".")), direction: direction === "debit" ? "debit" as const : "credit" as const };
  }).filter(row => row.externalId && Number.isFinite(row.amount) && row.bookedAt);
}

export default function Banking() {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string>("");
  const [form, setForm] = useState({ name: "", institution: "", provider: "manual_csv", accountMasked: "", secretRef: "edv-bank-feed" });
  const [message, setMessage] = useState<string | null>(null);
  const connections = trpc.banking.listConnections.useQuery(undefined, { refetchInterval: 30000 });
  const transactions = trpc.banking.listTransactions.useQuery({ status: "unmatched" }, { refetchInterval: 15000 });
  const invoices = trpc.banking.listInvoices.useQuery();
  const createConnection = trpc.banking.createConnection.useMutation({ onSuccess: () => { setMessage("Conexión registrada. Ya podés importar el primer feed."); setForm({ name: "", institution: "", provider: "manual_csv", accountMasked: "", secretRef: "edv-bank-feed" }); void utils.banking.listConnections.invalidate(); } });
  const importFeed = trpc.banking.importFeed.useMutation({ onSuccess: result => { setMessage(`${result.importedCount} movimientos procesados de forma idempotente.`); void utils.banking.listTransactions.invalidate(); void utils.banking.listConnections.invalidate(); } });
  const reconcile = trpc.banking.reconcile.useMutation({ onSuccess: () => { setMessage("Movimiento conciliado. La factura pasó a pagada y se registró auditoría."); setSelectedTransaction(null); setSelectedInvoice(""); void utils.banking.listTransactions.invalidate(); void utils.banking.listInvoices.invalidate(); } });
  const pendingInvoices = useMemo(() => (invoices.data ?? []).filter(invoice => invoice.status === "pending"), [invoices.data]);

  const handleFile = (file: File) => {
    if (!selectedConnection) { setMessage("Seleccioná una conexión antes de importar movimientos."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCsv(String(reader.result));
        if (!parsed.length) throw new Error("El CSV no contiene movimientos válidos");
        importFeed.mutate({ connectionId: Number(selectedConnection), transactions: parsed });
      } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo leer el feed"); }
    };
    reader.readAsText(file);
  };

  return <DashboardLayout><main className="min-h-screen bg-background px-6 py-8 lg:px-10"><div className="mx-auto max-w-7xl space-y-8">
    <header className="flex flex-col gap-5 border-b border-border/60 pb-7 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary"><span className="h-2 w-2 rounded-full bg-emerald-500" />Órgano financiero · Conciliación</div><h1 className="text-4xl font-semibold tracking-tight">Feeds bancarios y cobranzas</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Importá movimientos de un proveedor bancario o CSV, mantené el estado idempotente y conciliá contra facturas con aprobación explícita.</p></div><div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"><ShieldCheck className="h-4 w-4" />Sin credenciales bancarias expuestas</div></header>

    {message ? <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm text-primary">{message}</div> : null}

    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-5 w-5 text-primary" />Conexiones bancarias</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Conexión activa</Label><Select value={selectedConnection} onValueChange={setSelectedConnection}><SelectTrigger><SelectValue placeholder="Elegir cuenta o feed" /></SelectTrigger><SelectContent>{(connections.data ?? []).map(connection => <SelectItem key={connection.id} value={String(connection.id)}>{connection.name} · {connection.institution} ({connection.status})</SelectItem>)}</SelectContent></Select></div><div className="flex flex-wrap gap-2">{(connections.data ?? []).map(connection => <Badge variant={connection.status === "active" ? "default" : "secondary"} key={connection.id}>{connection.provider} · {connection.accountMasked || "cuenta protegida"}</Badge>)}</div><div className="grid gap-3 border-t pt-4 sm:grid-cols-2"><div className="space-y-2"><Label>Nombre interno</Label><Input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Cuenta operativa" /></div><div className="space-y-2"><Label>Institución</Label><Input value={form.institution} onChange={event => setForm({ ...form, institution: event.target.value })} placeholder="Banco / proveedor" /></div><div className="space-y-2"><Label>Cuenta enmascarada</Label><Input value={form.accountMasked} onChange={event => setForm({ ...form, accountMasked: event.target.value })} placeholder="**** 1234" /></div><div className="space-y-2"><Label>Referencia de secreto</Label><Input value={form.secretRef} onChange={event => setForm({ ...form, secretRef: event.target.value })} /></div></div><Button className="w-full" onClick={() => createConnection.mutate(form)} disabled={createConnection.isPending || !form.name || !form.institution}><Building2 className="mr-2 h-4 w-4" />Registrar conexión</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileUp className="h-5 w-5 text-primary" />Importar feed</CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-6 text-center"><Upload className="mx-auto h-7 w-7 text-primary" /><p className="mt-3 text-sm font-medium">CSV de movimientos bancarios</p><p className="mt-1 text-xs text-muted-foreground">externalId, bookedAt, description, amount, direction</p><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={event => event.target.files?.[0] && handleFile(event.target.files[0])} /><Button variant="outline" className="mt-4" onClick={() => fileRef.current?.click()} disabled={importFeed.isPending || !selectedConnection}>{importFeed.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Seleccionar CSV</Button></div><p className="text-xs leading-5 text-muted-foreground">La clave externalId evita duplicados. La importación no modifica movimientos ya conciliados.</p></CardContent></Card></section>

    <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"><Card><CardHeader><CardTitle className="flex items-center justify-between text-base"><span>Movimientos pendientes</span><Badge variant="secondary">{transactions.data?.length ?? 0}</Badge></CardTitle></CardHeader><CardContent className="p-0"><div className="divide-y">{transactions.data?.length ? transactions.data.map(transaction => <button key={transaction.id} onClick={() => { setSelectedTransaction(transaction.id); setSelectedInvoice(""); }} className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 ${selectedTransaction === transaction.id ? "bg-primary/[0.06]" : ""}`}><div className="flex min-w-0 items-center gap-3">{transaction.direction === "credit" ? <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-600" /> : <ArrowUpRight className="h-4 w-4 shrink-0 text-rose-600" />}<div className="min-w-0"><p className="truncate text-sm font-medium">{transaction.description || "Movimiento sin descripción"}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(transaction.bookedAt).toLocaleDateString()} · {transaction.externalId}</p></div></div><span className={`shrink-0 font-mono text-sm font-semibold ${transaction.direction === "credit" ? "text-emerald-700" : "text-rose-700"}`}>{transaction.direction === "credit" ? "+" : "−"}{transaction.amount}</span></button>) : <div className="p-8 text-center text-sm text-muted-foreground">No hay movimientos pendientes de conciliación.</div>}</div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Conciliar contra factura</CardTitle></CardHeader><CardContent className="space-y-4">{selectedTransaction ? <><p className="text-sm text-muted-foreground">Seleccioná la factura que corresponde al movimiento elegido. EDV actualizará el estado y registrará la decisión en auditoría.</p><Select value={selectedInvoice} onValueChange={setSelectedInvoice}><SelectTrigger><SelectValue placeholder="Elegir factura pendiente" /></SelectTrigger><SelectContent>{pendingInvoices.map(invoice => <SelectItem key={invoice.id} value={String(invoice.id)}>Factura #{invoice.id} · ${invoice.amount} · cliente {invoice.clientId}</SelectItem>)}</SelectContent></Select><Button className="w-full" onClick={() => selectedInvoice && reconcile.mutate({ transactionId: selectedTransaction, invoiceId: Number(selectedInvoice) })} disabled={!selectedInvoice || reconcile.isPending}><Check className="mr-2 h-4 w-4" />Confirmar conciliación</Button><p className="text-xs leading-5 text-muted-foreground">Esta acción requiere criterio humano y queda asociada al usuario autenticado.</p></> : <div className="py-8 text-center"><Check className="mx-auto h-8 w-8 text-muted-foreground/40" /><p className="mt-3 text-sm font-medium">Elegí un movimiento</p><p className="mt-1 text-xs text-muted-foreground">La cola de revisión aparecerá aquí.</p></div>}</CardContent></Card></section>
  </div></main></DashboardLayout>;
}
