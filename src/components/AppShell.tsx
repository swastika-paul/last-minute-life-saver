import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, MessageSquareHeart, ListChecks, CalendarRange, LineChart, Trophy, LogOut, UserCircle2 } from "lucide-react";

const nav = [
  { to: "/checkin", label: "Check-in", icon: MessageSquareHeart },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/calendar", label: "Calendar", icon: CalendarRange },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/rewards", label: "Rewards", icon: Trophy },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/checkin" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-bg"><Sparkles className="h-5 w-5" /></div>
            <span className="hidden font-display text-base font-bold sm:block">Last Minute Life Saver</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => {
              const active = location.pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${active ? "gradient-bg shadow-[var(--shadow-glow)]" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/onboarding" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white text-muted-foreground hover:text-primary">
              <UserCircle2 className="h-5 w-5" />
            </Link>
            <button onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/auth" }))} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white text-muted-foreground hover:text-destructive" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-white/85 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
          {nav.map((n) => {
            const active = location.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                <n.icon className={`h-5 w-5 ${active ? "" : ""}`} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
