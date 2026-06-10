import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects/index";
import ProjectNew from "@/pages/projects/new";
import ProjectDetail from "@/pages/projects/detail";
import DeploymentDetail from "@/pages/deployments/detail";
import Domains from "@/pages/domains/index";
import DomainNew from "@/pages/domains/new";
import DomainDetail from "@/pages/domains/detail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        
        <Route path="/projects" component={Projects} />
        <Route path="/projects/new" component={ProjectNew} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/projects/:id/deployments/:deploymentId" component={DeploymentDetail} />
        
        <Route path="/domains" component={Domains} />
        <Route path="/domains/new" component={DomainNew} />
        <Route path="/domains/:id" component={DomainDetail} />
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;