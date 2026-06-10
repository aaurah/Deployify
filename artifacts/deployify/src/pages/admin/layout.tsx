import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ShieldAlert } from "lucide-react";

const adminTabs = [
  { name: "Overview", href: "/admin" },
  { name: "Users", href: "/admin/users" },
  { name: "Projects", href: "/admin/projects" },
  { name: "Deployments", href: "/admin/deployments" },
  { name: "Audit Log", href: "/admin/audit-logs" },
  { name: "Settings", href: "/admin/settings" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-indigo-500/10 text-indigo-500 rounded flex items-center justify-center shrink-0">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-muted-foreground text-sm">Platform management and operations</p>
        </div>
      </div>

      <div className="border-b border-border/50">
        <nav className="flex overflow-x-auto -mb-px space-x-6 hide-scrollbar">
          {adminTabs.map((tab) => {
            const isActive = location === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="animate-in fade-in duration-500">
        {children}
      </div>
    </div>
  );
}
