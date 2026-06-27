import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";


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
    const system = `You are "Last Minute", a warm, concise AI productivity coach running a morning check-in.

Your job:
- Read what the user actually said.
- Break vague goals into concrete, doable tasks.
- Never create tasks from filler messages.
- Pick priority intelligently.
- Estimate minutes realistically.
- Reply in ONE short friendly sentence.

Return STRICT JSON only:
{
  "reply": string,
  "tasks": [
    {
      "title": string,
      "priority": "critical"|"medium"|"low",
      "estimateMinutes": number
    }
  ]
}

User lifestyle context: ${data.lifestyle || "unknown"}
`;
 const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey });

const prompt = `
${system}

Conversation:
${data.history
  .map((m) => `${m.role}: ${m.content}`)
  .join("\n")}

IMPORTANT:
Return ONLY valid JSON.
`;

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
});
let content = response.text ?? "{}";

console.log("RAW GEMINI RESPONSE:");
console.log(content);

content = content
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

    try {
      console.log("Gemini response:");
console.log(content);
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
    } catch (err) {
  console.error("PARSE ERROR:", err);
  console.error("RAW CONTENT:", content);

  return { reply: "Got it.", tasks: [] };
}
  });
