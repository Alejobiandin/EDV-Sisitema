import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { dashboardRouter } from "./routers/dashboard";
import { dnaRouter } from "./routers/dna";
import { agentsRouter } from "./routers/agents";
import { tasksRouter } from "./routers/tasks";
import { documentsRouter } from "./routers/documents";
import { systemLogsRouter } from "./routers/system_logs";
import { reportsRouter } from "./routers/reports";
import { edvManagementRouter } from "./routers/edvManagement";
import { vectorSearchRouter } from "./routers/vectorSearch";
import { edvAdvancedRouter } from "./routers/edvAdvanced";
import { organsRouter } from "./routers/organs";
import { bankingRouter } from "./routers/banking";
import { organizationsRouter } from "./routers/organizations";
import { taxConfigsRouter } from "./routers/taxConfigs";
import { enterpriseRouters } from "./enterpriseModules";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  dashboard: dashboardRouter,
  dna: dnaRouter,
  agents: agentsRouter,
  tasks: tasksRouter,
  documents: documentsRouter,
  systemLogs: systemLogsRouter,
  reports: reportsRouter,
  edvManagement: edvManagementRouter,
  vectorSearch: vectorSearchRouter,
  edvAdvanced: edvAdvancedRouter,
  organs: organsRouter,
  banking: bankingRouter,
  organizations: organizationsRouter,
  taxConfigs: taxConfigsRouter,
  enterprise: router(enterpriseRouters),
});

export type AppRouter = typeof appRouter;
