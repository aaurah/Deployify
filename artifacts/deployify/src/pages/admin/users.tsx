import { AdminLayout } from "./layout";
import { useListAdminUsers, useCreateAdminUser, useUpdateAdminUser, useDeleteAdminUser, getListAdminUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { MoreHorizontal, Plus, Shield, ShieldAlert, User as UserIcon, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]),
});

export default function AdminUsers() {
  const { data: users, isLoading } = useListAdminUsers();
  const queryClient = useQueryClient();
  const updateAdminUser = useUpdateAdminUser();
  const deleteAdminUser = useDeleteAdminUser();
  const createAdminUser = useCreateAdminUser();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", role: "member" }
  });

  const onSubmit = (values: z.infer<typeof userSchema>) => {
    createAdminUser.mutate({ data: { ...values } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
        setIsSheetOpen(false);
        form.reset();
        toast({ title: "User created successfully" });
      }
    });
  };

  const handleUpdateRole = (id: number, role: "admin" | "member" | "viewer") => {
    updateAdminUser.mutate({ id, data: { role } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() })
    });
  };

  const handleUpdateStatus = (id: number, status: "active" | "suspended" | "pending") => {
    updateAdminUser.mutate({ id, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteAdminUser.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
          toast({ title: "User deleted" });
        }
      });
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return <Badge variant="default" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20"><ShieldAlert className="w-3 h-3 mr-1" /> Admin</Badge>;
    if (role === 'member') return <Badge variant="default" className="bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/20"><Shield className="w-3 h-3 mr-1" /> Member</Badge>;
    return <Badge variant="outline" className="text-muted-foreground"><UserIcon className="w-3 h-3 mr-1" /> Viewer</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">Users</h2>
            <Badge variant="secondary" className="rounded-full">{users?.length || 0}</Badge>
          </div>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Add New User</SheetTitle>
              </SheetHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input placeholder="jane@example.com" type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createAdminUser.isPending}>
                    {createAdminUser.isPending ? "Creating..." : "Create User"}
                  </Button>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </div>

        <Card className="bg-card/50 border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="flex gap-3 items-center"><div className="h-8 w-8 rounded-full bg-muted animate-pulse"/><div className="h-4 w-24 bg-muted animate-pulse"/></div></TableCell>
                    <TableCell><div className="h-5 w-16 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-10 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-24 bg-muted rounded animate-pulse" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border/50">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={user.role} 
                        onValueChange={(v: any) => handleUpdateRole(user.id, v)}
                      >
                        <SelectTrigger className="w-[110px] h-8 text-xs border-0 shadow-none bg-transparent hover:bg-muted focus:ring-0 focus:ring-offset-0 px-2">
                          <SelectValue>{getRoleBadge(user.role)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={user.status} 
                        onValueChange={(v: any) => handleUpdateStatus(user.id, v)}
                      >
                        <SelectTrigger className="w-[110px] h-8 text-xs border-0 shadow-none bg-transparent hover:bg-muted focus:ring-0 focus:ring-offset-0 px-2">
                          <SelectValue><StatusBadge status={user.status} /></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">
                      {user.twoFactorEnabled ? (
                        <span className="text-emerald-500">Enabled</span>
                      ) : (
                        <span className="text-muted-foreground">Disabled</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {user.lastLoginAt ? format(new Date(user.lastLoginAt), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No users found.
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
