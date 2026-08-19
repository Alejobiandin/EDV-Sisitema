import { z } from "zod";
import { partnerProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { organizations, organizationMembers } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { assertOrganizationAccess } from "../organizationAccess";

export const organizationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    if (ctx.user.role === "admin" || ctx.user.role === "partner") {
      return db.select().from(organizations).orderBy(desc(organizations.createdAt));
    }
    const memberships = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, ctx.user.id));
    const orgIds = memberships.map(m => m.organizationId);
    if (!orgIds.length) return [];
    const allOrgs = await db.select().from(organizations);
    return allOrgs.filter(org => orgIds.includes(org.id));
  }),

  create: partnerProcedure
    .input(z.object({ name: z.string().min(2), taxId: z.string().min(5) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      const inserted = await db.insert(organizations).values({ name: input.name, taxId: input.taxId });
      const orgId = Number(inserted[0].insertId);
      await db.insert(organizationMembers).values({ organizationId: orgId, userId: ctx.user.id, roleInOrg: "owner" });
      return { success: true, organizationId: orgId };
    }),

  assignMember: partnerProcedure
    .input(z.object({ organizationId: z.number(), userId: z.number(), roleInOrg: z.enum(["owner", "partner", "accountant", "client_viewer"]) }))
    .mutation(async ({ input, ctx }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "admin");
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      await db.insert(organizationMembers).values(input);
      return { success: true };
    }),
});
