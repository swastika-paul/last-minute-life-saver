import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

export const checkinReply = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        history: z.array(
          z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
        ),
        lifestyle: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const system = `You are "Last Minute", a warm, concise AI productivity coach running a morning check-in.

Your job:
- Read what the user actually said. Understand the real intent (work, study, errands, health, social, rest).
- Break vague goals into concrete, doable tasks. Example: "I will solve dsa 4 ques today" -> 4 separate tasks like "Solve DSA question 1", "Solve DSA question 2", etc., each ~30m, priority "critical" (study/work commitment).
- Never echo back filler like "yes" / "ok" / "thanks" as a task. If the user only confirms or chit-chats, return an empty tasks array.
- Pick priority intelligently:
  * critical: deadlines, exams, work deliverables, study commitments, urgent calls
  * medium: health (gym, walk), routines, planning, errands
  * low: leisure, reading, tidying, hobbies
- Estimate minutes realistically (15-120).
- Reply in ONE short friendly sentence (max ~18 words). Do NOT list the tasks in the reply — the UI shows them separately.

Return STRICT JSON only:
{ "reply": string, "tasks": [{ "title": string, "priority": "critical"|"medium"|"low", "estimateMinutes": number }] }

User lifestyle context: ${data.lifestyle || "unknown"}`;

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: system }, ...data.history],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        reply: String(parsed.reply ?? "Got it."),
        tasks: Array.isArray(parsed.tasks)
          ? parsed.tasks.slice(0, 10).map((t: any) => ({
              title: String(t.title ?? "Task").slice(0, 120),
              priority: ["critical", "medium", "low"].includes(t.priority) ? t.priority : "medium",
              estimateMinutes: Math.max(10, Math.min(180, Number(t.estimateMinutes) || 30)),
            }))
          : [],
      };
    } catch {
      return { reply: "Got it.", tasks: [] };
    }
  });
