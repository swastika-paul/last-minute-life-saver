import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(body: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Morning check-in: AI listens to user, replies warmly, and extracts tasks. */
export const checkinReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
    lifestyle: z.string().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const system = `You are "Last Minute", a calm AI productivity coach doing a morning check-in.
- Listen warmly. Ask one clarifying question at most.
- Extract concrete, doable tasks from what the user shares.
- Return STRICT JSON only with shape:
  { "reply": string, "tasks": [{ "title": string, "priority": "critical"|"medium"|"low", "estimateMinutes": number }] }
- "tasks" may be empty if the user is just venting.
User lifestyle context: ${data.lifestyle ?? "unknown"}`;

    const messages = [
      { role: "system", content: system },
      ...data.history,
    ];

    const json = await callAI({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
    });
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        reply: String(parsed.reply ?? "Got it."),
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 8).map((t: any) => ({
          title: String(t.title ?? "Task"),
          priority: ["critical", "medium", "low"].includes(t.priority) ? t.priority : "medium",
          estimateMinutes: Math.max(15, Math.min(180, Number(t.estimateMinutes) || 30)),
        })) : [],
      };
    } catch {
      return { reply: content || "Got it.", tasks: [] };
    }
  });

/** Auto-schedule todo tasks into the day. Returns generated events for today. */
export const autoSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    dayStartHour: z.number().min(0).max(23).default(9),
    dayEndHour: z.number().min(1).max(24).default(18),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id,title,priority,focus_minutes,status")
      .eq("user_id", userId)
      .neq("status", "done");

    // delete existing events for today first
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    await supabase.from("calendar_events").delete().eq("user_id", userId).gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString());

    const order = { critical: 0, medium: 1, low: 2 } as const;
    const sorted = (tasks ?? []).slice().sort((a, b) => order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order]);

    const events: { user_id: string; task_id: string; title: string; starts_at: string; ends_at: string }[] = [];
    let cursor = new Date(); cursor.setHours(data.dayStartHour, 0, 0, 0);
    if (cursor < new Date()) cursor = new Date(Math.ceil(Date.now() / (15 * 60 * 1000)) * (15 * 60 * 1000));
    const endOfDay = new Date(); endOfDay.setHours(data.dayEndHour, 0, 0, 0);

    for (const t of sorted) {
      const mins = t.focus_minutes && t.focus_minutes > 0 ? t.focus_minutes : (t.priority === "critical" ? 60 : t.priority === "medium" ? 45 : 30);
      const startAt = new Date(cursor);
      const endAt = new Date(cursor.getTime() + mins * 60 * 1000);
      if (endAt > endOfDay) break;
      events.push({ user_id: userId, task_id: t.id, title: t.title, starts_at: startAt.toISOString(), ends_at: endAt.toISOString() });
      cursor = new Date(endAt.getTime() + 10 * 60 * 1000); // 10-min break
    }
    if (events.length) await supabase.from("calendar_events").insert(events);
    return { scheduled: events.length };
  });
