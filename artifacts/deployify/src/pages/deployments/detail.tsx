import { useParams, Link } from "wouter";
import { 
  useGetDeployment, 
  useGetDeploymentLogs,
  useCancelDeployment,
  usePromoteDeployment,
  useDeleteDeployment,
  useAnalyzeDeployment,
  getGetDeploymentQueryKey,
  getListDeploymentsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, ExternalLink, RefreshCw, Terminal, UploadCloud, Trash2, Sparkles, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Info, Zap } from "lucide-react";
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

function HealthScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">score</span>
      </div>
    </div>
  );
}

function BuildStagePipeline({ stages }: { stages: Array<{ name: string; status: string; durationMs: number }> }) {
  return (
    <div className="space-y-2">
      {stages.map((stage, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full shrink-0 ${
            stage.status === "success" ? "bg-green-500" :
            stage.status === "failed" ? "bg-red-500" : "bg-amber-500"
          }`} />
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className={`text-xs ${stage.status === "failed" ? "text-red-400" : "text-muted-foreground"}`}>
              {stage.name}
            </span>
            <span className="text-xs text-muted-foreground/60 ml-2 shrink-0">
              {(stage.durationMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div className={`text-xs shrink-0 ${
            stage.status === "success" ? "text-green-500" :
            stage.status === "failed" ? "text-red-400" : "text-amber-400"
          }`}>
            {stage.status === "success" ? "✓" : stage.status === "failed" ? "✗" : "~"}
          </div>
        </div>
      ))}
    </div>
  );
}

function AIAnalysisCard({ deploymentId }: { deploymentId: number }) {
  const [enabled, setEnabled] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: analysis, isLoading } = useAnalyzeDeployment(deploymentId, {
    query: { enabled }
  });

  const severityIcon = (s: string) => {
    if (s === "error") return <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
    if (s === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    return <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
  };

  const severityBg = (s: string) => {
    if (s === "error") return "border-red-500/20 bg-red-500/5";
    if (s === "warning") return "border-amber-500/20 bg-amber-500/5";
    return "border-blue-500/20 bg-blue-500/5";
  };

  if (!enabled) {
    return (
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-indigo-300">AI Build Analyzer</p>
              <p className="text-xs text-muted-foreground">Detect issues, get fix suggestions, and see a health score</p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shrink-0"
            onClick={() => setEnabled(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Analyze
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="py-6 flex items-center gap-3">
          <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
          <span className="text-sm text-indigo-300">AI is analyzing your build logs…</span>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <CardTitle className="text-sm md:text-base text-indigo-200">AI Build Analysis</CardTitle>
          </div>
          <HealthScoreRing score={analysis.healthScore} />
        </div>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-2">{analysis.summary}</p>
      </CardHeader>

      {analysis.buildStages && analysis.buildStages.length > 0 && (
        <CardContent className="pt-0 pb-3 border-b border-border/30">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            Build Pipeline
          </p>
          <BuildStagePipeline stages={analysis.buildStages} />
        </CardContent>
      )}

      {analysis.issues.length > 0 && (
        <CardContent className="pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {analysis.issues.length} issue{analysis.issues.length !== 1 ? "s" : ""} detected
          </p>
          {analysis.issues.map((issue, i) => (
            <div key={i} className={`rounded-lg border p-3 ${severityBg(issue.severity ?? "info")}`}>
              <button
                className="w-full flex items-center justify-between gap-2 text-left"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {severityIcon(issue.severity ?? "info")}
                  <span className="text-xs md:text-sm font-medium truncate">{issue.title}</span>
                </div>
                {expanded === i
                  ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                }
              </button>
              {expanded === i && (
                <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <p>{issue.description}</p>
                  <div className="rounded bg-background/30 p-2 border border-border/30">
                    <span className="font-semibold text-foreground/80">Fix: </span>
                    {issue.fix}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      )}

      {analysis.issues.length === 0 && (
        <CardContent className="pt-3 pb-4 flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          No issues detected — build looks healthy!
        </CardContent>
      )}
    </Card>
  );
}

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
    return "text-emerald-400/80";
  };

  const getLogPrefix = (level: string) => {
    if (level === "error") return "✗";
    if (level === "warn") return "⚠";
    return " ";
  };

  const isBuilding = deployment.status === "building" || deployment.status === "queued";
  const isReady = deployment.status === "ready";
  const isDone = !isBuilding;

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
            <h1 className="text-lg md:text-2xl font-bold tracking-tight font-mono">
              {deployment.commitSha ? deployment.commitSha.substring(0, 7) : `#${deployment.id}`}
            </h1>
            <StatusBadge status={deployment.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span className="bg-secondary/50 px-1.5 py-0.5 rounded capitalize">{deployment.environment}</span>
            <span>•</span>
            <span className="font-mono">{deployment.branch}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{format(new Date(deployment.createdAt), "MMM d, yyyy HH:mm")}</span>
          </div>
          {deployment.commitMessage && (
            <p className="text-xs text-muted-foreground mt-1 truncate max-w-md italic">"{deployment.commitMessage}"</p>
          )}
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

      {/* AI Analysis — shown when deployment is done */}
      {isDone && <AIAnalysisCard deploymentId={deploymentId} />}

      {/* Main grid */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Build logs */}
        <div className="md:col-span-2">
          <Card className="bg-[#0A0A10] border-border/40 shadow-xl overflow-hidden flex flex-col h-[320px] md:h-[560px]">
            <CardHeader className="bg-card/30 border-b border-border/30 py-2.5 px-4 flex flex-row items-center justify-between space-y-0 shrink-0">
              <CardTitle className="text-xs font-mono flex items-center gap-2 text-muted-foreground">
                <Terminal className="h-3.5 w-3.5" />
                Build Output
              </CardTitle>
              {isBuilding && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Building…
                </div>
              )}
              {isReady && (
                <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready
                </div>
              )}
              {(deployment.status === "failed" || deployment.status === "error") && (
                <div className="flex items-center gap-2 text-xs text-red-400 font-mono">
                  <Ban className="h-3 w-3" />
                  Failed
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 font-mono text-xs leading-5">
              {logsLoading && !logs?.length ? (
                <div className="p-4 text-muted-foreground/50 animate-pulse">Initializing build environment…</div>
              ) : (
                <div className="py-2">
                  {logs?.map((log, idx) => (
                    <div key={log.id} className={`flex gap-3 px-4 py-0.5 hover:bg-white/[0.03] ${
                      log.level === "error" ? "bg-red-500/5 border-l-2 border-red-500/40" :
                      log.level === "warn" ? "bg-amber-500/5 border-l-2 border-amber-500/30" : ""
                    }`}>
                      <span className="text-muted-foreground/30 shrink-0 select-none w-[52px] text-right tabular-nums">
                        {format(new Date(log.timestamp), "HH:mm:ss")}
                      </span>
                      <span className={`${getLogColor(log.level)} shrink-0 select-none`}>
                        {getLogPrefix(log.level)}
                      </span>
                      <span className={`${getLogColor(log.level)} break-all leading-5`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details sidebar (desktop only) */}
        <div className="hidden md:block space-y-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Status", <span className="capitalize font-medium">{deployment.status}</span>],
                ["Environment", <span className="capitalize font-medium">{deployment.environment}</span>],
                ["Branch", <span className="font-mono font-medium">{deployment.branch}</span>],
                ["Commit", <span className="font-mono font-medium">{deployment.commitSha?.substring(0, 7) || "Manual trigger"}</span>],
                ["Duration", <span className="font-medium">{deployment.buildDurationMs ? `${(deployment.buildDurationMs / 1000).toFixed(1)}s` : "—"}</span>],
              ].map(([label, val], i) => (
                <div key={i} className="flex items-center justify-between gap-2 border-b border-border/20 pb-2.5 last:border-0 last:pb-0">
                  <div className="text-muted-foreground text-xs">{label as string}</div>
                  <div className="text-xs text-right">{val as React.ReactNode}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {deployment.deployUrl && (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-2">Preview URL</p>
                <a
                  href={deployment.deployUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 break-all flex items-start gap-1.5 group"
                >
                  <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                  {deployment.deployUrl}
                </a>
              </CardContent>
            </Card>
          )}

          {deployment.errorMessage && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-400 text-xs flex items-center gap-2">
                  <Ban className="h-3.5 w-3.5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-xs text-red-300/90 whitespace-pre-wrap break-all">
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
