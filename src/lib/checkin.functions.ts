import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
 
.handler(async ({ context, data }) => {
  
  const system = `
You are "Last Minute", an AI productivity coach.

User Lifestyle:
${data.lifestyle ?? "unknown"}

Your job:

1. Understand the user's routine.
2. Extract tasks.
3. Respect fixed commitments mentioned by the user.
4. Suggest realistic start and end times.
5. Return STRICT JSON ONLY.

Format:

{
  "reply":"string",
  "tasks":[
    {
      "title":"string",
      "priority":"critical|medium|low",
      "estimateMinutes":60,
      "startTime":"14:00",
      "endTime":"15:00"
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

const tasks = Array.isArray(parsed.tasks)
  ? parsed.tasks.slice(0, 8).map((t: any) => ({
      title: String(t.title ?? "Task"),

      priority:
        ["critical", "medium", "low"].includes(t.priority)
          ? t.priority
          : "medium",

      estimateMinutes: Math.max(
        15,
        Math.min(180, Number(t.estimateMinutes) || 30)
      ),

      startTime: String(t.startTime ?? ""),
      endTime: String(t.endTime ?? ""),
    }))
  : [];

return {
  reply: String(parsed.reply ?? "Got it."),
  tasks,
};
} catch (err) {
  console.error("PARSE ERROR:", err);
  console.error("RAW CONTENT:", content);
 return {
    reply: "Got it.",
    tasks: [],
  };
  
}
 
});
