import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { edvClients, edvEmployees } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

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
    .input(z.object({ search: z.string().optional(), category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      let query = db.select().from(edvClients);
      const list = await query.orderBy(desc(edvClients.createdAt));
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
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      const inserted = await db.insert(edvClients).values({
        name: input.name,
        taxId: input.taxId,
        taxCategory: input.taxCategory,
        email: input.email || null,
        phone: input.phone || null,
      });
      return { success: true, clientId: Number(inserted[0].insertId) };
    }),

  bulkImportClients: protectedProcedure
    .input(z.object({ csvContent: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
      const parsed = parseClientCsv(input.csvContent);
      let importedCount = 0;
      let errorsCount = parsed.errors.length;

      for (const row of parsed.rows) {
        try {
          await db.insert(edvClients).values({
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
    .input(z.object({ clientId: z.number().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      let baseList = input?.clientId
        ? await db.select().from(edvEmployees).where(eq(edvEmployees.clientId, input.clientId)).orderBy(desc(edvEmployees.createdAt))
        : await db.select().from(edvEmployees).orderBy(desc(edvEmployees.createdAt));

      return baseList.filter(emp => {
        const matchesSearch = !input?.search || emp.fullName.toLowerCase().includes(input.search.toLowerCase()) || emp.taxIdNumber.toLowerCase().includes(input.search.toLowerCase()) || (emp.cct && emp.cct.toLowerCase().includes(input.search.toLowerCase()));
        return matchesSearch;
      });
    }),

  createEmployee: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        fullName: z.string().min(2),
        taxIdNumber: z.string().min(5),
        baseSalary: z.number().positive(),
        cct: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");
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
        csvContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible");

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
