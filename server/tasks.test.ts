import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getTask: vi.fn().mockImplementation(async (id: number) => {
    if (id === 1) {
      return {
        id: 1,
        name: "Célula Impositiva: Determinación impositiva",
        status: "pending_approval",
        approvalStatus: "pending",
        assignedAgentId: 1,
      };
    }
    return undefined;
  }),
  approveTask: vi.fn().mockImplementation(async (taskId: number, userId: number, comment?: string) => {
    return {
      id: taskId,
      status: "completed",
      approvalStatus: "approved",
      approvedBy: userId,
      approvalComment: comment ?? null,
    };
  }),
  rejectTask: vi.fn().mockImplementation(async (taskId: number, userId: number, comment: string) => {
    return {
      id: taskId,
      status: "rejected",
      approvalStatus: "rejected",
      approvedBy: userId,
      approvalComment: comment,
    };
  }),
}));

describe("Human-in-the-Loop task approvals", () => {
  it("simula la aprobación de una tarea pendiente de revisión humana", async () => {
    const { approveTask } = await import("./db");
    const res = await approveTask(1, 10, "Aprobado por contador senior");
    expect(res?.status).toBe("completed");
    expect(res?.approvalStatus).toBe("approved");
    expect(res?.approvedBy).toBe(10);
    expect(res?.approvalComment).toBe("Aprobado por contador senior");
  });

  it("simula el rechazo de una tarea con comentario de auditoría", async () => {
    const { rejectTask } = await import("./db");
    const res = await rejectTask(1, 10, "Se requiere recalcular deducciones");
    expect(res?.status).toBe("rejected");
    expect(res?.approvalStatus).toBe("rejected");
    expect(res?.approvalComment).toBe("Se requiere recalcular deducciones");
  });
});
