import { useParams, Link } from "wouter";
import { 
  useGetDeployment, 
  useGetDeploymentLogs,
  useCancelDeployment,
  usePromoteDeployment,
  useDeleteDeployment,
  getGetDeploymentQueryKey,
  getListDeploymentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, ExternalLink, RefreshCw, Terminal, UploadCloud, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
        if (data && (data.status === "building" || data.status === "queued")) return 3000;
        return false;
      }
    } 
  });
  
  const { data: logs, isLoading: logsLoading } = useGetDeploymentLogs(deploymentId, { 
    query: { 
      enabled: !!deploymentId,
      refetchInterval: deployment?.status === "building" ? 3000 : false
    } 
  });

  const cancelDeployment = useCancelDeployment();
  const promoteDeployment = usePromoteDeployment();
  const deleteDeployment = useDeleteDeployment();
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (deploymentLoading) {
    return <div className="p-8 text-center"><div className="animate-pulse h-8 w-32 bg-muted mx-auto rounded" /></div>;
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

  const handleDelete = () => {
    deleteDeployment.mutate({ id: deploymentId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeploymentsQueryKey(projectId) });
        window.history.back();
      }
    });
  };

  const getLogColor = (level: string) => {
    if (level === "error") return "text-red-400";
    if (level === "warn") return "text-amber-400";
    return "text-muted-foreground";
  };

  const isBuilding = deployment.status === "building" || deployment.status === "queued";
  const isReady = deployment.status === "ready";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline" size="icon" className="shrink-0 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg md:text-2xl font-bold tracking-tight">
              {deployment.commitSha ? deployment.commitSha.substring(0, 7) : `#${deployment.id}`}
            </h1>
            <StatusBadge status={deployment.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span className="bg-secondary/50 px-1.5 py-0.5 rounded">{deployment.environment}</span>
            <span>•</span>
            <span className="font-mono">{deployment.branch}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{format(new Date(deployment.createdAt), "MMM d, yyyy HH:mm")}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {isBuilding && (
            <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelDeployment.isPending} className="gap-1.5">
              <Ban className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          )}
          {isReady && deployment.environment !== "production" && (
            <Button size="sm" onClick={handlePromote} disabled={promoteDeployment.isPending} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              <UploadCloud className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Promote</span>
            </Button>
          )}
          {deployment.deployUrl && (
            <a href={deployment.deployUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Visit</span>
              </Button>
            </a>
          )}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 border-red-800/50 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
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
                  onClick={handleDelete}
                  disabled={deleteDeployment.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteDeployment.isPending ? "Deleting…" : "Delete deployment"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Details card (mobile-first: on top) */}
      <Card className="bg-card/50 border-border/50 md:hidden">
        <CardContent className="pt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {[
            ["Status", <span className="capitalize">{deployment.status}</span>],
            ["Environment", <span className="capitalize">{deployment.environment}</span>],
            ["Branch", <span className="font-mono">{deployment.branch}</span>],
            ["Commit", <span className="font-mono">{deployment.commitSha?.substring(0, 7) || "Manual"}</span>],
            ["Duration", deployment.buildDurationMs ? `${(deployment.buildDurationMs / 1000).toFixed(1)}s` : "—"],
          ].map(([label, val], i) => (
            <div key={i}>
              <div className="text-muted-foreground text-xs">{label as string}</div>
              <div className="font-medium mt-0.5">{val as React.ReactNode}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Build logs */}
        <div className="md:col-span-2">
          <Card className="bg-[#0D0D12] border-border/40 shadow-xl overflow-hidden flex flex-col h-[320px] md:h-[600px]">
            <CardHeader className="bg-card/50 border-b border-border/30 py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-mono flex items-center gap-2 text-muted-foreground">
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
            <CardContent className="flex-1 overflow-auto p-3 md:p-4 font-mono text-xs md:text-sm leading-relaxed">
              {logsLoading && !logs?.length ? (
                <div className="text-muted-foreground animate-pulse">Initializing build environment...</div>
              ) : (
                <div className="space-y-0.5">
                  {logs?.map((log) => (
                    <div key={log.id} className="flex gap-2 md:gap-4 hover:bg-white/5 px-2 py-0.5 rounded -mx-2">
                      <span className="text-muted-foreground/50 shrink-0 select-none text-xs">
                        {format(new Date(log.timestamp), "HH:mm:ss")}
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

        {/* Details sidebar (desktop only) */}
        <div className="hidden md:block space-y-5">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[
                ["Status", <span className="capitalize">{deployment.status}</span>],
                ["Environment", <span className="capitalize">{deployment.environment}</span>],
                ["Branch", <span className="font-mono">{deployment.branch}</span>],
                ["Commit", <span className="font-mono">{deployment.commitSha?.substring(0, 7) || "Manual trigger"}</span>],
                ["Duration", deployment.buildDurationMs ? `${(deployment.buildDurationMs / 1000).toFixed(1)}s` : "—"],
              ].map(([label, val], i) => (
                <div key={i} className="grid grid-cols-2 gap-1 border-b border-border/30 pb-3 last:border-0 last:pb-0">
                  <div className="text-muted-foreground">{label as string}</div>
                  <div className="font-medium">{val as React.ReactNode}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {deployment.errorMessage && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-red-400 text-base flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-sm text-red-300 whitespace-pre-wrap break-all">
                {deployment.errorMessage}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Error card on mobile */}
      {deployment.errorMessage && (
        <Card className="border-red-500/30 bg-red-500/5 md:hidden">
          <CardHeader>
            <CardTitle className="text-red-400 text-sm flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-xs text-red-300 whitespace-pre-wrap break-all">
            {deployment.errorMessage}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
