import { useEffect, useMemo, useRef, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, FileSpreadsheet, Plus, Upload, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

const taxCategories = ["Responsable Inscripto", "Monotributo", "Exento", "Consumidor Final"];

export default function ClientRegistry() {
  const [clientSearch, setClientSearch] = useState("");
  const [clientCategoryFilter, setClientCategoryFilter] = useState("all");
  const [employeeSearch, setEmployeeSearch] = useState("");

  const clientsQuery = trpc.edvManagement.listClients.useQuery({
    search: clientSearch || undefined,
    category: clientCategoryFilter,
  });
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>();
  const employeesQuery = trpc.edvManagement.listEmployees.useQuery(
    { clientId: selectedClientId, search: employeeSearch || undefined },
    { enabled: Boolean(selectedClientId) },
  );
  const utils = trpc.useUtils();
  const createClient = trpc.edvManagement.createClient.useMutation();
  const createEmployee = trpc.edvManagement.createEmployee.useMutation();
  const bulkImport = trpc.edvManagement.bulkImportEmployees.useMutation();
  const bulkImportClients = trpc.edvManagement.bulkImportClients.useMutation();

  const [clientName, setClientName] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [clientTaxCategory, setClientTaxCategory] = useState(taxCategories[0]);
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeTaxId, setEmployeeTaxId] = useState("");
  const [employeeSalary, setEmployeeSalary] = useState("");
  const [employeeCct, setEmployeeCct] = useState("");
  const [csvText, setCsvText] = useState("");
  const [clientCsvText, setClientCsvText] = useState("Corporación Alfa S.A., 30-71112223-4, Responsable Inscripto");
  const [importSummary, setImportSummary] = useState<{ importedCount: number; errorsCount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedClientId && clientsQuery.data?.[0]) setSelectedClientId(clientsQuery.data[0].id);
  }, [clientsQuery.data, selectedClientId]);

  const selectedClient = useMemo(() => clientsQuery.data?.find(client => client.id === selectedClientId), [clientsQuery.data, selectedClientId]);

  const handleCreateClient = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createClient.mutateAsync({ name: clientName, taxId: clientTaxId, taxCategory: clientTaxCategory, email: clientEmail, phone: clientPhone });
      await utils.edvManagement.listClients.invalidate();
      setClientName(""); setClientTaxId(""); setClientEmail(""); setClientPhone("");
      toast.success("Cliente incorporado a la memoria operativa de EDV");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el cliente");
    }
  };

  const handleCreateEmployee = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClientId) { toast.error("Selecciona un cliente antes de incorporar empleados"); return; }
    try {
      await createEmployee.mutateAsync({ clientId: selectedClientId, fullName: employeeName, taxIdNumber: employeeTaxId, baseSalary: Number(employeeSalary), cct: employeeCct });
      await utils.edvManagement.listEmployees.invalidate();
      setEmployeeName(""); setEmployeeTaxId(""); setEmployeeSalary(""); setEmployeeCct("");
      toast.success("Empleado incorporado al padrón laboral");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el empleado");
    }
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!selectedClientId) { toast.error("Selecciona un cliente para asociar la nómina"); return; }
    if (!csvText.trim()) { toast.error("Selecciona un archivo CSV o pega su contenido"); return; }
    try {
      const result = await bulkImport.mutateAsync({ clientId: selectedClientId, csvContent: csvText });
      setImportSummary({ importedCount: result.importedCount, errorsCount: result.errorsCount });
      await utils.edvManagement.listEmployees.invalidate();
      toast.success(`Carga finalizada: ${result.importedCount} empleados incorporados`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo procesar la carga masiva");
    }
  };

  return <DashboardLayout>
    <div className="min-h-screen bg-[#f6f8fb] px-1 pb-10 text-[#10253f] sm:px-4">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <header className="flex flex-col justify-between gap-4 pt-2 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> EDV · Maestros operativos</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Clientes y empleados</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Prepara la información estructural que las células de EDV utilizarán para declaraciones juradas, liquidaciones y reportes periódicos.</p>
          </div>
          <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Datos listos para automatización</Badge>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200/80 bg-white/95 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><BriefcaseBusiness className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Clientes activos</p><p className="mt-1 text-2xl font-semibold">{clientsQuery.data?.length ?? 0}</p></div></CardContent></Card>
          <Card className="border-slate-200/80 bg-white/95 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-violet-50 p-3 text-violet-700"><UsersRound className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Empleados visibles</p><p className="mt-1 text-2xl font-semibold">{employeesQuery.data?.length ?? 0}</p></div></CardContent></Card>
          <Card className="border-slate-200/80 bg-[#102c4b] text-white shadow-sm"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-200">Preparación DDJJ</p><p className="mt-2 text-sm leading-6 text-blue-100/80">Cada alta queda disponible para los agentes fiscales y de nómina, con trazabilidad en la base institucional.</p></CardContent></Card>
        </section>

        <Tabs defaultValue="clients" className="space-y-5">
          <TabsList className="grid w-full max-w-xl grid-cols-2 bg-white p-1 shadow-sm"><TabsTrigger value="clients">Clientes</TabsTrigger><TabsTrigger value="employees">Empleados y carga masiva</TabsTrigger></TabsList>
          <TabsContent value="clients" className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-6">
              <Card className="border-blue-100 bg-white/95 shadow-sm"><CardHeader><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-blue-600"><Plus className="h-3.5 w-3.5" /> Alta individual</div><CardTitle className="mt-2 text-xl">Nuevo cliente</CardTitle></CardHeader><CardContent><form onSubmit={handleCreateClient} className="space-y-3"><label className="block text-xs font-semibold text-slate-600">Razón social / nombre<Input required value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1.5" /></label><label className="block text-xs font-semibold text-slate-600">CUIT / identificación fiscal<Input required value={clientTaxId} onChange={e => setClientTaxId(e.target.value)} className="mt-1.5" placeholder="30-00000000-0" /></label><label className="block text-xs font-semibold text-slate-600">Condición fiscal<select value={clientTaxCategory} onChange={e => setClientTaxCategory(e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{taxCategories.map(category => <option key={category}>{category}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600">Correo<Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="mt-1.5" /></label><label className="block text-xs font-semibold text-slate-600">Teléfono<Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="mt-1.5" /></label></div><Button type="submit" className="w-full bg-[#102c4b] hover:bg-[#173d64]" disabled={createClient.isPending}>{createClient.isPending ? "Guardando…" : "Incorporar cliente"}</Button></form></CardContent></Card>
              <Card className="border-emerald-100 bg-emerald-50/40 shadow-sm"><CardHeader><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-emerald-700"><FileSpreadsheet className="h-3.5 w-3.5" /> Carga masiva</div><CardTitle className="mt-2 text-xl">Importar clientes CSV</CardTitle><p className="text-sm leading-6 text-slate-600">Formato: <strong>Razón Social, CUIT, Condición Fiscal, Correo, Teléfono</strong>.</p></CardHeader><CardContent className="space-y-3"><textarea value={clientCsvText} onChange={e => setClientCsvText(e.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none ring-emerald-200 focus:ring-2" /><Button type="button" disabled={bulkImportClients.isPending} onClick={async () => {
                try {
                  const res = await bulkImportClients.mutateAsync({ csvContent: clientCsvText });
                  await utils.edvManagement.listClients.invalidate();
                  toast.success(`Clientes importados: ${res.importedCount} (${res.errorsCount} con error)`);
                } catch(e) { toast.error("Error importando clientes"); }
              }} className="w-full bg-emerald-700 text-white hover:bg-emerald-800">{bulkImportClients.isPending ? "Procesando…" : "Procesar clientes CSV"}</Button></CardContent></Card>
            </div>
            <Card className="border-slate-200/80 bg-white/95 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3">
                  <CardTitle className="text-xl">Padrón de clientes</CardTitle>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Buscar por nombre o CUIT..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                    <select value={clientCategoryFilter} onChange={e => setClientCategoryFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="all">Todas las condiciones</option>
                      {taxCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {clientsQuery.data?.length ? clientsQuery.data.map(client => (
                    <button type="button" key={client.id} onClick={() => setSelectedClientId(client.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selectedClientId === client.id ? "border-blue-300 bg-blue-50/70" : "border-slate-100 bg-white hover:bg-slate-50"}`}>
                      <div className="rounded-xl bg-slate-100 p-2 text-slate-600"><BriefcaseBusiness className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700">{client.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{client.taxId} · {client.taxCategory}</p>
                      </div>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">{client.status === "active" ? "Activo" : client.status}</Badge>
                    </button>
                  )) : <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">No se encontraron clientes con los filtros aplicados.</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="employees" className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-6"><Card className="border-violet-100 bg-white/95 shadow-sm"><CardHeader><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-violet-600"><UserRound className="h-3.5 w-3.5" /> Alta individual</div><CardTitle className="mt-2 text-xl">Nuevo empleado</CardTitle><p className="text-sm text-slate-500">Cliente seleccionado: {selectedClient?.name ?? "ninguno"}</p></CardHeader><CardContent><form onSubmit={handleCreateEmployee} className="space-y-3"><label className="block text-xs font-semibold text-slate-600">Nombre completo<Input required value={employeeName} onChange={e => setEmployeeName(e.target.value)} className="mt-1.5" /></label><label className="block text-xs font-semibold text-slate-600">CUIL / identificación laboral<Input required value={employeeTaxId} onChange={e => setEmployeeTaxId(e.target.value)} className="mt-1.5" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600">Sueldo básico<Input required type="number" min="0" value={employeeSalary} onChange={e => setEmployeeSalary(e.target.value)} className="mt-1.5" /></label><label className="block text-xs font-semibold text-slate-600">Convenio CCT<Input value={employeeCct} onChange={e => setEmployeeCct(e.target.value)} className="mt-1.5" placeholder="Comercio General" /></label></div><Button type="submit" className="w-full bg-[#102c4b] hover:bg-[#173d64]" disabled={createEmployee.isPending || !selectedClientId}>{createEmployee.isPending ? "Guardando…" : "Incorporar empleado"}</Button></form></CardContent></Card><Card className="border-emerald-100 bg-emerald-50/40 shadow-sm"><CardHeader><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-emerald-700"><FileSpreadsheet className="h-3.5 w-3.5" /> Importación masiva</div><CardTitle className="mt-2 text-xl">Cargar nómina CSV</CardTitle><p className="text-sm leading-6 text-slate-600">Formato: <strong>Nombre Completo, CUIL/CUIT, Sueldo Básico, CCT</strong>. La primera fila puede contener encabezados.</p></CardHeader><CardContent className="space-y-3"><input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white" /><textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="Ana Pérez, 20-12345678-9, 850000, Comercio General" className="min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none ring-emerald-200 focus:ring-2" /><div className="flex flex-wrap items-center justify-between gap-3"><Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2"><Upload className="h-4 w-4" /> Seleccionar CSV</Button><Button type="button" onClick={handleBulkImport} disabled={bulkImport.isPending || !selectedClientId} className="bg-emerald-700 text-white hover:bg-emerald-800">{bulkImport.isPending ? "Procesando…" : "Procesar nómina"}</Button></div>{importSummary && <div className="rounded-xl bg-white p-3 text-sm text-slate-600"><strong>Resultado:</strong> {importSummary.importedCount} incorporados · {importSummary.errorsCount} con error</div>}</CardContent></Card></div>
            <Card className="border-slate-200/80 bg-white/95 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3">
                  <CardTitle className="text-xl">Nómina de {selectedClient?.name ?? "cliente seleccionado"}</CardTitle>
                  <Input placeholder="Buscar por empleado, CUIL o CCT..." value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {employeesQuery.data?.length ? employeesQuery.data.map(employee => (
                    <div key={employee.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                      <div className="rounded-xl bg-violet-50 p-2 text-violet-700"><UserRound className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700">{employee.fullName}</p>
                        <p className="mt-1 text-xs text-slate-500">{employee.taxIdNumber} · CCT: {employee.cct ?? "Sin convenio"}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">${Number(employee.baseSalary).toLocaleString("es-AR")}</p>
                    </div>
                  )) : <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">No se encontraron empleados con los filtros aplicados.</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </DashboardLayout>;
}
