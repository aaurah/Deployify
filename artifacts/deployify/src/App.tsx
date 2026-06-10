import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";

import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects/index";
import ProjectNew from "@/pages/projects/new";
import ProjectDetail from "@/pages/projects/detail";
import DeploymentDetail from "@/pages/deployments/detail";
import Domains from "@/pages/domains/index";
import DomainNew from "@/pages/domains/new";
import DomainDetail from "@/pages/domains/detail";

import AdminOverview from "@/pages/admin/index";
import AdminUsers from "@/pages/admin/users";
import AdminProjects from "@/pages/admin/projects";
import AdminDeployments from "@/pages/admin/deployments";
import AdminAuditLogs from "@/pages/admin/audit-logs";
import AdminSettings from "@/pages/admin/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#6366f1",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#f87171",
    colorBackground: "#0f172a",
    colorInput: "#1e293b",
    colorInputForeground: "#f1f5f9",
    colorNeutral: "#334155",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-slate-900 rounded-xl w-[440px] max-w-full overflow-hidden border border-slate-700/50 shadow-2xl shadow-indigo-950/50",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-100 font-bold",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButtonText: "text-slate-200",
    formFieldLabel: "text-slate-300",
    footerActionLink: "text-indigo-400 hover:text-indigo-300",
    footerActionText: "text-slate-400",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-indigo-400",
    formFieldSuccessText: "text-emerald-400",
    alertText: "text-slate-200",
    logoBox: "flex items-center justify-center py-2",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "!border-slate-700 !bg-slate-800 hover:!bg-slate-700",
    formButtonPrimary: "!bg-indigo-600 hover:!bg-indigo-500 !text-white",
    formFieldInput: "!bg-slate-800 !border-slate-700 !text-slate-100",
    footerAction: "!bg-transparent",
    dividerLine: "!bg-slate-700",
    alert: "!bg-slate-800 !border-slate-700",
    otpCodeFieldInput: "!bg-slate-800 !border-slate-700 !text-slate-100",
    formFieldRow: "gap-3",
    main: "px-2",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Component />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/projects">
        {() => <ProtectedRoute component={Projects} />}
      </Route>
      <Route path="/projects/new">
        {() => <ProtectedRoute component={ProjectNew} />}
      </Route>
      <Route path="/projects/:id">
        {() => <ProtectedRoute component={ProjectDetail} />}
      </Route>
      <Route path="/projects/:id/deployments/:deploymentId">
        {() => <ProtectedRoute component={DeploymentDetail} />}
      </Route>
      <Route path="/domains">
        {() => <ProtectedRoute component={Domains} />}
      </Route>
      <Route path="/domains/new">
        {() => <ProtectedRoute component={DomainNew} />}
      </Route>
      <Route path="/domains/:id">
        {() => <ProtectedRoute component={DomainDetail} />}
      </Route>

      <Route path="/admin">
        {() => <ProtectedRoute component={AdminOverview} />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsers} />}
      </Route>
      <Route path="/admin/projects">
        {() => <ProtectedRoute component={AdminProjects} />}
      </Route>
      <Route path="/admin/deployments">
        {() => <ProtectedRoute component={AdminDeployments} />}
      </Route>
      <Route path="/admin/audit-logs">
        {() => <ProtectedRoute component={AdminAuditLogs} />}
      </Route>
      <Route path="/admin/settings">
        {() => <ProtectedRoute component={AdminSettings} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your Deployify account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start deploying in seconds",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
