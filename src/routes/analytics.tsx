import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Flame, Timer, Gauge, Snowflake } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Last Minute Life Saver" }] }),
  component: () => <AppShell><Analytics /></AppShell>,
});

type Stats = { focusMin: number; score: number; procrastination: number; streak: number; byDay: { day: string; minutes: number }[] };

function Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(); since.setDate(since.getDate() - 6); since.setHours(0,0,0,0);
      const [{ data: tasks }, { data: events }, { data: prof }] = await Promise.all([
        supabase.from("tasks").select("status,priority,created_at,completed_at,focus_minutes").eq("user_id", user.id).gte("created_at", since.toISOString()),
        supabase.from("calendar_events").select("starts_at,ends_at").eq("user_id", user.id).gte("starts_at", since.toISOString()),
        supabase.from("profiles").select("streak").eq("id", user.id).maybeSingle(),
      ]);
      const done = (tasks ?? []).filter((t) => t.status === "done");
      const total = (tasks ?? []).length || 1;
      const focusMin = (events ?? []).reduce((sum, e) => sum + Math.max(0, (new Date(e.ends_at).getTime() - new Date(e.starts_at).getTime()) / 60000), 0);
      const score = Math.round((done.length / total) * 100);
      const procrastination = Math.round(((tasks ?? []).filter((t) => t.status !== "done").length / total) * 100);
      const byDay: { day: string; minutes: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const minutes = (events ?? []).filter((e) => {
          const t = new Date(e.starts_at).getTime();
          return t >= d.getTime() && t < next.getTime();
        }).reduce((s, e) => s + Math.max(0, (new Date(e.ends_at).getTime() - new Date(e.starts_at).getTime()) / 60000), 0);
        byDay.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), minutes: Math.round(minutes) });
      }
      setStats({ focusMin: Math.round(focusMin), score, procrastination, streak: prof?.streak ?? 0, byDay });
    })();
  }, [user]);

  if (!stats) return <div className="text-muted-foreground">Crunching numbers…</div>;

  const cards = [
    { label: "Focus time (7d)", value: `${stats.focusMin}m`, icon: Timer },
    { label: "Productivity score", value: `${stats.score}%`, icon: Gauge },
    { label: "Procrastination rate", value: `${stats.procrastination}%`, icon: Snowflake },
    { label: "Streak", value: `${stats.streak} 🔥`, icon: Flame },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="grid h-8 w-8 place-items-center rounded-lg gradient-bg"><c.icon className="h-4 w-4" /></div>
            </div>
            <div className="mt-3 text-3xl font-bold gradient-text">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card mt-6 p-5">
        <h2 className="mb-4 font-display font-semibold">Focus minutes this week</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={stats.byDay}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.6 0.22 285)" />
                  <stop offset="100%" stopColor="oklch(0.62 0.2 250)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.02 280)" />
              <XAxis dataKey="day" stroke="oklch(0.5 0.03 280)" fontSize={12} />
              <YAxis stroke="oklch(0.5 0.03 280)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.02 280)" }} />
              <Bar dataKey="minutes" fill="url(#g)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
