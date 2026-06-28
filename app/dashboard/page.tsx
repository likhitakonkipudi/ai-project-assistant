"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, Trash2, ExternalLink, FileText, MessageSquare, Clock } from "lucide-react";

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

interface VersionEntry { version: number; timestamp: string; }
interface Project {
  id: number; name: string; date: string; time: string;
  documents: Record<string, string>; versions: VersionEntry[]; messageCount: number;
}

function getProjects(): Project[] {
  try { return JSON.parse(localStorage.getItem("ai_projects") || "[]"); } catch { return []; }
}
function saveProjects(list: Project[]) {
  localStorage.setItem("ai_projects", JSON.stringify(list));
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(getProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeDoc, setActiveDoc] = useState("prd");

  const deleteProject = (id: number) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveProjects(updated);
    if (selectedProject?.id === id) setSelectedProject(null);
  };

  const downloadMarkdown = (project: Project) => {
    const allDocs = DOC_TABS.map(({ key, label }) => `# ${label}\n\n${project.documents[key]}`).join("\n\n---\n\n");
    const blob = new Blob([allDocs], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-")}-documents.md`;
    a.click();
  };

  return (
    <main className="min-h-screen text-white p-6" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold">Project Dashboard</h1>
              <p className="text-gray-500 text-sm">{projects.length} saved project{projects.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 rounded-full text-sm text-gray-400 hover:text-white border border-gray-700 transition">← Home</Link>
            <Link href="/assistant" className="px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>+ New Project</Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24">
            <FileText size={48} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No saved projects yet</p>
            <p className="text-gray-600 text-sm mb-6">Generate documents in the assistant and click Save to see them here</p>
            <Link href="/assistant" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium" style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>Start a Project</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Your Projects</h2>
              {projects.map((project) => (
                <div key={project.id} onClick={() => { setSelectedProject(project); setActiveDoc("prd"); }}
                  className="p-4 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: selectedProject?.id === project.id ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                    border: selectedProject?.id === project.id ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{project.name}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={10} /> {project.date}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500"><MessageSquare size={10} /> {project.messageCount} msgs</span>
                        <span className="flex items-center gap-1 text-xs text-gray-500"><FileText size={10} /> V{project.versions?.length || 1}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="text-gray-600 hover:text-red-400 transition ml-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2">
              {selectedProject ? (
                <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <div>
                      <h2 className="font-bold text-lg">{selectedProject.name}</h2>
                      <p className="text-gray-500 text-xs">Saved on {selectedProject.date} at {selectedProject.time}</p>
                    </div>
                    <button onClick={() => downloadMarkdown(selectedProject)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}>
                      <ExternalLink size={12} /> Download .md
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {DOC_TABS.map((doc) => (
                      <button key={doc.key} onClick={() => setActiveDoc(doc.key)} className="px-3 py-1 rounded-full text-xs font-medium transition"
                        style={activeDoc === doc.key ? { background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white" } : { background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}>
                        {doc.label}
                      </button>
                    ))}
                  </div>
                  <div className="max-h-96 overflow-y-auto rounded-xl p-4" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <pre className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">{selectedProject.documents[activeDoc]}</pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-gray-600">← Select a project to view its documents</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}