import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  framework: z.string().min(1, "Framework is required"),
  gitUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  description: z.string().optional(),
});

export default function NewProject() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      framework: "Next.js",
      gitUrl: "",
      description: "",
    },
  });

  const createProject = useCreateProject();

  function onSubmit(values: z.infer<typeof formSchema>) {
    createProject.mutate({
      data: {
        name: values.name,
        framework: values.framework,
        gitUrl: values.gitUrl || undefined,
        description: values.description || undefined,
      }
    }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setLocation(`/projects/${data.id}`);
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
          <p className="text-muted-foreground">Set up a new deployment environment.</p>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="my-awesome-app" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="framework"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Framework</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a framework" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Next.js">Next.js</SelectItem>
                        <SelectItem value="React">React</SelectItem>
                        <SelectItem value="Vue">Vue</SelectItem>
                        <SelectItem value="Nuxt">Nuxt</SelectItem>
                        <SelectItem value="SvelteKit">SvelteKit</SelectItem>
                        <SelectItem value="Vite">Vite (Vanilla/Other)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gitUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Git Repository URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/username/repo" {...field} />
                    </FormControl>
                    <FormDescription>Link to your source code repository.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief description of this project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t border-border/50 pt-6">
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  "Create Project"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}