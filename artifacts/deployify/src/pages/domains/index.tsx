import { useListDomains, useDeleteDomain, getListDomainsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    if(confirm("Are you sure you want to delete this domain?")) {
      deleteDomain.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDomainsQueryKey() })
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
          <p className="text-muted-foreground">Manage custom domains and DNS records.</p>
        </div>
        <Link href="/domains/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Domain
          </Button>
        </Link>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}
            </div>
          ) : domains && domains.length > 0 ? (
            <div className="divide-y divide-border/50">
              {domains.map((domain) => (
                <Link key={domain.id} href={`/domains/${domain.id}`}>
                  <div className="flex items-center justify-between p-6 hover:bg-card/80 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center border border-border">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-medium group-hover:text-primary transition-colors">{domain.name}</span>
                          <StatusBadge status={domain.status} />
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
                          <span>Added {format(new Date(domain.createdAt), "MMM d, yyyy")}</span>
                          <span className="flex items-center gap-1">
                            <Shield className={`h-3.5 w-3.5 ${domain.sslStatus === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                            SSL {domain.sslStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {domain.projectId && (
                        <div className="hidden md:flex items-center gap-2 text-sm px-3 py-1 bg-secondary/50 rounded-full text-muted-foreground">
                          Linked to Project #{domain.projectId}
                        </div>
                      )}
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity" onClick={(e) => handleDelete(e, domain.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No domains yet</h2>
              <p className="text-muted-foreground max-w-sm mb-6">
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