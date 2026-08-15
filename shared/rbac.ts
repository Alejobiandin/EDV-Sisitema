export type EdvRole = "partner" | "client";

export type EdvRolePolicy = {
  label: string;
  description: string;
  canApprove: boolean;
  canSign: boolean;
  canViewAllClients: boolean;
  canManageBanking: boolean;
  menu: string[];
};

export const EDV_ROLE_POLICIES: Record<EdvRole, EdvRolePolicy> = {
  partner: {
    label: "Socio / CPN",
    description: "Dirección, aprobación de riesgos y firma profesional.",
    canApprove: true,
    canSign: true,
    canViewAllClients: true,
    canManageBanking: true,
    menu: ["Centro de mando", "Órganos operativos", "Clientes y empleados", "Banca y conciliación", "Aprobaciones", "ADN Organizacional"],
  },
  client: {
    label: "Cliente final",
    description: "Acceso limitado a su empresa, reportes y documentos compartidos.",
    canApprove: false,
    canSign: false,
    canViewAllClients: false,
    canManageBanking: false,
    menu: ["Resumen de mi empresa", "Facturas", "Reportes", "Documentos compartidos", "Soporte EDV"],
  },
};

export function getEdvRolePolicy(role: EdvRole) {
  return EDV_ROLE_POLICIES[role];
}

export function resolveEdvRole(role: string | null | undefined): EdvRole {
  return role === "client" ? "client" : "partner";
}

export function canManageSensitiveOperations(role: string | null | undefined) {
  return role === "admin" || role === "partner";
}
