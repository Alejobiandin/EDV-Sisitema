import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import ClientRegistry from "@/pages/ClientRegistry";
import DnaAssistant from "@/pages/DnaAssistant";
import Organs from "@/pages/Organs";
import Banking from "@/pages/Banking";
import TaxConfig from "@/pages/TaxConfig";
import OpenBanking from "@/pages/OpenBanking";
import RoleDashboard from "@/pages/RoleDashboard";
import Approvals from "@/pages/Approvals";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/maestros" component={ClientRegistry} />
      <Route path="/asistente" component={DnaAssistant} />
      <Route path="/organos" component={Organs} />
      <Route path="/banca" component={Banking} />
      <Route path="/configuracion-fiscal" component={TaxConfig} />
      <Route path="/open-banking" component={OpenBanking} />
      <Route path="/rbac" component={RoleDashboard} />
      <Route path="/aprobaciones" component={Approvals} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
  
