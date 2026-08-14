import { useState } from "react";
import { Bot, Network, Send, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export default function DnaAssistant() {
  const [question, setQuestion] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "Hola, soy EDV-AI. Pregúntame cualquier criterio institucional, regla fiscal o política laboral de tu estudio." }
  ]);

  const askMutation = trpc.edvAdvanced.askDnaAssistant.useMutation();
  const vectorQuery = trpc.edvAdvanced.vectorNetworkGraph.useQuery();

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question;
    setQuestion("");
    setChatLog(prev => [...prev, { role: "user", text: q }]);
    try {
      const res = await askMutation.mutateAsync({ question: q });
      const answerStr = typeof res.answer === "string" ? res.answer : JSON.parse(JSON.stringify(res.answer));
      setChatLog(prev => [...prev, { role: "assistant", text: String(answerStr) }]);
    } catch {
      toast.error("No se pudo consultar el ADN Organizacional");
    }
  };

  return <DashboardLayout>
    <div className="min-h-screen bg-[#f6f8fb] px-1 pb-10 text-[#10253f] sm:px-4">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <header className="flex flex-col justify-between gap-4 pt-2 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> EDV · Inteligencia institucional</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Asistente y red vectorial del ADN</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Consulta en lenguaje natural los criterios del estudio contable y visualiza la red de reglas que gobierna las células.</p>
          </div>
          <Badge variant="outline" className="w-fit border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> RAG Institucional Activo</Badge>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-blue-100 bg-white/95 shadow-sm">
            <CardHeader><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-blue-600"><Bot className="h-4 w-4" /> EDV-AI Assistant</div><CardTitle className="text-xl">Consulta natural del ADN</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[380px] overflow-y-auto space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                {chatLog.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-6 ${msg.role === "user" ? "bg-[#102c4b] text-white" : "bg-white border border-slate-200 text-slate-700 shadow-sm"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAsk} className="flex gap-2">
                <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ej: ¿Cuál es el tratamiento para deducciones de autónomos?" className="h-11" />
                <Button type="submit" disabled={askMutation.isPending} className="h-11 bg-[#102c4b] px-6 text-white hover:bg-[#173d64]"><Send className="h-4 w-4" /></Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/95 shadow-sm">
            <CardHeader><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.17em] text-violet-600"><Network className="h-4 w-4" /> Topología vectorial</div><CardTitle className="text-xl">Red institucional de ADN</CardTitle><p className="text-sm text-slate-500">{vectorQuery.data?.nodes?.length ?? 0} nodos de reglas y políticas indexadas.</p></CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-y-auto space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                {vectorQuery.data?.nodes?.map(node => (
                  <div key={node.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{node.label}</p>
                        <p className="text-xs text-slate-400 capitalize">Grupo: {node.group}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">Vectorizado</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </DashboardLayout>;
}
