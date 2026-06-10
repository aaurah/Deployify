import { useParams, Link, useLocation } from "wouter";
import { 
  useGetProject, 
  useListDeployments, 
  useGetProjectAnalytics,
  useCreateDeployment,
  useListEnvVars,
  useCreateEnvVar,
  useDeleteEnvVar,
  getListDeploymentsQueryKey,
  getListEnvVarsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Github, ExternalLink, Activity, Plus, Key, Eye, EyeOff, Trash } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
  const { data: envVars, isLoading: envVarsLoading } = useListEnvVars(projectId, { query: { enabled: !!projectId } });
  
  const createDeployment = useCreateDeployment();
  const createEnvVar = useCreateEnvVar();
  const deleteEnvVar = useDeleteEnvVar();

  const [deployEnv, setDeployEnv] = useState<DeploymentInputEnvironment>(DeploymentInputEnvironment.preview);
  const [deployBranch, setDeployBranch] = useState("main");
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");
  const [envEnv, setEnvEnv] = useState<EnvVarInputEnvironment>(EnvVarInputEnvironment.all);
  const [visibleEnvVars, setVisibleEnvVars] = useState<Record<number, boolean>>({});

  if (projectLoading) {
    return <div className="p-8 text-center"><div className="animate-pulse h-8 w-32 bg-muted mx-auto rounded"></div></div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-red-500">Project not found</div>;
  }

  const handleDeploy = () => {
    createDeployment.mutate({
      projectId,
      data: {
        environment: deployEnv,
        branch: deployBranch,
      }
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
      data: {
        key: envKey,
        value: envValue,
        environment: envEnv,
        projectId
      }
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-muted-foreground">{project.description || "No description"}</p>
        </div>
        <Dialog open={isDeployModalOpen} onOpenChange={setIsDeployModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Play className="h-4 w-4" />
              Deploy
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/50 rounded-md border border-border/50">
          <span className="font-medium text-foreground">{project.framework}</span>
        </div>
        {project.gitUrl && (
          <a href={project.gitUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-card/50 hover:bg-card/80 rounded-md border border-border/50 transition-colors">
            <Github className="h-4 w-4" />
            <span>{project.gitUrl.replace("https://github.com/", "")}</span>
          </a>
        )}
        {project.productionUrl && (
          <a href={project.productionUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-card/50 hover:bg-card/80 rounded-md border border-border/50 transition-colors text-primary/80">
            <ExternalLink className="h-4 w-4" />
            <span>{project.productionUrl.replace("https://", "")}</span>
          </a>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card/50 border border-border/50 w-full justify-start rounded-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="settings">Settings & Env Vars</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalDeployments || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.totalDeployments ? Math.round((analytics.successfulDeployments / analytics.totalDeployments) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Build Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.avgBuildDurationMs ? (analytics.avgBuildDurationMs / 1000).toFixed(1) : 0}s
                </div>
              </CardContent>
            </Card>
          </div>

          {analytics?.deploymentsPerDay && analytics.deploymentsPerDay.length > 0 && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Deployment Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.deploymentsPerDay}>
                    <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), "MMM d")} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px' }}
                      labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="deployments" className="mt-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
            </CardHeader>
            <CardContent>
              {deploymentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}
                </div>
              ) : deployments && deployments.length > 0 ? (
                <div className="space-y-2">
                  {deployments.map((deployment) => (
                    <Link key={deployment.id} href={`/projects/${projectId}/deployments/${deployment.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-card/30 hover:bg-card/60 hover:border-border transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <StatusBadge status={deployment.status} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{deployment.commitSha ? deployment.commitSha.substring(0, 7) : "Manual"}</span>
                              <span className="text-sm text-muted-foreground">{deployment.branch}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-1">{deployment.commitMessage || "No message"}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(deployment.createdAt), "MMM d, HH:mm")}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 px-2 py-0.5 bg-secondary/50 rounded inline-block">
                            {deployment.environment}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No deployments yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>Configure environment variables for your deployments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleCreateEnvVar} className="flex items-end gap-4 p-4 border border-border/50 rounded-lg bg-card/30">
                <div className="space-y-2 flex-1">
                  <Label>Key</Label>
                  <Input placeholder="API_KEY" value={envKey} onChange={(e) => setEnvKey(e.target.value)} required />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Value</Label>
                  <Input type="password" placeholder="••••••••" value={envValue} onChange={(e) => setEnvValue(e.target.value)} required />
                </div>
                <div className="space-y-2 w-32">
                  <Label>Environment</Label>
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
                <Button type="submit" disabled={createEnvVar.isPending}>Add</Button>
              </form>

              <div className="space-y-2">
                {envVarsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2].map(i => <div key={i} className="h-12 bg-muted rounded" />)}
                  </div>
                ) : envVars && envVars.length > 0 ? (
                  envVars.map(env => (
                    <div key={env.id} className="flex items-center justify-between p-3 border border-border/50 rounded-md bg-card/30">
                      <div className="flex items-center gap-4 flex-1">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <div className="font-mono text-sm w-1/3">{env.key}</div>
                        <div className="font-mono text-sm text-muted-foreground flex-1 flex items-center gap-2">
                          {visibleEnvVars[env.id] ? env.value || "" : "••••••••••••••••"}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleEnvVarVisibility(env.id)}>
                            {visibleEnvVars[env.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground">{env.environment}</div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                          onClick={() => {
                            deleteEnvVar.mutate({ id: env.id }, {
                              onSuccess: () => queryClient.invalidateQueries({ queryKey: getListEnvVarsQueryKey(projectId) })
                            });
                          }}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
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