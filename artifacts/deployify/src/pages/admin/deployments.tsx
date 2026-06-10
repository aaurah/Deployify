import { AdminLayout } from "./layout";
import { useListAdminDeployments } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { GitCommit, Clock } from "lucide-react";

export default function AdminDeployments() {
  const { data: deployments, isLoading } = useListAdminDeployments();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [envFilter, setEnvFilter] = useState<string>("all");

  const filteredDeployments = deployments?.filter(d => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (envFilter !== "all" && d.environment !== envFilter) return false;
    return true;
  }) || [];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-card/50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="building">Building</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
            </SelectContent>
          </Select>

          <Select value={envFilter} onValueChange={setEnvFilter}>
            <SelectTrigger className="w-[180px] bg-card/50">
              <SelectValue placeholder="Filter by environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Environments</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="preview">Preview</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredDeployments.length} deployments
          </div>
        </div>

        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Branch & Commit</TableHead>
                <TableHead>Build Time</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 w-24 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-40 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-muted rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : filteredDeployments.length > 0 ? (
                filteredDeployments.map((dep) => (
                  <TableRow 
                    key={dep.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setLocation(`/projects/${dep.projectId}/deployments/${dep.id}`)}
                  >
                    <TableCell className="font-medium">{dep.projectName}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        dep.environment === 'production' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {dep.environment}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={dep.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <GitCommit className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs">{dep.commitSha?.substring(0, 7) || 'HEAD'}</span>
                          <span className="text-muted-foreground truncate max-w-[150px]">{dep.commitMessage || 'Manual deploy'}</span>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted w-max px-1.5 rounded">{dep.branch || 'main'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dep.buildDurationMs ? `${(dep.buildDurationMs / 1000).toFixed(1)}s` : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(dep.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No deployments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
