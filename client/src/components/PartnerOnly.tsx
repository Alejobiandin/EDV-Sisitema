import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function PartnerOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isPreview = import.meta.env.DEV && !user;
  const canAccess = isPreview || user?.role === "admin" || user?.role === "partner";

  if (canAccess) return <>{children}</>;

  return <div className="flex min-h-[60vh] items-center justify-center p-6"><div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><ShieldAlert className="h-6 w-6" /></div><h1 className="mt-5 text-xl font-semibold text-amber-950">Acceso restringido</h1><p className="mt-2 text-sm leading-6 text-amber-900/75">Esta operación requiere el perfil Socio / CPN. El Cliente Final puede consultar reportes y documentos compartidos, pero no conectar bancos, aprobar ni firmar.</p><Link href="/"><Button variant="outline" className="mt-6 border-amber-300 bg-white"><LockKeyhole className="mr-2 h-4 w-4" />Volver al inicio</Button></Link></div></div>;
}
