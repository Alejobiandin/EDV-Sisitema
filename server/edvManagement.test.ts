import { describe, expect, it } from "vitest";
import { parseEmployeeCsv } from "./routers/edvManagement";

describe("EDV employee CSV parser", () => {
  it("acepta cabecera, normaliza importes y aplica CCT por defecto", () => {
    const result = parseEmployeeCsv("Nombre Completo,CUIL,Categoria,Sueldo Básico\nAna Pérez,20-12345678-9,850000,Comercio General\nLuis Gómez,20-98765432-1,720000");
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toEqual([
      { fullName: "Ana Pérez", taxIdNumber: "20-12345678-9", baseSalary: 850000, cct: "Comercio General" },
      { fullName: "Luis Gómez", taxIdNumber: "20-98765432-1", baseSalary: 720000, cct: "Comercio General" },
    ]);
  });

  it("devuelve errores por línea para registros incompletos o inválidos", () => {
    const result = parseEmployeeCsv("Ana Pérez,20-12345678-9,0\nRegistro incompleto");
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].line).toBe(1);
  });
});
