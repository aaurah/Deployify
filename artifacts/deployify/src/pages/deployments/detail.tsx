import { useParams, Link } from "wouter";
import { 
  useGetDeployment, 
  useGetDeploymentLogs,
  useCancelDeployment,
  usePromoteDeployment,
  getGetDeploymentQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, ExternalLink, RefreshCw, Terminal, UploadCloud } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
type DeploymentLogLevel = "info" | "warn" | "error";

export default function DeploymentDetail() {
  const params = useParams();
  const deploymentId = parseInt(params.deploymentId || "0", 10);
  const projectId = parseInt(params.id || "0", 10);
  
  const queryClient = useQueryClient();
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const { data: deployment, isLoading: deploymentLoading } = useGetDeployment(deploymentId, { 
    query: { 
      enabled: !!deploymentId,
      refetchInterval: (data) => {
        // Only auto-refetch if we're in a running state
        if (data && (data.status === 'building' || data.status === 'queued')) {
          return 3000;
        }
        return false;
      }
    } 
  });
  
  const { data: logs, isLoading: logsLoading } = useGetDeploymentLogs(deploymentId, { 
    query: { 
      enabled: !!deploymentId,
      refetchInterval: deployment?.status === 'building' ? 3000 : false
    } 
  });

  const cancelDeployment = useCancelDeployment();
  const promoteDeployment = usePromoteDeployment();

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (deploymentLoading) {
    return <div className="p-8 text-center"><div className="animate-pulse h-8 w-32 bg-muted mx-auto rounded"></div></div>;
  }

  if (!deployment) {
    return <div className="p-8 text-center text-red-500">Deployment not found</div>;
  }

  const handleCancel = () => {
    cancelDeployment.mutate({ id: deploymentId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetDeploymentQueryKey(deploymentId) })
    });
  };

  const handlePromote = () => {
    promoteDeployment.mutate({ id: deploymentId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetDeploymentQueryKey(deploymentId) })
    });
  };

  const getLogColor = (level: string) => {
    switch(level) {
      case DeploymentLogLevel.error: return "text-red-400";
      case DeploymentLogLevel.warn: return "text-amber-400";
      default: return "text-muted-foreground";
    }
  };

  const isBuilding = deployment.status === 'building' || deployment.status === 'queued';
  const isReady = deployment.status === 'ready';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Deployment {deployment.commitSha ? deployment.commitSha.substring(0, 7) : `#${deployment.id}`}
            </h1>
            <StatusBadge status={deployment.status} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span className="bg-secondary/50 px-2 py-0.5 rounded text-xs">{deployment.environment}</span>
            <span>•</span>
            <span>{deployment.branch}</span>
            <span>•</span>
            <span>{format(new Date(deployment.createdAt), "MMM d, yyyy HH:mm:ss")}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isBuilding && (
            <Button variant="destructive" onClick={handleCancel} disabled={cancelDeployment.isPending} className="gap-2">
              <Ban className="h-4 w-4" />
              Cancel
            </Button>
          )}
          
          {isReady && deployment.environment !== 'production' && (
            <Button onClick={handlePromote} disabled={promoteDeployment.isPending} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <UploadCloud className="h-4 w-4" />
              Promote to Production
            </Button>
          )}
          
          {deployment.deployUrl && (
            <a href={deployment.deployUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Visit URL
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-[#0D0D12] border-border/40 shadow-xl overflow-hidden flex flex-col h-[600px]">
            <CardHeader className="bg-card/50 border-b border-border/30 py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-mono flex items-center gap-2 text-muted-foreground">
                <Terminal className="h-4 w-4" />
                Build Logs
              </CardTitle>
              {isBuilding && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Building...
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed">
              {logsLoading && !logs?.length ? (
                <div className="text-muted-foreground animate-pulse">Initializing build environment...</div>
              ) : (
                <div className="space-y-1">
                  {logs?.map((log) => (
                    <div key={log.id} className="flex gap-4 hover:bg-white/5 px-2 py-0.5 rounded transition-colors -mx-2">
                      <span className="text-muted-foreground/50 shrink-0 select-none">
                        {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                      </span>
                      <span className={`${getLogColor(log.level)} break-all`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-1 border-b border-border/30 pb-3">
                <div className="text-muted-foreground">Status</div>
                <div className="font-medium capitalize">{deployment.status}</div>
              </div>
              <div className="grid grid-cols-2 gap-1 border-b border-border/30 pb-3">
                <div className="text-muted-foreground">Environment</div>
                <div className="font-medium capitalize">{deployment.environment}</div>
              </div>
              <div className="grid grid-cols-2 gap-1 border-b border-border/30 pb-3">
                <div className="text-muted-foreground">Branch</div>
                <div className="font-medium font-mono">{deployment.branch}</div>
              </div>
              <div className="grid grid-cols-2 gap-1 border-b border-border/30 pb-3">
                <div className="text-muted-foreground">Commit</div>
                <div className="font-medium font-mono">{deployment.commitSha?.substring(0, 7) || "Manual trigger"}</div>
              </div>
              <div className="grid grid-cols-2 gap-1 border-b border-border/30 pb-3">
                <div className="text-muted-foreground">Duration</div>
                <div className="font-medium">
                  {deployment.buildDurationMs ? `${(deployment.buildDurationMs / 1000).toFixed(1)}s` : "—"}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {deployment.errorMessage && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-red-400 text-lg flex items-center gap-2">
                  <Ban className="h-5 w-5" />
                  Error Details
                </CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-sm text-red-300 whitespace-pre-wrap">
                {deployment.errorMessage}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}