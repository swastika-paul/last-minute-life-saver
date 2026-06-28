import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Flame, Lock } from "lucide-react";
import { useDemo } from "@/lib/demo-store";



const TIERS = [
  { pts: 50, name: "Spark", icon: "✨" },
  { pts: 150, name: "Focused", icon: "🎯" },
  { pts: 400, name: "Momentum", icon: "🚀" },
  { pts: 800, name: "Unstoppable", icon: "🏆" },
];



export const Route = createFileRoute("/rewards")({
  head: () => ({ meta: [{ title: "Rewards — Last Minute Life Saver" }] }),
  component: () => <AppShell><Rewards /></AppShell>,
});

function Rewards() {
  const points = useDemo((s) => s.points);
  const streak = useDemo((s) => s.streak);
const getRank = (points:number) => {
  if(points >= 1000) return "Productivity Master";
  if(points >= 500) return "Focus Champion";
  if(points >= 250) return "Task Warrior";
  return "Beginner";
};

const rank = getRank(points);
  
  const nextTier = TIERS.find((t) => t.pts > points) ?? TIERS[TIERS.length - 1];
  const progress = Math.min(100, Math.round((points / nextTier.pts) * 100));

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Rewards & Achievement</h1>
<div className="glass-card mb-6 p-6">
  <h2 className="text-2xl font-bold">
    🏆 {rank}
  </h2>

  <div className="mt-3 flex flex-wrap gap-6">
    <span>⭐ XP: {points}</span>
    <span>🔥 Streak: {streak}</span>
  </div>
</div>
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
<div className="glass-card mt-6 p-6">
  <h2 className="mb-4 text-xl font-semibold">
    Achievements
  </h2>

  <div className="flex flex-wrap gap-3">

    {streak >= 3 && (
      <div className="rounded-xl border px-4 py-2">
        🔥 3 Day Streak
      </div>
    )}

    {streak >= 7 && (
      <div className="rounded-xl border px-4 py-2">
        🚀 7 Day Streak
      </div>
    )}

    {points >= 50 && (
      <div className="rounded-xl border px-4 py-2">
        ✨ Spark
      </div>
    )}

    {points >= 150 && (
      <div className="rounded-xl border px-4 py-2">
        🎯 Focused
      </div>
    )}

    {points >= 400 && (
      <div className="rounded-xl border px-4 py-2">
        🚀 Momentum
      </div>
    )}

    {points >= 800 && (
      <div className="rounded-xl border px-4 py-2">
        🏆 Unstoppable
      </div>
    )}

  </div>
</div>
        
      </div>
    </div>
  );
}
