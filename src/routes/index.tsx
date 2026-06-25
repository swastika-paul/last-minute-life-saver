import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, CalendarClock, Trophy, Mic, ListChecks, LineChart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Last Minute Life Saver — AI productivity that listens" },
      { name: "description", content: "Voice-first onboarding, morning AI check-ins, auto-scheduled tasks, and rewards that keep your streak alive." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-bg"><Sparkles className="h-5 w-5" /></div>
          <span className="font-display text-lg font-bold">Last Minute Life Saver</span>
        </div>
        <Link to="/checkin" className="rounded-full gradient-bg px-5 py-2 text-sm font-medium shadow-[var(--shadow-glow)]">Open app</Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/60 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
          <Sparkles className="h-3 w-3" /> AI productivity companion
        </span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
          Save your day, <span className="gradient-text">one task at a time</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Talk to your AI each morning, get a priority-ranked plan, auto-schedule it onto your calendar, and watch your streak grow.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/checkin" className="rounded-full gradient-bg px-6 py-3 text-sm font-semibold shadow-[var(--shadow-glow)]">Try the demo</Link>
          <a href="#features" className="rounded-full border border-primary/20 bg-white/60 px-6 py-3 text-sm font-semibold backdrop-blur">See features</a>
        </div>

        <div id="features" className="mt-20 grid gap-5 md:grid-cols-3">
          {[
            { icon: Mic, title: "Voice onboarding", body: "Tell us about your life. We listen and personalize." },
            { icon: Sparkles, title: "Morning AI check-in", body: "Chat with your AI coach. It turns thoughts into tasks." },
            { icon: ListChecks, title: "Priority cards", body: "Critical, Medium, Low — triage in one tap." },
            { icon: CalendarClock, title: "Auto scheduling", body: "AI fills your calendar around your day." },
            { icon: LineChart, title: "Focus analytics", body: "Productivity score, focus time, streak." },
            { icon: Trophy, title: "Rewards & leaderboard", body: "Earn points, climb the board, stay motivated." },
          ].map((f, i) => (
            <div key={i} className="glass-card p-6 text-left">
              <div className="grid h-10 w-10 place-items-center rounded-xl gradient-bg"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
