import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { checkinReply } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Send, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkin")({
  head: () => ({ meta: [{ title: "Morning Check-in — Last Minute Life Saver" }] }),
  component: () => <AppShell><Checkin /></AppShell>,
});

type Msg = { role: "user" | "assistant"; content: string };
type Suggested = { title: string; priority: "critical" | "medium" | "low"; estimateMinutes: number };

function Checkin() {
  const { user } = useAuth();
  const callAI = useServerFn(checkinReply);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Good to see you. How are you feeling, and what's on your mind today?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggested, setSuggested] = useState<Suggested[]>([]);
  const [lifestyle, setLifestyle] = useState<string | undefined>();
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("lifestyle, onboarded").eq("id", user.id).maybeSingle().then(({ data }) => {
      setLifestyle(data?.lifestyle ?? undefined);
    });
  }, [user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, suggested]);

  function toggleListen() {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported here."); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setInput(t);
    };
    rec.onend = () => setListening(false);
    rec.start(); recRef.current = rec; setListening(true);
  }

  async function send() {
    if (!input.trim() || busy) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const res = await callAI({ data: { history: next, lifestyle } });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      if (res.tasks.length) setSuggested((s) => [...s, ...res.tasks]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  }

  async function addTask(t: Suggested) {
    if (!user) return;
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id, title: t.title, priority: t.priority, focus_minutes: t.estimateMinutes,
    });
    if (error) return toast.error(error.message);
    setSuggested((s) => s.filter((x) => x !== t));
    toast.success("Added to tasks");
  }
  async function addAll() {
    if (!user || !suggested.length) return;
    const { error } = await supabase.from("tasks").insert(suggested.map((t) => ({
      user_id: user.id, title: t.title, priority: t.priority, focus_minutes: t.estimateMinutes,
    })));
    if (error) return toast.error(error.message);
    setSuggested([]); toast.success("All tasks added");
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="glass-card flex h-[70vh] flex-col p-4">
        <div className="mb-3 flex items-center gap-2 px-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold">Morning check-in</h2>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "gradient-bg" : "bg-white border border-border"}`}>{m.content}</div>
            </div>
          ))}
          {busy && <div className="text-xs text-muted-foreground">AI is thinking…</div>}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex items-end gap-2 rounded-2xl border border-input bg-white p-2">
          <button onClick={toggleListen} className={`grid h-10 w-10 place-items-center rounded-xl ${listening ? "bg-destructive text-destructive-foreground" : "bg-accent text-primary"}`}>
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder="Tell the AI what's going on…" className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" />
          <button onClick={send} disabled={busy || !input.trim()} className="grid h-10 w-10 place-items-center rounded-xl gradient-bg disabled:opacity-50"><Send className="h-4 w-4" /></button>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Suggested tasks</h3>
            {suggested.length > 0 && <button onClick={addAll} className="text-xs font-medium text-primary hover:underline">Add all</button>}
          </div>
          {suggested.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">The AI will turn your thoughts into tasks here.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {suggested.map((t, i) => (
                <li key={i} className="flex items-start justify-between gap-2 rounded-xl border border-border bg-white p-3">
                  <div>
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <PriorityPill p={t.priority} /> · {t.estimateMinutes}m
                    </div>
                  </div>
                  <button onClick={() => addTask(t)} className="grid h-7 w-7 place-items-center rounded-full gradient-bg"><Plus className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!lifestyle && (
          <Link to="/onboarding" className="glass-card block p-4 text-sm">
            <div className="font-medium">Personalize your AI</div>
            <div className="mt-1 text-xs text-muted-foreground">Tell us about your life so check-ins feel like yours.</div>
          </Link>
        )}
      </aside>
    </div>
  );
}

function PriorityPill({ p }: { p: "critical" | "medium" | "low" }) {
  const map = { critical: "bg-critical/15 text-critical", medium: "bg-warn/20 text-warn-foreground", low: "bg-success/15 text-success-foreground" };
  return <span className={`rounded-full px-2 py-0.5 ${map[p]}`}>{p}</span>;
}
