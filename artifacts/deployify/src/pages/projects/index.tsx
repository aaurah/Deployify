import { useListProjects } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Plus, Github, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your deployments and configuration.</p>
        </div>
        <Link href="/projects/new">
          <Button size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted/50 rounded-t-lg border-b border-border/50" />
              <CardContent className="pt-6 space-y-3">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="group cursor-pointer bg-card/40 border-border/40 hover:border-primary/50 transition-colors h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg md:text-xl group-hover:text-primary transition-colors leading-snug">
                      {project.name}
                    </CardTitle>
                    <StatusBadge status={project.status} />
                  </div>
                  <CardDescription className="line-clamp-2 text-xs md:text-sm">
                    {project.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="px-2 py-1 bg-secondary rounded text-xs font-medium text-foreground">
                      {project.framework}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    {project.gitUrl && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Github className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate text-xs">{project.gitUrl.replace("https://github.com/", "")}</span>
                      </div>
                    )}
                    {project.productionUrl && (
                      <div className="flex items-center gap-2 text-primary/80 min-w-0">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate text-xs">{project.productionUrl.replace("https://", "")}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground pt-3 border-t border-border/50">
                    Updated {format(new Date(project.updatedAt), "MMM d, yyyy")}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center border rounded-lg border-dashed border-border/60 bg-card/20 px-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-muted-foreground max-w-sm mb-6 text-sm">
            Get started by creating your first project and deploying your code.
          </p>
          <Link href="/projects/new">
            <Button>Create Project</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
