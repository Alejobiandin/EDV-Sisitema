import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { organizationMembers } from "../drizzle/schema";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";

type AccessLevel = "read" | "write" | "admin";

const writeRoles = new Set(["owner", "partner", "accountant"]);
const adminRoles = new Set(["owner", "partner"]);

export async function assertOrganizationAccess(
  ctx: TrpcContext,
  organizationId: number,
  level: AccessLevel = "read"
) {
  if (!ctx.user)
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión requerida" });
  if (!Number.isInteger(organizationId) || organizationId <= 0)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Organización inválida",
    });

  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Base de datos no disponible",
    });

  // Admin y Socio/CPN globales conservan capacidad de gestión de la cartera; los clientes y roles internos quedan limitados a su membresía explícita.
  if (ctx.user.role === "admin")
    return { organizationId, roleInOrg: "global_admin" } as const;
  if (ctx.user.role === "partner")
    return { organizationId, roleInOrg: "global_partner" } as const;

  const memberships = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, ctx.user.id)
      )
    )
    .limit(1);
  const membership = memberships[0];

  if (!membership)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "El usuario no pertenece a esta organización",
    });
  if (level === "write" && !writeRoles.has(membership.roleInOrg))
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "El rol no puede modificar esta organización",
    });
  if (level === "admin" && !adminRoles.has(membership.roleInOrg))
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Se requiere rol owner o partner dentro de la organización",
    });

  return { organizationId, roleInOrg: membership.roleInOrg } as const;
}
