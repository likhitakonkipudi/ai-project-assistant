import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an expert AI Project Discovery Assistant. Your role is like a combined Product Manager, CTO, Business Analyst, and Startup Advisor.

When a user shares a project idea, your job is to:
1. Ask ONE smart question at a time to understand their idea better
2. Cover these areas gradually: business problem, target audience, product type, revenue model, key features, competitors, tech stack, scale, security needs
3. If the user says something that doesn't make business sense, politely challenge it and suggest better alternatives
4. Be encouraging but honest
5. Keep responses concise and conversational

Start by understanding the core idea, then dig deeper with each message. Don't ask multiple questions at once.`;

const MODELS = [
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const filtered = messages.filter(
    (m: { role: string; content: string }) => m.role === "user" || m.role === "assistant"
  );

  for (const model of MODELS) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...filtered.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        max_tokens: 500,
      });
      const reply = response.choices[0]?.message?.content ?? "Could you repeat that?";
      return NextResponse.json({ reply });
    } catch {
      continue;
    }
  }

  return NextResponse.json({
    reply: "All models are busy right now. Please wait 1 minute and try again.",
  });
}