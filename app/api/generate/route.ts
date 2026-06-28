import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateDoc(prompt: string): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });
    return response.choices[0]?.message?.content ?? "";
  } catch {
    return "Document generation failed for this section. Please try again.";
  }
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const conversation = messages
    .filter((m: { role: string; content: string }) => m.role === "user" || m.role === "assistant")
    .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const base = `Based on this project discovery conversation:\n\n${conversation}\n\n`;

  const docPrompts = [
    { key: "prd", prompt: base + "Generate a detailed Product Requirements Document (PRD) with: Vision, Goals, User Personas, User Stories, Functional Requirements, Success Metrics." },
    { key: "frd", prompt: base + "Generate a Functional Requirements Document (FRD) with: Features list, Workflows, Business Rules, Acceptance Criteria." },
    { key: "architecture", prompt: base + "Generate a Technical Architecture Document with: System Architecture, Tech Stack, Services, Database Design, APIs, Scalability Strategy." },
    { key: "roadmap", prompt: base + "Generate a 3-phase MVP Roadmap: Phase 1 (Month 1-2 core), Phase 2 (Month 3-4 growth), Phase 3 (Month 5-6 scale). Include tasks and milestones." },
    { key: "database", prompt: base + "Generate a Database Design Document with: All tables/collections, fields, relationships, and indexes." },
    { key: "api", prompt: base + "Generate an API Specification with: All endpoints, HTTP methods, request/response format, authentication." },
    { key: "uiux", prompt: base + "Generate a UI/UX Specification with: All screens, user flows, key components, design recommendations." },
    { key: "business", prompt: base + "Generate a Business Model Document with: Revenue streams, Pricing tiers, Key costs, Break-even estimate." },
    { key: "gtm", prompt: base + "Generate a Go-To-Market Strategy with: Launch plan, Marketing channels, Customer acquisition, First 90 days, KPIs." },
    { key: "investor", prompt: base + "Generate an Investor Summary with: Problem, Solution, Market size, Revenue potential, Competitive advantage." },
  ];

  const documents: Record<string, string> = {};

  for (const doc of docPrompts) {
    documents[doc.key] = await generateDoc(doc.prompt);
    await delay(1500);
  }

  return NextResponse.json({ documents });
}