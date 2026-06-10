import { useListDomains, useDeleteDomain, getListDomainsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Plus, Globe, Shield, Trash2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Domains() {
  const { data: domains, isLoading } = useListDomains();
  const queryClient = useQueryClient();
  const deleteDomain = useDeleteDomain();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this domain?")) {
      deleteDomain.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDomainsQueryKey() })
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Domains</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage custom domains and DNS records.</p>
        </div>
        <Link href="/domains/new">
          <Button size="sm" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Domain</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}
            </div>
          ) : domains && domains.length > 0 ? (
            <div className="divide-y divide-border/50">
              {domains.map((domain) => (
                <Link key={domain.id} href={`/domains/${domain.id}`}>
                  <div className="flex items-center gap-3 p-4 md:p-6 hover:bg-card/80 transition-colors cursor-pointer group">
                    <div className="h-9 w-9 md:h-10 md:w-10 rounded bg-secondary flex items-center justify-center border border-border shrink-0">
                      <Globe className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm md:text-base font-medium group-hover:text-primary transition-colors truncate">
                          {domain.name}
                        </span>
                        <StatusBadge status={domain.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        <span>{format(new Date(domain.createdAt), "MMM d, yyyy")}</span>
                        <span className="flex items-center gap-1">
                          <Shield className={`h-3 w-3 ${domain.sslStatus === "active" ? "text-emerald-500" : "text-muted-foreground"}`} />
                          SSL {domain.sslStatus}
                        </span>
                        {domain.projectId && (
                          <span className="hidden sm:inline">Project #{domain.projectId}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDelete(e, domain.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No domains yet</h2>
              <p className="text-muted-foreground max-w-sm mb-6 text-sm">
                Add a custom domain to your projects for a professional look.
              </p>
              <Link href="/domains/new">
                <Button>Add Domain</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
