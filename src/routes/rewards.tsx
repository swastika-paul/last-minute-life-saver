import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Trophy, Crown, Medal, Flame, Lock } from "lucide-react";
import { useDemo } from "@/lib/demo-store";

type Row = { id: string; display_name: string; points: number; streak: number };

const TIERS = [
  { pts: 50, name: "Spark", icon: "✨" },
  { pts: 150, name: "Focused", icon: "🎯" },
  { pts: 400, name: "Momentum", icon: "🚀" },
  { pts: 800, name: "Unstoppable", icon: "🏆" },
];

const BOARD: Row[] = [
  { id: "u1", display_name: "Maya Chen", points: 940, streak: 21 },
  { id: "u2", display_name: "Daniel Park", points: 812, streak: 14 },
  { id: "u3", display_name: "Sofia Reyes", points: 670, streak: 9 },
  { id: "u4", display_name: "Liam O'Connor", points: 510, streak: 12 },
  { id: "me", display_name: "You", points: 0, streak: 0 },
  { id: "u5", display_name: "Aisha Khan", points: 290, streak: 6 },
  { id: "u6", display_name: "Noah Bennett", points: 240, streak: 4 },
  { id: "u7", display_name: "Emma Schultz", points: 180, streak: 3 },
];

export const Route = createFileRoute("/rewards")({
  head: () => ({ meta: [{ title: "Rewards — Last Minute Life Saver" }] }),
  component: () => <AppShell><Rewards /></AppShell>,
});

function Rewards() {
  const points = useDemo((s) => s.points);
  const streak = useDemo((s) => s.streak);

  const board = [...BOARD.map((r) => r.id === "me" ? { ...r, points, streak } : r)].sort((a, b) => b.points - a.points);
  const nextTier = TIERS.find((t) => t.pts > points) ?? TIERS[TIERS.length - 1];
  const progress = Math.min(100, Math.round((points / nextTier.pts) * 100));

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Rewards & Leaderboard</h1>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Your points</div>
              <div className="mt-1 text-4xl font-bold gradient-text">{points}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-critical/10 px-3 py-1.5 text-sm font-medium text-critical">
              <Flame className="h-4 w-4" /> {streak} day streak
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Next: {nextTier.name}</span><span>{points}/{nextTier.pts}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full gradient-bg transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIERS.map((t) => {
              const unlocked = points >= t.pts;
              return (
                <div key={t.name} className={`rounded-2xl border p-4 text-center transition ${unlocked ? "border-primary/30 bg-white shadow-[var(--shadow-card)]" : "border-dashed border-border bg-white/50 opacity-70"}`}>
                  <div className="text-3xl">{unlocked ? t.icon : <Lock className="mx-auto h-6 w-6 text-muted-foreground" />}</div>
                  <div className="mt-2 text-sm font-semibold">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.pts} pts</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold">Leaderboard</h2>
          </div>
          <ol className="space-y-2">
            {board.map((row, i) => {
              const isMe = row.id === "me";
              return (
                <li key={row.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isMe ? "border-primary/40 bg-accent" : "border-border bg-white"}`}>
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold">
                    {i === 0 ? <Crown className="h-4 w-4 text-warn-foreground" /> : i === 1 || i === 2 ? <Medal className="h-4 w-4 text-muted-foreground" /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{row.display_name} {isMe && <span className="ml-1 text-xs text-primary">(you)</span>}</div>
                    <div className="text-xs text-muted-foreground"><Flame className="mr-1 inline h-3 w-3" />{row.streak} day streak</div>
                  </div>
                  <div className="shrink-0 text-sm font-bold gradient-text">{row.points}</div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
