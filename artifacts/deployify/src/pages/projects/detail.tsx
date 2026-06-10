import { useParams, Link, useLocation } from "wouter";
import { 
  useGetProject, 
  useListDeployments, 
  useGetProjectAnalytics,
  useCreateDeployment,
  useListEnvVars,
  useCreateEnvVar,
  useDeleteEnvVar,
  useDeleteDeployment,
  useGetProjectInsights,
  getListDeploymentsQueryKey,
  getListEnvVarsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Github, ExternalLink, Activity, Plus, Key, Eye, EyeOff, Trash, Trash2, Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
type DeploymentInputEnvironment = "production" | "preview" | "development";
type EnvVarInputEnvironment = "production" | "preview" | "development" | "all";

export default function ProjectDetail() {
  const params = useParams();
  const projectId = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: project, isLoading: projectLoading } = useGetProject(projectId, { query: { enabled: !!projectId } });
  const { data: deployments, isLoading: deploymentsLoading } = useListDeployments(projectId, { query: { enabled: !!projectId } });
  const { data: analytics } = useGetProjectAnalytics(projectId, { query: { enabled: !!projectId } });
  const { data: insights } = useGetProjectInsights(projectId, { query: { enabled: !!projectId } });
  const { data: envVars, isLoading: envVarsLoading } = useListEnvVars(projectId, { query: { enabled: !!projectId } });
  
  const createDeployment = useCreateDeployment();
  const createEnvVar = useCreateEnvVar();
  const deleteEnvVar = useDeleteEnvVar();
  const deleteDeployment = useDeleteDeployment();

  const [deployEnv, setDeployEnv] = useState<DeploymentInputEnvironment>("preview");
  const [deployBranch, setDeployBranch] = useState("main");
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");
  const [envEnv, setEnvEnv] = useState<EnvVarInputEnvironment>("all");
  const [visibleEnvVars, setVisibleEnvVars] = useState<Record<number, boolean>>({});

  if (projectLoading) {
    return <div className="p-8 text-center"><div className="animate-pulse h-8 w-32 bg-muted mx-auto rounded" /></div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-red-500">Project not found</div>;
  }

  const handleDeploy = () => {
    createDeployment.mutate({
      projectId,
      data: { environment: deployEnv, branch: deployBranch }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeploymentsQueryKey(projectId) });
        setIsDeployModalOpen(false);
      }
    });
  };

  const handleCreateEnvVar = (e: React.FormEvent) => {
    e.preventDefault();
    createEnvVar.mutate({
      data: { key: envKey, value: envValue, environment: envEnv, projectId }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEnvVarsQueryKey(projectId) });
        setEnvKey("");
        setEnvValue("");
      }
    });
  };

  const toggleEnvVarVisibility = (id: number) => {
    setVisibleEnvVars(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" className="shrink-0 mt-1" onClick={() => setLocation("/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-muted-foreground text-sm truncate">{project.description || "No description"}</p>
        </div>
        <Dialog open={isDeployModalOpen} onOpenChange={setIsDeployModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shrink-0">
              <Play className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Deploy</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Trigger Deployment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input value={deployBranch} onChange={(e) => setDeployBranch(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select value={deployEnv} onValueChange={(v) => setDeployEnv(v as DeploymentInputEnvironment)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="preview">Preview</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeployModalOpen(false)}>Cancel</Button>
              <Button onClick={handleDeploy} disabled={createDeployment.isPending}>
                {createDeployment.isPending ? "Deploying..." : "Deploy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/50 rounded-md border border-border/50">
          <span className="font-medium text-foreground text-xs">{project.framework}</span>
        </div>
        {project.gitUrl && (
          <a href={project.gitUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-card/50 hover:bg-card/80 rounded-md border border-border/50 transition-colors min-w-0 max-w-[240px]">
            <Github className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-xs">{project.gitUrl.replace("https://github.com/", "")}</span>
          </a>
        )}
        {project.productionUrl && (
          <a href={project.productionUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-card/50 hover:bg-card/80 rounded-md border border-border/50 transition-colors text-primary/80 min-w-0 max-w-[240px]">
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-xs">{project.productionUrl.replace("https://", "")}</span>
          </a>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card/50 border border-border/50 w-full justify-start rounded-md overflow-x-auto">
          <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="deployments" className="text-xs md:text-sm">Deployments</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs md:text-sm">Env Vars</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="mt-5 space-y-5">
          {/* Stats + Health score row */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalDeployments || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.totalDeployments ? Math.round((analytics.successfulDeployments / analytics.totalDeployments) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Avg Build Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.avgBuildDurationMs ? (analytics.avgBuildDurationMs / 1000).toFixed(1) : 0}s
                </div>
              </CardContent>
            </Card>

            {/* AI Health Score Card */}
            {insights ? (
              <Card className={`border-border/50 ${
                insights.healthScore >= 80 ? "bg-green-500/5 border-green-500/20" :
                insights.healthScore >= 60 ? "bg-amber-500/5 border-amber-500/20" :
                "bg-red-500/5 border-red-500/20"
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    AI Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className={`text-2xl font-bold ${
                      insights.healthScore >= 80 ? "text-green-400" :
                      insights.healthScore >= 60 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {insights.grade}
                    </div>
                    <div className="flex items-center gap-1">
                      {insights.recentTrend === "improving" && <TrendingUp className="h-3.5 w-3.5 text-green-400" />}
                      {insights.recentTrend === "degrading" && <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                      {insights.recentTrend === "stable" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground capitalize">{insights.recentTrend}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{insights.healthScore}/100</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    AI Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-6 w-12 bg-muted/50 rounded animate-pulse" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Recommendations */}
          {insights && insights.recommendations.length > 0 && (
            <Card className="bg-gradient-to-br from-indigo-950/30 to-card/50 border-indigo-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    rec.priority === "high" ? "border-red-500/20 bg-red-500/5" :
                    rec.priority === "medium" ? "border-amber-500/20 bg-amber-500/5" :
                    "border-green-500/20 bg-green-500/5"
                  }`}>
                    <div className="shrink-0 mt-0.5">
                      {rec.priority === "high" && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                      {rec.priority === "medium" && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                      {rec.priority === "low" && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {analytics?.deploymentsPerDay && analytics.deploymentsPerDay.length > 0 && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <Activity className="h-4 w-4" />
                  Deployment Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.deploymentsPerDay}>
                    <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), "MMM d")} stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={24} />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "6px", fontSize: 12 }}
                      labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Deployments tab */}
        <TabsContent value="deployments" className="mt-5">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Deployment History</CardTitle>
            </CardHeader>
            <CardContent>
              {deploymentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}
                </div>
              ) : deployments && deployments.length > 0 ? (
                <div className="space-y-2">
                  {deployments.map((deployment) => (
                    <div key={deployment.id} className="flex items-center gap-2">
                      <Link href={`/projects/${projectId}/deployments/${deployment.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center justify-between p-3 md:p-4 rounded-lg border border-border/40 bg-card/30 hover:bg-card/60 hover:border-border transition-all cursor-pointer group gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <StatusBadge status={deployment.status} />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-xs md:text-sm">
                                  {deployment.commitSha ? deployment.commitSha.substring(0, 7) : "Manual"}
                                </span>
                                <span className="text-xs text-muted-foreground">{deployment.branch}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px] md:max-w-none">
                                {deployment.commitMessage || "No message"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(deployment.createdAt), "MMM d, HH:mm")}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 px-1.5 py-0.5 bg-secondary/50 rounded inline-block">
                              {deployment.environment}
                            </div>
                          </div>
                        </div>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                            title="Delete deployment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete deployment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete deployment <strong>{deployment.commitSha?.substring(0, 7) ?? `#${deployment.id}`}</strong> and all its build logs. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteDeployment.mutate({ id: deployment.id }, {
                                  onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDeploymentsQueryKey(projectId) })
                                })
                              }
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete deployment
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No deployments yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Env vars tab */}
        <TabsContent value="settings" className="mt-5 space-y-5">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Environment Variables</CardTitle>
              <CardDescription className="text-xs">Configure environment variables for your deployments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Add env var form — stacked on mobile */}
              <form onSubmit={handleCreateEnvVar} className="space-y-3 p-4 border border-border/50 rounded-lg bg-card/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Key</Label>
                    <Input placeholder="API_KEY" value={envKey} onChange={(e) => setEnvKey(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Value</Label>
                    <Input type="password" placeholder="••••••••" value={envValue} onChange={(e) => setEnvValue(e.target.value)} required />
                  </div>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-xs">Environment</Label>
                    <Select value={envEnv} onValueChange={(v) => setEnvEnv(v as EnvVarInputEnvironment)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="preview">Preview</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={createEnvVar.isPending} className="shrink-0">Add</Button>
                </div>
              </form>

              <div className="space-y-2">
                {envVarsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
                  </div>
                ) : envVars && envVars.length > 0 ? (
                  envVars.map(env => (
                    <div key={env.id} className="flex items-center gap-2 p-3 border border-border/50 rounded-md bg-card/30">
                      <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="font-mono text-xs min-w-0 w-1/3 truncate">{env.key}</div>
                      <div className="font-mono text-xs text-muted-foreground flex-1 flex items-center gap-1 min-w-0">
                        <span className="truncate">
                          {visibleEnvVars[env.id] ? env.value || "" : "••••••••••"}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => toggleEnvVarVisibility(env.id)}>
                          {visibleEnvVars[env.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      <div className="hidden sm:block text-xs px-1.5 py-0.5 bg-secondary rounded text-muted-foreground shrink-0">{env.environment}</div>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => deleteEnvVar.mutate({ id: env.id }, {
                          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListEnvVarsQueryKey(projectId) })
                        })}>
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">No environment variables configured.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
