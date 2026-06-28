"use client";
import { useState, useEffect, useRef } from "react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { Send, FileText, Mic, MicOff, Volume2, Sparkles, RotateCcw, Download, RefreshCw, Save, LayoutDashboard } from "lucide-react";
import Link from "next/link";

const DOC_TABS = [
  { key: "prd", label: "PRD" },
  { key: "frd", label: "FRD" },
  { key: "architecture", label: "Architecture" },
  { key: "roadmap", label: "Roadmap" },
  { key: "database", label: "Database" },
  { key: "api", label: "API Spec" },
  { key: "uiux", label: "UI/UX" },
  { key: "business", label: "Business" },
  { key: "gtm", label: "Go-To-Market" },
  { key: "investor", label: "Investor" },
];

interface VersionEntry {
  version: number;
  timestamp: string;
  documents: Record<string, string>;
}

interface Message {
  role: string;
  content: string;
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI Project Assistant. Tell me about the idea you want to build — even if it's rough, we'll figure it out together! 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [documents, setDocuments] = useState<Record<string, string> | null>(null);
  const [activeDoc, setActiveDoc] = useState<string>("prd");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [refineInput, setRefineInput] = useState("");
  const [refining, setRefining] = useState(false);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [activeVersion, setActiveVersion] = useState<number>(1);
  const [showVersions, setShowVersions] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [projectName, setProjectName] = useState("My Project");
  const [editingName, setEditingName] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (voiceMode) startListening();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Please use Chrome for voice recognition."); return; }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      setInput(transcript);
      await sendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const sendMessage = async (overrideInput?: string) => {
    const messageText = overrideInput ?? input;
    if (!messageText.trim()) return;
    const userMessage = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      const reply = data.reply;
      setMessages([...updatedMessages, { role: "assistant", content: reply }]);
      if (voiceMode) speak(reply);
    } catch {
      setMessages([...updatedMessages, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const generateDocuments = async () => {
    setGenerating(true);
    setDocuments(null);
    setVersions([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      const docs = data.documents;
      setDocuments(docs);
      setActiveDoc("prd");
      setActiveVersion(1);
      const v1: VersionEntry = { version: 1, timestamp: new Date().toLocaleTimeString(), documents: docs };
      setVersions([v1]);
    } catch {
      alert("Failed to generate documents. Please try again.");
    }
    setGenerating(false);
  };

  const refineDocument = async () => {
    if (!refineInput.trim() || !documents) return;
    setRefining(true);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents, feedback: refineInput, docKey: activeDoc }),
      });
      const data = await res.json();
      const updatedDocs = { ...documents, [activeDoc]: data.refined };
      setDocuments(updatedDocs);
      const newVersion: VersionEntry = {
        version: versions.length + 1,
        timestamp: new Date().toLocaleTimeString(),
        documents: updatedDocs,
      };
      setVersions((prev) => [...prev, newVersion]);
      setActiveVersion(newVersion.version);
      setRefineInput("");
    } catch {
      alert("Failed to refine document. Please try again.");
    }
    setRefining(false);
  };

  const restoreVersion = (v: VersionEntry) => {
    setDocuments(v.documents);
    setActiveVersion(v.version);
    setShowVersions(false);
  };

  const downloadMarkdown = () => {
    if (!documents) return;
    const allDocs = DOC_TABS
      .map(({ key, label }) => `# ${label}\n\n${documents[key]}`)
      .join("\n\n---\n\n");
    const blob = new Blob([allDocs], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "-")}-documents.md`;
    a.click();
  };

  const downloadPDF = () => {
    if (!documents) return;
    const allDocs = DOC_TABS
      .map(({ key, label }) => `<h1>${label}</h1><pre style="white-space:pre-wrap;font-family:sans-serif;font-size:13px">${documents[key]}</pre><hr>`)
      .join("\n");
    const html = `<!DOCTYPE html><html><head><title>${projectName} - Project Documents</title>
    <style>body{font-family:sans-serif;padding:40px;color:#111}h1{color:#7c3aed;border-bottom:2px solid #7c3aed;padding-bottom:8px}hr{margin:40px 0}pre{line-height:1.6}</style>
    </head><body><h1 style="font-size:28px">${projectName}</h1><p style="color:#666">Generated by AI Project Assistant · ${new Date().toLocaleDateString()}</p><hr>${allDocs}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => { win.print(); };
    }
  };

  const downloadDOCX = async () => {
    if (!documents) return;
    const children: Paragraph[] = [];
    DOC_TABS.forEach(({ key, label }) => {
      children.push(
        new Paragraph({
          text: label,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      );
      const lines = (documents[key] || "").split("\n");
      lines.forEach((line) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 100 },
          })
        );
      });
      children.push(new Paragraph({ text: "", spacing: { after: 400 } }));
    });
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${projectName.replace(/\s+/g, "-")}-documents.docx`);
  };

  const saveToDashboard = () => {
    if (!documents) return;
    const existing = JSON.parse(localStorage.getItem("ai_projects") || "[]");
    const project = {
      id: Date.now(),
      name: projectName,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      documents,
      versions,
      messageCount: messages.filter(m => m.role === "user").length,
    };
    existing.unshift(project);
    localStorage.setItem("ai_projects", JSON.stringify(existing));
    setSavedMessage("✅ Saved to Dashboard!");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const saveConversation = () => {
    const data = {
      id: Date.now(),
      projectName,
      messages,
      savedAt: new Date().toLocaleString(),
    };
    const existing = JSON.parse(localStorage.getItem("ai_conversations") || "[]");
    existing.unshift(data);
    localStorage.setItem("ai_conversations", JSON.stringify(existing.slice(0, 10)));
    setSavedMessage("✅ Conversation saved!");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const loadConversation = () => {
    const existing = JSON.parse(localStorage.getItem("ai_conversations") || "[]");
    if (existing.length === 0) {
      alert("No saved conversations found.");
      return;
    }
    const latest = existing[0];
    setMessages(latest.messages);
    setProjectName(latest.projectName);
    setDocuments(null);
    setVersions([]);
    setSavedMessage(`✅ Loaded: ${latest.projectName}`);
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoiceMode = () => {
    window.speechSynthesis.cancel();
    setVoiceMode(!voiceMode);
    setIsListening(false);
  };

  const resetChat = () => {
    window.speechSynthesis.cancel();
    setMessages([{
      role: "assistant",
      content: "Hi! I'm your AI Project Assistant. Tell me about the idea you want to build — even if it's rough, we'll figure it out together! 🚀",
    }]);
    setDocuments(null);
    setInput("");
    setIsListening(false);
    setIsSpeaking(false);
    setVersions([]);
    setProjectName("My Project");
  };

  const userMessageCount = messages.filter(m => m.role === "user").length;

  return (
    <main className="min-h-screen flex flex-col items-center p-4" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)" }}>
      <div className="w-full max-w-3xl flex flex-col h-screen py-4">

        {/* Header */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles size={22} className="text-purple-400" />
            <h1 className="text-3xl font-bold text-white tracking-tight">AI Project Assistant</h1>
            <Sparkles size={22} className="text-purple-400" />
          </div>
          <p className="text-gray-500 text-sm mb-3">Transform your idea into a complete project plan</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={toggleVoiceMode}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                voiceMode
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-transparent border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400"
              }`}
            >
              {voiceMode ? "🎙 Voice Mode ON" : "🎙 Enable Voice Mode"}
            </button>
            <button
              onClick={resetChat}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 transition-all"
            >
              <RotateCcw size={13} /> New Chat
            </button>
            <button
              onClick={saveConversation}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 transition-all"
            >
              💾 Save Chat
            </button>
            <button
              onClick={loadConversation}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 transition-all"
            >
              📂 Load Chat
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 transition-all"
            >
              <LayoutDashboard size={13} /> Dashboard
            </Link>
          </div>
          {savedMessage && (
            <p className="text-green-400 text-xs mt-2">{savedMessage}</p>
          )}
        </div>

        {/* Voice Status */}
        {voiceMode && (
          <div className="mb-3 text-center">
            {isListening && (
              <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-2 rounded-full text-sm animate-pulse">
                <Mic size={14} /> Listening...
              </div>
            )}
            {isSpeaking && (
              <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/40 text-purple-400 px-4 py-2 rounded-full text-sm animate-pulse">
                <Volume2 size={14} /> Speaking...
              </div>
            )}
            {!isListening && !isSpeaking && (
              <div className="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-700 text-gray-500 px-4 py-2 rounded-full text-sm">
                🎙 Click the mic button to speak
              </div>
            )}
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto rounded-2xl p-4 space-y-4 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">AI</div>
              )}
              <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user" ? "text-white rounded-br-sm" : "text-gray-100 rounded-bl-sm"
                }`}
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg, #3b82f6, #6366f1)" }
                  : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">AI</div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Generate Button */}
        {userMessageCount >= 3 && !documents && (
          <div className="mb-3 flex justify-center">
            <button
              onClick={generateDocuments}
              disabled={generating}
              className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}
            >
              <FileText size={18} />
              {generating ? "Generating All 10 Documents..." : "✨ Generate Project Documents"}
            </button>
          </div>
        )}

        {/* Documents Section */}
        {documents && (
          <div className="mb-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>

            {/* Project Name + Controls */}
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {editingName ? (
                  <input
                    autoFocus
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={e => e.key === "Enter" && setEditingName(false)}
                    className="bg-transparent border-b border-purple-500 text-white text-sm outline-none px-1"
                  />
                ) : (
                  <span
                    className="text-white font-bold cursor-pointer hover:text-purple-400 transition"
                    onClick={() => setEditingName(true)}
                    title="Click to rename"
                  >
                    📄 {projectName}
                  </span>
                )}
                {versions.length > 1 && (
                  <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    V{activeVersion}
                  </span>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <button onClick={saveToDashboard} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg text-white transition" style={{ background: "rgba(124,58,237,0.3)", border: "1px solid rgba(124,58,237,0.5)" }}>
                  <Save size={12} /> Save
                </button>
                {versions.length > 1 && (
                  <button onClick={() => setShowVersions(!showVersions)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg text-gray-300 transition" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <RefreshCw size={12} /> History ({versions.length})
                  </button>
                )}
                <button onClick={downloadMarkdown} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg text-white transition" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                  <Download size={12} /> .md
                </button>
                <button onClick={downloadPDF} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg text-white transition" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                  <Download size={12} /> PDF
                </button>
                <button onClick={downloadDOCX} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg text-white transition" style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                  <Download size={12} /> .docx
                </button>
              </div>
            </div>

            {/* Version History */}
            {showVersions && (
              <div className="mb-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-gray-400 text-xs mb-2 font-medium">Version History</p>
                <div className="flex flex-col gap-1">
                  {versions.map((v) => (
                    <button
                      key={v.version}
                      onClick={() => restoreVersion(v)}
                      className="text-left text-xs px-3 py-2 rounded-lg transition flex justify-between"
                      style={activeVersion === v.version
                        ? { background: "rgba(124,58,237,0.3)", color: "white" }
                        : { background: "rgba(255,255,255,0.04)", color: "#9ca3af" }
                      }
                    >
                      <span>Version {v.version} {v.version === 1 ? "(Original)" : "(Refined)"}</span>
                      <span>{v.timestamp}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Document Tabs */}
            <div className="flex flex-wrap gap-2 mb-3">
              {DOC_TABS.map((doc) => (
                <button
                  key={doc.key}
                  onClick={() => setActiveDoc(doc.key)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition"
                  style={activeDoc === doc.key
                    ? { background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white" }
                    : { background: "rgba(255,255,255,0.06)", color: "#9ca3af" }
                  }
                >
                  {doc.label}
                </button>
              ))}
            </div>

            {/* Document Content */}
            <div className="max-h-48 overflow-y-auto mb-3">
              <pre className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">
                {documents[activeDoc]}
              </pre>
            </div>

            {/* Refine Section */}
            <div className="border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <p className="text-gray-500 text-xs mb-2">✏️ Refine the <span className="text-purple-400">{DOC_TABS.find(d => d.key === activeDoc)?.label}</span> document:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={refineInput}
                  onChange={e => setRefineInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && refineDocument()}
                  placeholder={`e.g. "Add more detail on pricing tiers"`}
                  className="flex-1 text-white text-xs rounded-lg px-3 py-2 outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
                <button
                  onClick={refineDocument}
                  disabled={refining || !refineInput.trim()}
                  className="text-xs px-4 py-2 rounded-lg text-white transition disabled:opacity-50 whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                >
                  {refining ? "Refining..." : "✨ Refine"}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <textarea
            className="flex-1 text-white rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            placeholder={voiceMode ? "Or type your message here..." : "Describe your idea... (Press Enter to send)"}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={isListening ? stopListening : startListening}
            className={`relative px-4 rounded-xl transition-all text-white ${isListening ? "animate-pulse" : ""}`}
            style={{ background: isListening ? "#ef4444" : "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="text-white px-4 rounded-xl disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
          >
            <Send size={18} />
          </button>
        </div>

      </div>
    </main>
  );
}