import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — Last Minute Life Saver" }] }),
  component: () => <AppShell><Onboarding /></AppShell>,
});

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("lifestyle, onboarded").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.lifestyle) setText(data.lifestyle);
    });
  }, [user]);

  function toggleListen() {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported on this browser. Type instead."); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let finalText = "";
      for (let i = 0; i < e.results.length; i++) {
        finalText += e.results[i][0].transcript;
      }
      setText(finalText);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, lifestyle: text, onboarded: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved. Let's begin!");
    navigate({ to: "/checkin" });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-3xl font-bold">Tell us about your life</h1>
      </div>
      <p className="text-muted-foreground">Your AI uses this to personalize check-ins, prioritization, and scheduling. Speak or type.</p>

      <div className="glass-card mt-6 p-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="I'm a final-year student juggling a thesis and a part-time job. Mornings are scattered, evenings I'm tired. I want to work out 3×/week and ship my side project…"
          className="w-full resize-none rounded-xl border border-input bg-white p-4 text-sm outline-none focus:border-primary"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button onClick={toggleListen} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${listening ? "bg-destructive text-destructive-foreground" : "border border-primary/30 bg-white text-primary"}`}>
            {listening ? <><MicOff className="h-4 w-4" /> Stop</> : <><Mic className="h-4 w-4" /> Speak</>}
          </button>
          <button onClick={save} disabled={saving || !text.trim()} className="rounded-full gradient-bg px-6 py-2 text-sm font-semibold shadow-[var(--shadow-glow)] disabled:opacity-50">
            {saving ? "Saving…" : "Save & continue"}
          </button>
        </div>
        {listening && <div className="mt-3 text-xs text-muted-foreground">Listening… speak naturally.</div>}
      </div>
    </div>
  );
}
