import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, Globe, Terminal } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Domains", href: "/domains", icon: Globe },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground dark">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/30 flex flex-col">
        <div className="p-5 flex items-center gap-3 border-b border-border/50">
          <div className="h-8 w-8 bg-primary rounded flex items-center justify-center shadow-[0_0_15px_rgba(100,100,255,0.3)]">
            <Terminal className="text-primary-foreground h-5 w-5" />
          </div>
          <span className="font-bold tracking-tight text-lg">Deployify</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium shadow-[inset_2px_0_0_hsl(var(--primary))]" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}