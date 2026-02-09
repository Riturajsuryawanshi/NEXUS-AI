
import React, { useState, useRef, useEffect } from 'react';
import { JobRecord, ChatMessage } from '../types';
import { JobService } from '../services/jobService';

export const DataChat: React.FC<{ job: JobRecord }> = ({ job }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [job.chatHistory, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const text = input;
    setInput('');
    setIsTyping(true);
    await JobService.sendMessage(job.id, text);
    setIsTyping(false);
  };

  const quickActions = [
    "Identify outliers",
    "Architect dashboard",
    "Check correlations",
    "Explain anomalies"
  ];

  return (
    <div className="mt-20 border-t border-slate-100 pt-16 max-w-5xl mx-auto mb-32">
      <div className="flex items-center justify-center gap-3 mb-12">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 animate-pulse"></div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Interface v2.5</span>
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 animate-pulse"></div>
      </div>

      <div className="flex flex-col min-h-[400px]">
        {/* Chat History Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-10 mb-40 pr-4 custom-scrollbar"
        >
          {job.chatHistory.length === 0 && (
            <div className="text-center py-20 animate-in fade-in duration-1000">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] border border-slate-100 flex items-center justify-center mx-auto mb-8 text-indigo-500 shadow-xl shadow-indigo-500/5">
                <i className="fas fa-sparkles text-3xl"></i>
              </div>
              <h4 className="text-2xl font-display font-black text-slate-900 mb-3 tracking-tight">How can Nexus assist you?</h4>
              <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                Query individual segments, request mathematical proof, or ask for a specialized visualization blueprint.
              </p>
            </div>
          )}

          {job.chatHistory.map((msg) => (
            <div 
              key={msg.id}
              className={`flex items-start gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-indigo-600'}`}>
                <i className={`fas ${msg.role === 'user' ? 'fa-user-ninja' : 'fa-brain-circuit'} text-sm`}></i>
              </div>
              
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <div className={`p-7 rounded-[2rem] text-[15px] leading-relaxed transition-all hover:shadow-md ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-600/10' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none font-medium'}`}>
                  {msg.content}
                  
                  {msg.actionHint === 'build_dashboard' && (
                    <div className="mt-6 pt-6 border-t border-slate-200/50">
                      <button 
                        onClick={() => JobService.applyAction(job.id, 'build_dashboard')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl hover:-translate-y-0.5"
                      >
                        <i className="fas fa-wand-magic-sparkles"></i>
                        Architect Dashboard
                      </button>
                    </div>
                  )}
                </div>
                <span className="mt-3 text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-5 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shrink-0 shadow-sm">
                <i className="fas fa-circle-notch fa-spin text-sm"></i>
              </div>
              <div className="bg-white border border-slate-100 p-7 rounded-[2rem] rounded-tl-none flex items-center gap-2 shadow-sm">
                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
        </div>

        {/* Apple Glass Floating Console */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 z-50 animate-in slide-in-from-bottom-12 zoom-in-95 duration-700 ease-out">
           <div className="relative group">
              {/* Glowing background layer */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              
              <div className="relative bg-[#fdfdfd]/70 backdrop-blur-3xl p-3 rounded-[3rem] border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] flex flex-col gap-3 transition-all duration-500 group-focus-within:bg-white/80 group-focus-within:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.15)] group-focus-within:scale-[1.01]">
                
                {/* Quick Actions - Glass Pills */}
                <div className="flex gap-2.5 overflow-x-auto p-2 no-scrollbar">
                  {quickActions.map(action => (
                    <button 
                      key={action}
                      onClick={() => { setInput(action); }}
                      className="px-5 py-2.5 bg-white/40 backdrop-blur-md border border-white/60 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all whitespace-nowrap active:scale-95"
                    >
                      {action}
                    </button>
                  ))}
                </div>

                {/* Main Input Field */}
                <form onSubmit={handleSend} className="relative flex items-center group/form">
                  <div className="absolute left-6 text-slate-300 transition-colors group-focus-within/form:text-indigo-400">
                    <i className="fas fa-sparkles text-sm"></i>
                  </div>
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your analytical needs..."
                    className="w-full pl-14 pr-20 py-6 bg-white/40 border border-white/20 rounded-[2.2rem] focus:bg-white/90 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-slate-800 font-medium placeholder-slate-400"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="absolute right-3 top-3 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-20 disabled:grayscale disabled:hover:scale-100 group-focus-within/form:shadow-indigo-500/20"
                  >
                    {isTyping ? (
                      <i className="fas fa-spinner fa-spin text-sm"></i>
                    ) : (
                      <i className="fas fa-arrow-up text-sm"></i>
                    )}
                  </button>
                </form>
              </div>
           </div>
           
           <div className="mt-4 flex justify-center items-center gap-6">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] opacity-40">
                Encrypted Session
              </p>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] opacity-40">
                Gemini-3 Pro High Fidelity
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
