import { useGetDashboardStats, useGetDashboardActivity, useListProjects } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Activity, LayoutDashboard, Globe, Server, CheckCircle2, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();
  const { data: projects } = useListProjects();

  const statCards = [
    {
      label: "Total Projects",
      value: stats?.totalProjects ?? 0,
      icon: LayoutDashboard,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Deployments",
      value: stats?.totalDeployments ?? 0,
      icon: Server,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Custom Domains",
      value: stats?.totalDomains ?? 0,
      icon: Globe,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Success Rate",
      value: stats ? `${stats.successRate.toFixed(1)}%` : "—",
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your deployment platform at a glance</p>
        </div>
        <Link href="/projects/new">
          <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 shrink-0">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      {statsLoading ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse bg-card/50">
              <CardContent className="pt-6 pb-4">
                <div className="h-7 w-12 bg-muted rounded mb-2" />
                <div className="h-3 w-20 bg-muted/60 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="bg-card/50 border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-2xl md:text-3xl font-bold tabular-nums">{value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${bg} shrink-0`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {/* Activity feed */}
        <div className="md:col-span-2">
          <Card className="bg-card/50 border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="h-6 w-16 rounded bg-muted shrink-0 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3.5 w-1/3 bg-muted rounded" />
                        <div className="h-3 w-2/3 bg-muted/60 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity && activity.length > 0 ? (
                <div className="space-y-0 divide-y divide-border/30">
                  {activity.map((item, i) => (
                    <div key={item.id} className={`flex items-start gap-3 py-3 ${i === 0 ? "pt-0" : ""}`}>
                      <div className="mt-0.5 shrink-0">
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{item.projectName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 mt-0.5">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <Server className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No activity yet. Deploy a project to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick links */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "New Project", href: "/projects/new", icon: Plus, desc: "Connect a git repo" },
                { label: "All Deployments", href: "/projects", icon: Server, desc: "View project list" },
                { label: "Add Domain", href: "/domains/new", icon: Globe, desc: "Custom domain setup" },
              ].map(({ label, href, icon: Icon, desc }) => (
                <Link key={label} href={href}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-card/80 border border-transparent hover:border-border/50 transition-all cursor-pointer group">
                    <div className="p-1.5 rounded-md bg-secondary/50 shrink-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent projects */}
          {projects && projects.length > 0 && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Projects</CardTitle>
                  <Link href="/projects">
                    <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">View all</span>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {projects.slice(0, 4).map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center gap-2.5 py-1.5 hover:bg-card/60 rounded-md px-1 -mx-1 transition-colors cursor-pointer group">
                      <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{project.framework}</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
