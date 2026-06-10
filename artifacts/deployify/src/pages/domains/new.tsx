import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateDomain, useListProjects, getListDomainsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Info } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Domain name is required").regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, "Must be a valid domain name (e.g. example.com)"),
  projectId: z.string().optional(),
});

export default function NewDomain() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: projects } = useListProjects();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      projectId: "none",
    },
  });

  const createDomain = useCreateDomain();

  function onSubmit(values: z.infer<typeof formSchema>) {
    createDomain.mutate({
      data: {
        name: values.name,
        projectId: values.projectId && values.projectId !== "none" ? parseInt(values.projectId, 10) : undefined,
      }
    }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListDomainsQueryKey() });
        setLocation(`/domains/${data.id}`);
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/domains")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Domain</h1>
          <p className="text-muted-foreground">Connect a custom domain to your projects.</p>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-start gap-3 text-sm text-indigo-200">
                <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  After adding your domain, you'll need to configure your DNS settings. We'll provide the exact records you need to add to verify ownership.
                </p>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain Name</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com" {...field} />
                    </FormControl>
                    <FormDescription>Do not include http:// or www. Just the root domain or subdomain.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Project (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (Configure Later)</SelectItem>
                        {projects?.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Route traffic from this domain to a specific project.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-6">
              <Button type="submit" disabled={createDomain.isPending}>
                {createDomain.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                ) : (
                  "Add Domain"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}