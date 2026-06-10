import { AdminLayout } from "./layout";
import { useListAdminProjects } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";
import { Search, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function AdminProjects() {
  const { data: projects, isLoading } = useListAdminProjects();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const filteredProjects = projects?.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search projects..." 
              className="pl-9 bg-card/50" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredProjects.length} projects
          </div>
        </div>

        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Deployments</TableHead>
                <TableHead>Production URL</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-5 w-32 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-10 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                    <TableCell><div className="h-5 w-40 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-muted rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <TableRow 
                    key={project.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setLocation(`/projects/${project.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{project.name}</span>
                        <span className="text-xs text-muted-foreground font-normal">{project.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm capitalize">{project.framework || 'other'}</TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">{project.deploymentCount}</TableCell>
                    <TableCell>
                      {project.productionUrl ? (
                        <a 
                          href={`https://${project.productionUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {project.productionUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(project.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No projects found.
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
