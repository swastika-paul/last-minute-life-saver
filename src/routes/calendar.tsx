import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { autoSchedule } from "@/lib/ai.functions";
import { Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";

type Event = { id: string; title: string; starts_at: string; ends_at: string };

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Last Minute Life Saver" }] }),
  component: () => <AppShell><CalendarPage /></AppShell>,
});

function CalendarPage() {
  const { user } = useAuth();
  const schedule = useServerFn(autoSchedule);
  const [events, setEvents] = useState<Event[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user) return;
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const { data } = await supabase.from("calendar_events").select("id,title,starts_at,ends_at").eq("user_id", user.id).gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at");
    setEvents((data ?? []) as Event[]);
  }
  useEffect(() => { load(); }, [user]);

  async function run() {
    setBusy(true);
    try {
      const r = await schedule({ data: { dayStartHour: 9, dayEndHour: 18 } });
      toast.success(`Scheduled ${r.scheduled} blocks for today`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8..19

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">AI Calendar</h1>
          <p className="text-sm text-muted-foreground">Auto-scheduled around your priorities.</p>
        </div>
        <button onClick={run} disabled={busy} className="flex items-center gap-2 rounded-full gradient-bg px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-glow)] disabled:opacity-50">
          <Sparkles className="h-4 w-4" /> {busy ? "Scheduling…" : "Auto-schedule today"}
        </button>
      </div>

      <div className="glass-card p-4">
        <h2 className="mb-4 font-display font-semibold">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2>
        <div className="relative">
          {hours.map((h) => (
            <div key={h} className="flex items-start gap-3 border-t border-border/60 py-3 first:border-t-0">
              <div className="w-14 text-xs text-muted-foreground">{h}:00</div>
              <div className="flex-1 space-y-1">
                {events.filter((e) => new Date(e.starts_at).getHours() === h).map((e) => {
                  const mins = Math.round((new Date(e.ends_at).getTime() - new Date(e.starts_at).getTime()) / 60000);
                  return (
                    <div key={e.id} className="rounded-xl gradient-bg p-3 text-sm shadow-[var(--shadow-card)] animate-in fade-in slide-in-from-left-2">
                      <div className="font-semibold">{e.title}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs opacity-90"><Clock className="h-3 w-3" /> {fmt(e.starts_at)} – {fmt(e.ends_at)} · {mins}m</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">No events yet. Click <span className="font-medium text-primary">Auto-schedule today</span> to plan your day.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function fmt(s: string) {
  return new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
