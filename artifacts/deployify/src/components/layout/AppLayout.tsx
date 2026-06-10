import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, Globe, Terminal, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Domains", href: "/domains", icon: Globe },
];

function NavLinks({ onNav }: { onNav?: () => void }) {
  const [location] = useLocation();
  return (
    <nav className="flex flex-col p-4 gap-1">
      {navItems.map((item) => {
        const isActive =
          location === item.href ||
          (item.href !== "/" && location.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
              isActive
                ? "bg-primary/10 text-primary font-medium shadow-[inset_2px_0_0_hsl(var(--primary))]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 bg-primary rounded flex items-center justify-center shadow-[0_0_15px_rgba(100,100,255,0.3)] shrink-0">
        <Terminal className="text-primary-foreground h-5 w-5" />
      </div>
      <span className="font-bold tracking-tight text-lg">Deployify</span>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground dark">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card/30 flex-col shrink-0">
        <div className="p-5 border-b border-border/50">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks onNav={() => setMobileOpen(false)} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/30 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Logo />
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
