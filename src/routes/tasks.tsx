import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Check, Plus, Trash2, Flame, Activity, Leaf } from "lucide-react";
import { actions, useDemo, type Priority, type Task } from "@/lib/demo-store";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Last Minute Life Saver" }] }),
  component: () => <AppShell><Tasks /></AppShell>,
});

function Tasks() {
  const tasks = useDemo((s) => s.tasks);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<"all" | Priority>("all");

  function add() {
    if (!title.trim()) return;
    actions.addTask(title.trim(), priority);
    setTitle("");
  }

  const buckets: Record<Priority, Task[]> = { critical: [], medium: [], low: [] };
  tasks.filter((t) => filter === "all" || t.priority === filter).forEach((t) => buckets[t.priority].push(t));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">Triage with priority cards. Done tasks earn points.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "critical", "medium", "low"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? "gradient-bg" : "border border-border bg-white text-muted-foreground"}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="glass-card mb-6 flex flex-wrap items-center gap-2 p-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="What needs to get done?" className="min-w-[12rem] flex-1 rounded-xl border border-input bg-white px-4 py-2.5 text-sm outline-none focus:border-primary" />
        <div className="flex gap-1">
          {(["critical","medium","low"] as const).map((p) => (
            <button key={p} onClick={() => setPriority(p)} className={`rounded-full px-3 py-2 text-xs font-medium capitalize transition ${priority === p ? pclass(p, true) : "border border-border bg-white text-muted-foreground"}`}>{p}</button>
          ))}
        </div>
        <button onClick={add} className="grid h-10 w-10 place-items-center rounded-xl gradient-bg"><Plus className="h-4 w-4" /></button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Column title="Critical" icon={<Flame className="h-4 w-4" />} color="critical" tasks={buckets.critical} />
        <Column title="Medium" icon={<Activity className="h-4 w-4" />} color="warn" tasks={buckets.medium} />
        <Column title="Low" icon={<Leaf className="h-4 w-4" />} color="success" tasks={buckets.low} />
      </div>
    </div>
  );
}

function Column({ title, icon, color, tasks }: {
  title: string; icon: React.ReactNode; color: "critical" | "warn" | "success"; tasks: Task[];
}) {
  const chip = color === "critical"
    ? "bg-critical/15 text-critical"
    : color === "warn"
    ? "bg-warn/20 text-warn-foreground"
    : "bg-success/15 text-success-foreground";
  return (
    <section className="soft-card p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${chip}`}>
          {icon} {title} <span className="opacity-70">· {tasks.length}</span>
        </div>
      </header>
      <ul className="space-y-2">
        {tasks.length === 0 && <li className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">Nothing here.</li>}
        {tasks.map((t) => (
          <li key={t.id} className={`group rounded-xl border border-border bg-white p-3 transition hover:shadow-[var(--shadow-card)] ${t.status === "done" ? "opacity-60" : ""}`}>
            <div className="flex items-start gap-2">
              <button onClick={() => actions.setStatus(t.id, t.status === "done" ? "todo" : "done")} className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${t.status === "done" ? "gradient-bg border-transparent" : "border-border"}`}>
                {t.status === "done" && <Check className="h-3 w-3 text-white" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium ${t.status === "done" ? "line-through" : ""}`}>{t.title}</div>
                <div className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.focus_minutes ? `${t.focus_minutes}m` : "—"}
                </div>
              </div>
              <button onClick={() => actions.removeTask(t.id)} className="opacity-0 transition group-hover:opacity-100"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
            </div>
            <div className="mt-2 flex gap-1">
              {(["critical","medium","low"] as const).map((p) => (
                <button key={p} onClick={() => actions.setPriority(t.id, p)} className={`flex-1 rounded-md py-1 text-[10px] font-medium capitalize ${t.priority === p ? pclass(p, true) : "bg-muted text-muted-foreground"}`}>{p}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function pclass(p: Priority, active: boolean) {
  if (!active) return "";
  if (p === "critical") return "bg-critical text-critical-foreground";
  if (p === "medium") return "bg-warn text-warn-foreground";
  return "bg-success text-success-foreground";
}
