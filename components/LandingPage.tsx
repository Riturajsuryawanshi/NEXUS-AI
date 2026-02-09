
import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
            <i className="fas fa-bolt text-white"></i>
          </div>
          <span className="text-2xl font-display font-black text-slate-900 tracking-tighter">NexusAnalyst</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Features</a>
          <a href="#how" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">How it works</a>
          <div className="w-px h-6 bg-slate-200"></div>
          <button onClick={onLogin} className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">Log In</button>
          <button 
            onClick={onGetStarted}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/10"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-20">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-400 rounded-full blur-[160px]"></div>
           <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-purple-400 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-8 animate-bounce">
            <i className="fas fa-sparkles"></i>
            New: Brain 2.0 Engine Now Live
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-black text-slate-900 tracking-tight leading-[0.9] mb-8">
            Data analysis <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">for the rest of us.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-500 leading-relaxed mb-12">
            Upload CSVs, get instant deterministic insights, and let Brain-2 explain the "why" in simple English. No Python. No complex BI tools. Just answers.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
               onClick={onGetStarted}
               className="px-10 py-5 bg-indigo-600 text-white rounded-2xl text-lg font-bold hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0 transition-all"
            >
              Start analyzing for free
            </button>
            <button className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all flex items-center gap-3">
              <i className="fas fa-play text-indigo-600 text-xs"></i>
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-display font-bold mb-6">Built for scale, tuned for speed.</h2>
            <p className="text-slate-400 text-lg">NexusAnalyst combines deterministic math with modern AI reasoning to deliver reliable insights at serverless speed.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: 'fa-microchip', title: 'Brain 1: Deterministic', desc: '100% accurate mathematical statistics, schema detection, and data cleaning.' },
              { icon: 'fa-brain', title: 'Brain 2: AI Reasoning', desc: 'Converts complex data structures into human-readable business narratives.' },
              { icon: 'fa-bolt', title: 'Zero Idle Cost', desc: 'Serverless architecture means you only pay for what you process. Scales to zero instantly.' }
            ].map((f, i) => (
              <div key={i} className="group p-10 rounded-3xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500 transition-all hover:-translate-y-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-2xl mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <i className={`fas ${f.icon}`}></i>
                </div>
                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 grayscale opacity-50">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <i className="fas fa-bolt text-white text-sm"></i>
            </div>
            <span className="text-xl font-display font-black text-slate-900 tracking-tighter">NexusAnalyst</span>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-slate-400">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">API Docs</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Pricing</a>
          </div>
          <p className="text-slate-400 text-sm">© 2025 NexusAnalyst AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
