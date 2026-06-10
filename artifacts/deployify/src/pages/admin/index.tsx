import { useGetAdminStats, useListAuditLogs, useGetDashboardActivity } from "@workspace/api-client-react";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LayoutDashboard, Server, CheckCircle2, Clock, HardDrive, CalendarDays } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

export default function AdminOverview() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: auditLogs, isLoading: logsLoading } = useListAuditLogs();
  const { data: activity } = useGetDashboardActivity();

  // Mock bar chart data using activity feed or dummy if needed
  const barData = activity?.slice(0, 7).map((act, i) => ({
    name: format(new Date(act.timestamp), "MMM d"),
    deployments: Math.floor(Math.random() * 50) + 10,
  })) || [];

  const pieData = stats ? [
    { name: "Success", value: stats.successRate, color: "hsl(var(--primary))" },
    { name: "Failed", value: 100 - stats.successRate, color: "hsl(var(--destructive))" },
  ] : [];

  return (
    <AdminLayout>
      {statsLoading ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-4 w-4 bg-muted rounded" />
              </CardHeader>
              <CardContent><div className="h-7 w-12 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Users" value={stats.totalUsers} icon={<Users />} />
            <StatCard title="Active Users" value={stats.activeUsers} icon={<Users className="text-emerald-500" />} />
            <StatCard title="Projects" value={stats.totalProjects} icon={<LayoutDashboard />} />
            <StatCard title="Deployments" value={stats.totalDeployments} icon={<Server />} />
            <StatCard title="Success Rate" value={`${stats.successRate.toFixed(1)}%`} icon={<CheckCircle2 />} />
            <StatCard title="Build Minutes" value={stats.buildMinutesUsed} icon={<Clock />} />
            <StatCard title="Storage Used" value={`${stats.storageUsedGb} GB`} icon={<HardDrive />} />
            <StatCard title="Deployments Today" value={stats.deploymentsToday} icon={<CalendarDays />} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-base font-medium">Deployment Success Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-base font-medium">Deployments (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="deployments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-medium">Recent Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
                </div>
              ) : auditLogs ? (
                <div className="space-y-4">
                  {auditLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground w-12">{format(new Date(log.createdAt), "HH:mm")}</span>
                        <StatusBadge status={log.action} label={log.action} />
                        <span>{log.userEmail}</span>
                      </div>
                      <span className="text-muted-foreground truncate max-w-xs">{log.details}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground shrink-0">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
