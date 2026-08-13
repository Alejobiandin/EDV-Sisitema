import { spawn } from "child_process";
import path from "path";

export type PythonEngineInput = {
  taskType: "tax_computation" | "payroll_liquidation" | "social_charges" | "accounting_review";
  payload: Record<string, unknown>;
  rules: Record<string, number>;
};

export type PythonEngineOutput = {
  success: boolean;
  result: Record<string, unknown>;
  requiresApproval: boolean;
  summary: string;
  error?: string;
};

export async function runPythonCalculation(input: PythonEngineInput): Promise<PythonEngineOutput> {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(process.cwd(), "server/python/engine.py");
    const child = spawn("python3", [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });

    let stdoutData = "";
    let stderrData = "";

    child.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          result: {},
          requiresApproval: true,
          summary: `Error ejecutando motor Python (código ${code}): ${stderrData}`,
          error: stderrData || `Exit code ${code}`,
        });
        return;
      }

      try {
        const parsed = JSON.parse(stdoutData.trim()) as PythonEngineOutput;
        resolve(parsed);
      } catch (err) {
        resolve({
          success: false,
          result: {},
          requiresApproval: true,
          summary: `Error parseando respuesta de Python: ${stdoutData}`,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });

    child.on("error", (err) => {
      resolve({
        success: false,
        result: {},
        requiresApproval: true,
        summary: `No se pudo iniciar el proceso Python: ${err.message}`,
        error: err.message,
      });
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}
