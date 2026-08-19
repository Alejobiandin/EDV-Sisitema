import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { edvClients, edvEmployees } from "../../drizzle/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { assertOrganizationAccess } from "../organizationAccess";

export type EmployeeCsvRow = { fullName: string; taxIdNumber: string; baseSalary: number; cct: string };
export type ClientCsvRow = { name: string; taxId: string; taxCategory: string; email?: string; phone?: string };

export function parseEmployeeCsv(csvContent: string) {
  const rows: EmployeeCsvRow[] = [];
  const errors: { line: number; message: string }[] = [];
  const lines = csvContent.split("\n").map(l => l.trim()).filter(Boolean);

  lines.forEach((line, index) => {
    if (index === 0 && line.toLowerCase().includes("nombre")) return;
    const parts = line.split(",").map(p => p.trim());
    if (parts.length < 3) {
      errors.push({ line: index + 1, message: "Se requieren nombre, CUIL/CUIT y sueldo básico" });
      return;
    }
    const [fullName, taxIdNumber, baseSalaryStr, cct] = parts;
    const normalizedSalary = baseSalaryStr.replace(/[$.\s]/g, "").replace(",", ".");
    const baseSalary = Number(normalizedSalary);
    if (!fullName || !taxIdNumber || !Number.isFinite(baseSalary) || baseSalary <= 0) {
      errors.push({ line: index + 1, message: "Nombre, identificación y sueldo deben ser válidos" });
      return;
    }
    rows.push({ fullName, taxIdNumber, baseSalary, cct: cct || "Comercio General" });
  });

  return { rows, errors };
}

export function parseClientCsv(csvContent: string) {
  const rows: ClientCsvRow[] = [];
  const errors: { line: number; message: string }[] = [];
  const lines = csvContent.split("\n").map(l => l.trim()).filter(Boolean);

  lines.forEach((line, index) => {
    if (index === 0 && (line.toLowerCase().includes("razón") || line.toLowerCase().includes("nombre"))) return;
    const parts = line.split(",").map(p => p.trim());
    if (parts.length < 2) {
      errors.push({ line: index + 1, message: "Se requieren al menos razón social y CUIT" });
      return;
    }
    const [name, taxId, taxCategory, email, phone] = parts;
    if (!name || !taxId) {
      errors.push({ line: index + 1, message: "Razón social y CUIT son obligatorios" });
      return;
    }
    rows.push({
      name,
      taxId,
      taxCategory: taxCategory || "Responsable Inscripto",
      email: email || undefined,
      phone: phone || undefined,
    });
  });

  return { rows, errors };
}

export const edvManagementRouter = router({
  listClients: protectedProcedure
    .input(z.object({ organizationId: z.number().int().positive().default(1), search: z.string().optional(), category: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const organizationId = input?.organizationId ?? 1;
      await assertOrganizationAccess(ctx, organizationId, "read");
      const db = await getDb();
      if (!db) return [];
      let query = db.select().from(edvClients);
      const list = await query.where(eq(edvClients.organizationId, organizationId)).orderBy(desc(edvClients.createdAt));
      return list.filter(client => {
        const matchesSearch = !input?.search || client.name.toLowerCase().includes(input.search.toLowerCase()) || client.taxId.toLowerCase().includes(input.search.toLowerCase());
        const matchesCategory = !input?.category || input.category === "all" || client.taxCategory === input.category;
        return matchesSearch && matchesCategory;
      });
    }),

  createClient: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        taxId: z.string().min(5),
        taxCategory: z.string().min(2),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        organizationId: z.number().int().positive().default(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "write");
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      const inserted = await db.insert(edvClients).values({
        organizationId: input.organizationId,
        name: input.name,
        taxId: input.taxId,
        taxCategory: input.taxCategory,
        email: input.email || null,
        phone: input.phone || null,
      });
      return { success: true, clientId: Number(inserted[0].insertId) };
    }),

  bulkImportClients: protectedProcedure
    .input(z.object({ csvContent: z.string(), organizationId: z.number().int().positive().default(1) }))
    .mutation(async ({ input, ctx }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "write");
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      const parsed = parseClientCsv(input.csvContent);
      let importedCount = 0;
      let errorsCount = parsed.errors.length;

      for (const row of parsed.rows) {
        try {
          await db.insert(edvClients).values({
            organizationId: input.organizationId,
            name: row.name,
            taxId: row.taxId,
            taxCategory: row.taxCategory,
            email: row.email || null,
            phone: row.phone || null,
          }).onDuplicateKeyUpdate({
            set: {
              name: row.name,
              taxCategory: row.taxCategory,
              email: row.email || null,
              phone: row.phone || null,
              status: "active",
            },
          });
          importedCount++;
        } catch {
          errorsCount++;
        }
      }

      return { success: true, importedCount, errorsCount, validationErrors: parsed.errors };
    }),

  listEmployees: protectedProcedure
    .input(z.object({ organizationId: z.number().int().positive().default(1), clientId: z.number().optional(), search: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const organizationId = input?.organizationId ?? 1;
      await assertOrganizationAccess(ctx, organizationId, "read");
      const db = await getDb();
      if (!db) return [];
      if (input?.clientId) {
        const client = await db.select().from(edvClients).where(eq(edvClients.id, input.clientId)).limit(1);
        if (!client[0] || client[0].organizationId !== organizationId) throw new Error("Cliente fuera de la organización seleccionada");
      }
      const clientIds = input?.clientId ? [input.clientId] : (await db.select({ id: edvClients.id }).from(edvClients).where(eq(edvClients.organizationId, organizationId))).map(client => client.id);
      let baseList = clientIds.length
        ? await db.select().from(edvEmployees).where(inArray(edvEmployees.clientId, clientIds)).orderBy(desc(edvEmployees.createdAt))
        : [];

      return baseList.filter(emp => {
        const matchesSearch = !input?.search || emp.fullName.toLowerCase().includes(input.search.toLowerCase()) || emp.taxIdNumber.toLowerCase().includes(input.search.toLowerCase()) || (emp.cct && emp.cct.toLowerCase().includes(input.search.toLowerCase()));
        return matchesSearch;
      });
    }),

  createEmployee: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        organizationId: z.number().int().positive().default(1),
        fullName: z.string().min(2),
        taxIdNumber: z.string().min(5),
        baseSalary: z.number().positive(),
        cct: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "write");
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      const client = await db.select().from(edvClients).where(eq(edvClients.id, input.clientId)).limit(1);
      if (!client[0] || client[0].organizationId !== input.organizationId) throw new Error("Cliente fuera de la organización seleccionada");
      const inserted = await db.insert(edvEmployees).values({
        clientId: input.clientId,
        fullName: input.fullName,
        taxIdNumber: input.taxIdNumber,
        baseSalary: String(input.baseSalary),
        cct: input.cct || null,
      });
      return { success: true, employeeId: Number(inserted[0].insertId) };
    }),

  bulkImportEmployees: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        organizationId: z.number().int().positive().default(1),
        csvContent: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertOrganizationAccess(ctx, input.organizationId, "write");
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      const client = await db.select().from(edvClients).where(eq(edvClients.id, input.clientId)).limit(1);
      if (!client[0] || client[0].organizationId !== input.organizationId) throw new Error("Cliente fuera de la organización seleccionada");

      const parsed = parseEmployeeCsv(input.csvContent);
      let importedCount = 0;
      let errorsCount = parsed.errors.length;

      for (const row of parsed.rows) {
        try {
          await db.insert(edvEmployees).values({
            clientId: input.clientId,
            fullName: row.fullName,
            taxIdNumber: row.taxIdNumber,
            baseSalary: String(row.baseSalary),
            cct: row.cct,
          }).onDuplicateKeyUpdate({
            set: {
              clientId: input.clientId,
              fullName: row.fullName,
              baseSalary: String(row.baseSalary),
              cct: row.cct,
              status: "active",
            },
          });
          importedCount++;
        } catch {
          errorsCount++;
        }
      }

      return { success: true, importedCount, errorsCount, validationErrors: parsed.errors };
    }),
});
