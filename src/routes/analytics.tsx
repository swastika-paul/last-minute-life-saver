import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Flame, Timer, Gauge, Snowflake } from "lucide-react";
import { useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Last Minute Life Saver" }] }),
  component: () => <AppShell><Analytics /></AppShell>,
});

function Analytics() {
  const tasks = useDemo((s) => s.tasks);
  const events = useDemo((s) => s.events);
  const streak = useDemo((s) => s.streak);

  const total = tasks.length || 1;
  const done = tasks.filter((t) => t.status === "done").length;
  const score = Math.round((done / total) * 100);
  const procrastination = Math.max(0, 100 - score);
  const focusMin = Math.round(
    events.reduce((s, e) => s + Math.max(0, (new Date(e.ends_at).getTime() - new Date(e.starts_at).getTime()) / 60000), 0)
  );

  // Seed a believable 7-day chart based on today's focus.
  const byDay: { day: string; minutes: number }[] = [];
  const seedPattern = [45, 80, 60, 120, 95, 30, focusMin || 70];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    byDay.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), minutes: seedPattern[6 - i] });
  }

  const cards = [
    { label: "Focus time today", value: `${focusMin}m`, icon: Timer },
    { label: "Productivity score", value: `${score}%`, icon: Gauge },
    { label: "Procrastination rate", value: `${procrastination}%`, icon: Snowflake },
    { label: "Streak", value: `${streak} 🔥`, icon: Flame },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass-card p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 truncate text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-bg"><c.icon className="h-4 w-4" /></div>
            </div>
            <div className="mt-3 text-3xl font-bold gradient-text">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card mt-6 p-5">
        <h2 className="mb-4 font-display font-semibold">Focus minutes this week</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={byDay}>
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
