import { Link } from "wouter";
import { Terminal, Zap, Globe, ShieldCheck, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Instant Deployments",
    description: "Push to deploy in seconds. Git-connected CI/CD pipelines with zero configuration.",
  },
  {
    icon: Globe,
    title: "Global Edge Network",
    description: "Your apps served from datacenters worldwide. Automatic SSL, custom domains, and DNS.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description: "Role-based access control, audit logs, environment isolation, and 2FA enforcement.",
  },
];

const highlights = [
  "Unlimited deployments",
  "Automatic SSL certificates",
  "Environment variables management",
  "Real-time build logs",
  "Domain & DNS management",
  "Analytics dashboard",
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 dark flex flex-col">
      {/* Nav */}
      <header className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <Terminal className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Deployify</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
            <Zap className="h-3 w-3" />
            Deploy in seconds, not hours
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Ship faster with{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              zero friction
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            Deployify is a full-featured deployment platform. Connect your repo, push your code, and go live instantly with global edge delivery.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 gap-2 w-full sm:w-auto">
                Start deploying free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8 w-full sm:w-auto">
                Sign in to dashboard
              </Button>
            </Link>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center pt-2">
            {highlights.map((h) => (
              <span key={h} className="flex items-center gap-1.5 text-sm text-slate-400">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {h}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3"
                >
                  <div className="h-9 w-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-slate-100">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/60 px-6 py-5 text-center text-xs text-slate-500">
        © 2026 Deployify. All rights reserved.
      </footer>
    </div>
  );
}
