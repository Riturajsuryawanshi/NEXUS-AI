
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { 
  Send, Upload, Sparkles, BrainCircuit, Trash2, RefreshCw, 
  Calculator, LogOut, User as UserIcon, FolderOpen, Plus, 
  FileText, ArrowRight, Wand2, Info, AlertCircle, Key, X, Check, Code,
  MessageSquare, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Search,
  Download, FileSpreadsheet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

import { getAdvancedAnalysis } from './services/geminiService';
import { profilingService } from './services/profilingService';
import { authService } from './services/authService';
import { projectService } from './services/projectService';
import { Message, User, AnalysisProject, AppTab, DataSchema, CleaningStep } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.PROJECT_LIBRARY);
  const [projects, setProjects] = useState<AnalysisProject[]>([]);
  const [currentProject, setCurrentProject] = useState<AnalysisProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  
  const [previewStep, setPreviewStep] = useState<CleaningStep | null>(null);
  const [editedCode, setEditedCode] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) setProjects(projectService.getProjects(user.id));
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentProject?.messages]);

  const handleLogin = async (e?: React.FormEvent, isDemo = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const email = isDemo ? 'analyst@nexus.ai' : authEmail;
      const pass = isDemo ? 'demo123' : authPass;
      const authenticatedUser = await authService.login(email, pass);
      setUser(authenticatedUser);
      setActiveTab(AppTab.PROJECT_LIBRARY);
    } catch (err: any) { setAuthError(err.message); } finally { setLoading(false); }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentProject(null);
    setActiveTab(AppTab.PROJECT_LIBRARY);
  };

  const createNewProject = () => {
    if (!user) return;
    const newProj = projectService.createEmptyProject(user.id, `Analysis ${new Date().toLocaleDateString()}`);
    setProjects(prev => [newProj, ...prev]);
    setCurrentProject(newProj);
    setActiveTab(AppTab.DATA_ANALYST);
    projectService.saveProject(newProj);
  };

  const selectProject = (p: AnalysisProject) => {
    setCurrentProject(p);
    setActiveTab(AppTab.DATA_ANALYST);
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    projectService.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProject?.id === id) {
      setCurrentProject(null);
      setActiveTab(AppTab.PROJECT_LIBRARY);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const workbook = XLSX.read(evt.target?.result as string, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];
      
      // Deterministic Stage 1: Ingestion & Profiling
      const schema = profilingService.profileDataset(data);
      const audit = profilingService.generateAuditIssues(schema);
      const plan = profilingService.generateCleaningPlan(audit);
      
      const updated = {
        ...currentProject,
        dataset: [...data], // Current working set
        rawDataset: [...data], // Preserved original
        schema,
        auditIssues: audit,
        cleaningPlan: plan,
        messages: [{
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: `Data engine ingestion complete. Processed ${data.length} rows across ${schema.columns.length} columns. My mathematical audit detected ${audit.length} quality optimizations. Nexus AI is standing by for narrative analysis. Export functionality is now online.`,
          timestamp: Date.now()
        }]
      };
      setCurrentProject(updated);
      projectService.saveProject(updated);
      setLoading(false);
      triggerExportFeedback("Ready to download");
    };
    reader.readAsBinaryString(file);
  };

  const triggerExportFeedback = (msg: string) => {
    setExportFeedback(msg);
    setTimeout(() => setExportFeedback(null), 3000);
  };

  const openCleaningPreview = (step: CleaningStep) => {
    setPreviewStep(step);
    setEditedCode(step.pythonCode);
  };

  const applyTransformation = () => {
    if (!currentProject || !previewStep || !currentProject.dataset) return;
    setLoading(true);

    // Deterministic Mock Transformation (Stage 1 Simulation)
    // In a real pandas-backed env, this would run the code. 
    // Here we simulate the result by modifying the local dataset copy.
    let newDataset = [...currentProject.dataset];
    if (previewStep.pythonCode.includes('drop_duplicates')) {
      const unique = new Set();
      newDataset = newDataset.filter(r => {
        const s = JSON.stringify(r);
        if (unique.has(s)) return false;
        unique.add(s);
        return true;
      });
    }

    const stepId = previewStep.id;
    const updatedPlan = currentProject.cleaningPlan.map(s => 
      s.id === stepId ? { ...s, executed: true, pythonCode: editedCode } : s
    );
    const systemUpdate: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Executed operation: **${previewStep.action}**. Dataset integrity updated in current workspace.`,
      timestamp: Date.now()
    };
    const updated = {
      ...currentProject,
      dataset: newDataset,
      cleaningPlan: updatedPlan,
      messages: [...currentProject.messages, systemUpdate],
      consoleCode: currentProject.consoleCode + `\n\n# Transformation: ${previewStep.action}\n${editedCode}`
    };
    setCurrentProject(updated);
    projectService.saveProject(updated);
    setPreviewStep(null);
    setLoading(false);
    triggerExportFeedback("Export updated");
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentProject || loading) return;
    const query = input;
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query, timestamp: Date.now() };
    const messages = [...currentProject.messages, userMsg];
    setCurrentProject({ ...currentProject, messages });
    setLoading(true);
    try {
      // Stage 2: AI Narration and Insight generation
      const res = await getAdvancedAnalysis(query, currentProject.schema!, messages.map(m => ({ role: m.role, content: m.content })));
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.explanation, analysis: res, timestamp: Date.now() };
      const finalMessages = [...messages, assistantMsg];
      const updated = { ...currentProject, messages: finalMessages };
      setCurrentProject(updated);
      projectService.saveProject(updated);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const exportToExcel = () => {
    if (!currentProject || !currentProject.dataset) return;

    const wb = XLSX.utils.book_new();

    // 1. Raw Data
    if (currentProject.rawDataset) {
      const wsRaw = XLSX.utils.json_to_sheet(currentProject.rawDataset);
      XLSX.utils.book_append_sheet(wb, wsRaw, "Raw_Data");
    }

    // 2. Cleaned / Transformed Data (Current State)
    const wsCleaned = XLSX.utils.json_to_sheet(currentProject.dataset);
    XLSX.utils.book_append_sheet(wb, wsCleaned, "Cleaned_Data");

    // 3. Change Log
    const changeLog = currentProject.cleaningPlan
      .filter(s => s.executed)
      .map(s => ({
        Action: s.action,
        Description: s.description,
        Timestamp: new Date().toISOString(),
        Logic: s.pythonCode
      }));
    if (changeLog.length > 0) {
      const wsLog = XLSX.utils.json_to_sheet(changeLog);
      XLSX.utils.book_append_sheet(wb, wsLog, "Change_Log");
    }

    // 4. Insights
    const insights = currentProject.messages
      .filter(m => m.analysis)
      .flatMap(m => m.analysis!.insights.map(ins => ({
        Topic: m.analysis!.title,
        Insight: ins,
        Generated_At: new Date(m.timestamp).toISOString()
      })));
    if (insights.length > 0) {
      const wsInsights = XLSX.utils.json_to_sheet(insights);
      XLSX.utils.book_append_sheet(wb, wsInsights, "AI_Insights");
    }

    XLSX.writeFile(wb, `${currentProject.name.replace(/\s+/g, '_')}_Nexus_Report.xlsx`);
    triggerExportFeedback("File Downloaded");
  };

  if (!user) return (
    <div className="h-screen w-full flex items-center justify-center bg-wine p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-12 rounded-[3.5rem] w-full max-w-lg space-y-8 relative overflow-hidden shadow-2xl">
        <div className="glow-sweep-bar" />
        <div className="text-center space-y-4 relative z-10">
          <div className="p-5 bg-gradient-to-br from-[#F4A6A6] to-[#F08080] rounded-3xl w-fit mx-auto shadow-2xl"><BrainCircuit className="w-10 h-10 text-wine" /></div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#F5EDED]">Nexus Core</h1>
          <p className="text-[10px] text-[#F4A6A6] font-bold uppercase tracking-[0.4em]">Deterministic Analysis Environment</p>
        </div>
        <form onSubmit={e => handleLogin(e)} className="space-y-4 relative z-10">
          <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Nexus User" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-[#F4A6A6]/50 text-[#F5EDED] placeholder-[#C9B3B3]/40" />
          <input type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} placeholder="Access Code" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-[#F4A6A6]/50 text-[#F5EDED] placeholder-[#C9B3B3]/40" />
          {authError && <div className="text-red-400 text-[10px] font-bold uppercase px-2">{authError}</div>}
          <button type="submit" disabled={loading} className="w-full accent-gradient text-wine font-black py-5 rounded-[2rem] shadow-xl hover:opacity-90 transition-opacity active:scale-95">{loading ? 'AUTHENTICATING...' : 'OPEN SESSION'}</button>
          <button type="button" onClick={() => handleLogin(undefined, true)} className="w-full bg-white/5 text-[#C9B3B3] py-4 rounded-[2rem] text-[10px] font-bold uppercase hover:bg-white/10 transition-colors">Internal Demo</button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-wine text-[#F5EDED] overflow-hidden font-sans">
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="h-full bg-wine flex flex-col border-r border-white/5 z-50 overflow-hidden">
            <div className="p-4">
              <button onClick={createNewProject} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#F4A6A6]/20 hover:bg-white/5 transition-all group">
                <Plus className="w-4 h-4 text-[#F4A6A6] group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-[#F5EDED]">New Workbook</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-1">
              <div className="text-[11px] font-black text-[#C9B3B3]/30 uppercase tracking-[0.3em] px-3 mb-3 mt-4">Session Logs</div>
              {projects.map(p => (
                <button key={p.id} onClick={() => selectProject(p)} className={`w-full group flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all ${currentProject?.id === p.id ? 'bg-[#F4A6A6]/10 text-[#F4A6A6] border border-[#F4A6A6]/10 shadow-lg shadow-black/20' : 'text-[#C9B3B3] hover:bg-white/5 hover:text-[#F5EDED]'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-100" />
                    <span className="truncate font-medium">{p.name}</span>
                  </div>
                  <button onClick={(e) => handleDeleteProject(e, p.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-white/5 bg-wine">
              <button onClick={() => setActiveTab(AppTab.ACCOUNT)} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-white/5 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F4A6A6] to-[#F08080] flex items-center justify-center text-wine font-black text-xs shadow-xl ring-2 ring-white/5">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="text-sm font-bold truncate text-[#F5EDED]">{user.name}</div>
                  <div className="text-[9px] text-[#F4A6A6] uppercase font-black tracking-[0.2em]">Lead Analyst</div>
                </div>
                <MoreHorizontal className="w-4 h-4 text-[#C9B3B3]/30 group-hover:text-[#F4A6A6]" />
              </button>
              <button onClick={handleLogout} className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-[#C9B3B3]/40 hover:text-red-400 hover:bg-red-400/5 transition-all font-bold text-xs">
                <LogOut className="w-4 h-4" />
                <span>LOGOUT</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        <div className="absolute top-4 left-4 z-[60]">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-wine/60 hover:bg-white/5 rounded-xl border border-white/10 text-[#C9B3B3]/40 hover:text-[#F4A6A6] transition-all backdrop-blur-xl">
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <header className="h-16 px-16 flex items-center justify-between glass border-b border-white/5 absolute top-0 left-0 right-0 z-40">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F4A6A6]/60">
              {currentProject ? currentProject.name : 'NEXUS ANALYTICAL CLUSTER'}
            </span>
            <div className="flex items-center gap-6">
              {currentProject?.dataset && (
                <div className="flex items-center gap-4">
                  <AnimatePresence>
                    {exportFeedback && (
                      <motion.span 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="text-[9px] font-black text-success-green uppercase tracking-[0.2em]"
                      >
                        {exportFeedback}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-3 px-6 py-2 bg-white/5 border border-[#F4A6A6]/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-[#F4A6A6] hover:bg-[#F4A6A6]/10 transition-all shadow-lg active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Instant Export</span>
                  </button>
                </div>
              )}
              {loading && (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-[#F4A6A6] rounded-full shadow-[0_0_12px_#F4A6A6]" />
                  <span className="text-[9px] font-black text-[#F4A6A6] uppercase tracking-[0.3em]">Syncing Data</span>
                </div>
              )}
            </div>
          </header>

          <div className="h-full pt-16">
            {activeTab === AppTab.PROJECT_LIBRARY ? (
              <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto p-12 text-center space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="p-10 bg-white/5 rounded-[4rem] w-fit mx-auto border border-[#F4A6A6]/10 mb-8 shadow-2xl group">
                    <BrainCircuit className="w-20 h-20 text-[#F4A6A6]" />
                  </div>
                  <h2 className="text-7xl font-black tracking-tighter text-[#F5EDED]">Nexus AI</h2>
                  <p className="text-[#C9B3B3] text-xl max-w-xl mx-auto leading-relaxed">Deterministic Stage-1 processing meets high-fidelity AI narration.</p>
                  <button onClick={createNewProject} className="accent-gradient text-wine font-black px-14 py-6 rounded-[2.5rem] text-sm uppercase tracking-[0.2em] flex items-center gap-4 shadow-3xl hover:scale-105 active:scale-95 transition-all">
                    <Plus className="w-6 h-6" /> Initialize Workbook
                  </button>
                </motion.div>
              </div>
            ) : (
              <div className="h-full flex flex-col max-w-4xl mx-auto relative px-4">
                <div className="flex-1 overflow-y-auto pt-10 pb-40 space-y-12 custom-scrollbar">
                  {currentProject?.messages.length === 0 && (
                    <div className="text-center py-32 space-y-8 opacity-40">
                      <div className="p-10 bg-white/5 w-fit mx-auto rounded-full border border-white/10">
                        <Calculator className="w-14 h-14 text-[#F4A6A6]" />
                      </div>
                      <p className="text-sm max-w-xs mx-auto text-[#C9B3B3]">Deliver CSV/XLSX for high-speed profiling.</p>
                    </div>
                  )}
                  {currentProject?.messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[88%] space-y-4">
                        <div className={`flex items-start gap-5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center mt-1 border border-white/5 ${m.role === 'user' ? 'bg-[#F4A6A6]' : 'bg-white/10'}`}>
                             {m.role === 'user' ? <UserIcon className="w-5 h-5 text-wine" /> : <BrainCircuit className="w-5 h-5 text-[#F4A6A6]" />}
                          </div>
                          <div className={`px-8 py-5 rounded-[2.2rem] text-sm leading-relaxed border ${m.role === 'user' ? 'bg-wine-light border-[#F4A6A6]/20' : 'glass'}`}>
                            {m.content}
                          </div>
                        </div>
                        {m.analysis && (
                          <div className="glass p-10 rounded-[3rem] border border-[#F4A6A6]/10 space-y-8 shadow-2xl ml-14">
                            <h4 className="font-black text-2xl tracking-tighter uppercase text-[#F4A6A6]">{m.analysis.title}</h4>
                            <div className="h-64 w-full bg-black/40 rounded-3xl p-8 border border-white/5">
                              <ResponsiveContainer>
                                <BarChart data={m.analysis.data}>
                                  <XAxis dataKey={m.analysis.chartConfig?.xAxis} hide />
                                  <Bar dataKey={m.analysis.chartConfig?.yAxis?.[0]} fill="#F4A6A6" radius={[8,8,0,0]} />
                                  <Tooltip contentStyle={{ backgroundColor: '#2A1212', border: '1px solid rgba(244,166,166,0.2)', borderRadius: '20px' }} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {m.analysis.insights.map((ins, i) => (
                                <div key={i} className="p-6 bg-white/5 rounded-3xl text-[11px] text-[#C9B3B3] leading-relaxed border border-white/5 flex gap-4">
                                  <div className="text-[#FFD6A5] font-black shrink-0 text-base leading-none">★</div>
                                  {ins}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>

                <AnimatePresence>
                  {currentProject?.schema && currentProject.cleaningPlan.some(s => !s.executed) && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-36 left-0 right-0 flex justify-center gap-4 z-30 px-4 flex-wrap">
                      {currentProject.cleaningPlan.filter(s => !s.executed).slice(0, 2).map((step) => (
                        <button key={step.id} onClick={() => openCleaningPreview(step)} className="bg-wine-light hover:bg-[#F4A6A6]/10 border border-[#F4A6A6]/20 backdrop-blur-3xl px-8 py-4 rounded-full flex items-center gap-4 text-[10px] font-black text-[#F4A6A6] transition-all group uppercase tracking-[0.2em]">
                          <Wand2 className="w-5 h-5" />
                          <span>Math Fix: {step.action}</span>
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute bottom-10 left-0 right-0 px-4 z-40">
                  <div className="max-w-3xl mx-auto glass p-3 rounded-[3rem] flex items-center gap-3 border border-white/10 shadow-3xl">
                    <button onClick={() => fileInputRef.current?.click()} className="p-5 text-[#C9B3B3]/30 hover:text-[#F4A6A6] rounded-full">
                      <Upload className="w-6 h-6" />
                    </button>
                    <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } }} placeholder="Direct AI to narrate pre-computed results..." className="flex-1 bg-transparent px-4 text-base outline-none text-[#F5EDED] placeholder-[#C9B3B3]/20" />
                    <button onClick={handleSendMessage} disabled={loading || !input.trim()} className="p-5 accent-gradient text-wine rounded-full disabled:opacity-20 shadow-xl">
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept=".csv,.xlsx" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {previewStep && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="glass max-w-2xl w-full rounded-[4rem] border border-white/10 overflow-hidden flex flex-col">
              <div className="p-12 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="p-5 bg-[#F4A6A6]/10 rounded-[2rem]"><Wand2 className="w-8 h-8 text-[#F4A6A6]" /></div>
                   <div>
                     <h3 className="text-3xl font-black uppercase text-[#F5EDED]">Logic Refactoring</h3>
                     <p className="text-[10px] uppercase font-black tracking-[0.4em] text-[#F4A6A6]/40">Deterministic cleaning step</p>
                   </div>
                </div>
                <button onClick={() => setPreviewStep(null)} className="p-4 text-[#C9B3B3]/20 hover:text-white"><X className="w-8 h-8" /></button>
              </div>
              <div className="p-12 space-y-10 overflow-y-auto max-h-[55vh] custom-scrollbar">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F4A6A6]">Objective</h4>
                  <p className="text-base text-[#C9B3B3] font-light">{previewStep.description}</p>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F4A6A6]">Pandas Pipeline</h4>
                    <span className="text-[9px] font-black text-[#F4A6A6] border border-[#F4A6A6]/10 px-4 py-1.5 rounded-full"><Code className="w-3.5 h-3.5" /> COMPILED</span>
                  </div>
                  <textarea value={editedCode} onChange={(e) => setEditedCode(e.target.value)} spellCheck={false} className="w-full h-56 bg-black/60 border border-white/5 rounded-[2.5rem] p-10 font-mono text-[12px] text-[#FFD6A5] outline-none resize-none leading-loose shadow-inner" />
                </div>
              </div>
              <div className="p-12 bg-white/5 border-t border-white/5 flex items-center gap-8">
                <button onClick={() => setPreviewStep(null)} className="flex-1 py-6 text-[11px] font-black uppercase text-[#C9B3B3]/40 tracking-[0.3em]">CANCEL</button>
                <button onClick={applyTransformation} className="flex-[2] accent-gradient text-wine py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-3xl">
                  <Check className="w-6 h-6" /> RUN LOGIC
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
