import { AdminLayout } from "./layout";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function AdminAuditLogs() {
  const { data: logs, isLoading } = useListAuditLogs();

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create')) return 'active';
    if (act.includes('delete') || act.includes('cancel')) return 'error';
    if (act.includes('update') || act.includes('promote')) return 'building';
    return 'default';
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Audit Log</h2>
          <div className="text-sm text-muted-foreground">
            {logs?.length || 0} events
          </div>
        </div>

        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 w-24 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-32 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-48 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-muted rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : logs && logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id} className="text-sm">
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell className="font-medium">{log.userEmail}</TableCell>
                    <TableCell>
                      <StatusBadge status={getActionColor(log.action)} label={log.action} />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                        {log.resource}
                      </span>
                      {log.resourceId && <span className="ml-1 text-muted-foreground">#{log.resourceId}</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {log.details}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
        
        {logs && logs.length >= 20 && (
          <div className="flex justify-center mt-6">
            <Button variant="outline">Load More</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
