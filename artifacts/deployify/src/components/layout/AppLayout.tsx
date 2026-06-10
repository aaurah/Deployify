import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, Globe, Terminal, Menu, X, ShieldCheck, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClerk, useUser } from "@clerk/react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Domains", href: "/domains", icon: Globe },
];

const adminItems = [
  { name: "Admin", href: "/admin", icon: ShieldCheck },
];

function NavLinks({ onNav }: { onNav?: () => void }) {
  const [location] = useLocation();

  const renderItem = (item: { name: string; href: string; icon: React.ElementType }) => {
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
  };

  return (
    <nav className="flex flex-col p-4 gap-6">
      <div className="flex flex-col gap-1">
        {navItems.map(renderItem)}
      </div>

      <div className="flex flex-col gap-1">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          System
        </div>
        {adminItems.map(renderItem)}
      </div>
    </nav>
  );
}

function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = (user.fullName || user.primaryEmailAddress?.emailAddress || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md hover:bg-secondary transition-colors text-left"
      >
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        {!compact && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {user.fullName || "User"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user.primaryEmailAddress?.emailAddress}
              </div>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border/50">
              <div className="text-sm font-medium text-foreground truncate">
                {user.fullName || "User"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user.primaryEmailAddress?.emailAddress}
              </div>
            </div>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
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
        <div className="p-3 border-t border-border/50">
          <UserMenu />
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
        <div className="p-3 border-t border-border/50">
          <UserMenu />
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
          <div className="ml-auto">
            <UserMenu compact />
          </div>
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
