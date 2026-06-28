import Link from "next/link";
import { Sparkles, Mic, FileText, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen text-white" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)" }}>

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-purple-400" />
          <span className="font-bold text-lg">AI Project Assistant</span>
        </div>
        <Link
          href="/assistant"
          className="px-4 py-2 rounded-full text-sm font-medium text-white transition"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
        >
          Launch Assistant →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-4 py-2 rounded-full text-sm mb-6">
          <Sparkles size={14} /> AI-Powered Project Planning
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight max-w-3xl">
          Turn Your Idea Into a
          <span style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> Complete Project Plan</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Come with just 10% clarity. Leave with a full PRD, technical architecture, MVP roadmap, and investor-ready documentation — generated through a simple conversation.
        </p>
        <div className="flex gap-4">
          <Link
            href="/assistant"
            className="px-8 py-4 rounded-xl font-semibold text-white text-lg transition"
            style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}
          >
            Start for Free →
          </Link>
          <a href="#features" className="px-8 py-4 rounded-xl font-semibold text-gray-300 text-lg border border-white/10 hover:border-white/20 transition">
            See Features
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Ship</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center mb-4">
              <Mic size={20} className="text-purple-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Voice Conversations</h3>
            <p className="text-gray-400 text-sm">Talk to the AI naturally using your voice. No typing required — just speak your idea.</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4">
              <Zap size={20} className="text-blue-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Smart Discovery</h3>
            <p className="text-gray-400 text-sm">AI asks the right questions — business model, audience, tech stack, competitors, and more.</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center mb-4">
              <FileText size={20} className="text-green-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Complete Documentation</h3>
            <p className="text-gray-400 text-sm">Get PRD, FRD, technical architecture, MVP roadmap, and investor summary instantly.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-4 py-20">
        <h2 className="text-3xl font-bold mb-4">Ready to Build Something Amazing?</h2>
        <p className="text-gray-400 mb-8">Join builders who turn ideas into plans in minutes, not months.</p>
        <Link
          href="/assistant"
          className="px-8 py-4 rounded-xl font-semibold text-white text-lg transition"
          style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}
        >
          Start Building Now →
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 text-sm border-t border-white/5">
        © 2026 AI Project Assistant. Built with Next.js & Groq AI.
      </footer>

    </main>
  );
}