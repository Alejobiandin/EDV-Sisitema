import { describe, expect, it, vi } from "vitest";
import { dashboardRouter } from "./routers/dashboard";
import { getDashboardRenderState } from "../client/src/pages/Dashboard";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

const context = {
  user: undefined,
  req: { protocol: "https", headers: {} },
  res: {},
} as TrpcContext;

describe("dashboard.summary", () => {
  it("classifies loading and error states explicitly", () => {
    expect(getDashboardRenderState({ isLoading: true, isError: false, hasData: false })).toBe("loading");
    expect(getDashboardRenderState({ isLoading: false, isError: true, hasData: false })).toBe("error");
    expect(getDashboardRenderState({ isLoading: false, isError: false, hasData: false })).toBe("empty");
  });

  it("returns a safe empty summary when the database is unavailable", async () => {
    const caller = dashboardRouter.createCaller(context);
    const result = await caller.summary();

    expect(result).toMatchObject({
      activeAgents: 0,
      totalAgents: 0,
      runningTasks: 0,
      pendingTasks: 0,
      approvalTasks: 0,
      approvedTasks: 0,
      rejectedTasks: 0,
      unreadNotifications: 0,
      totalRules: 0,
      totalPolicies: 0,
      recentActivity: [],
      notificationsList: [],
      agentsList: [],
      tasksList: [],
    });
  });
});
