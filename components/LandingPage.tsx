import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  profile?: UserProfile | null;
  onEnterApp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, profile, onEnterApp }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-600 overflow-x-hidden selection:bg-purple-500 selection:text-white font-sans">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <i className="fas fa-bolt"></i>
            </div>
            <span className="text-2xl font-display font-black text-slate-900 tracking-tighter">Nexus<span className="text-purple-600">Analyst</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-semibold text-slate-500 hover:text-purple-600 transition-colors">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-semibold text-slate-500 hover:text-purple-600 transition-colors">How it works</button>
            <button onClick={() => scrollToSection('features')} className="text-sm font-semibold text-slate-500 hover:text-purple-600 transition-colors">Pricing</button>
            <div className="w-px h-6 bg-slate-200"></div>
            {profile ? (
              <button
                onClick={onEnterApp}
                className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 group"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white">
                  {profile.userId.charAt(0).toUpperCase()}
                </div>
                <span>Go to Studio</span>
                <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={onLogin} className="text-sm font-bold text-slate-600 hover:text-purple-700 transition-colors">Sign In</button>
                <button onClick={onGetStarted} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95">
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-0 inset-x-0 h-[600px] pointer-events-none">
          <div className="absolute top-[-100px] left-[10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
          <div className="absolute top-[-100px] right-[10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
          <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] bg-pink-200/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            AI Data Engine v2.0
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-black text-slate-900 tracking-tight leading-tight mb-6">
            Data analysis, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">purified.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-slate-500 leading-relaxed mb-10">
            Upload your raw CSVs and let our deterministic AI engine clean, analyze, and visualize your data in seconds. No code required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={profile && onEnterApp ? onEnterApp : onGetStarted}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-lg font-bold hover:bg-purple-600 hover:scale-105 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2"
            >
              Start Analyzing Free
              <i className="fas fa-arrow-right"></i>
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <i className="fas fa-play text-purple-600 text-xs"></i>
              See How It Works
            </button>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="mt-20 relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20"></div>
            <div className="relative bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center bg-slate-50">
              {/* Placeholder for "Interactive Preview" - reusing the card concept but lighter */}
              <div className="text-center p-10">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-4xl text-purple-600 mx-auto mb-6 animate-bounce">
                  <i className="fas fa-magic"></i>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Live Preview Area</h3>
                <p className="text-slate-500">Interactive dashboard UI visualizations would appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-display font-black text-slate-900 mb-4">How it works</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Go from raw data to actionable insights in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 border-t-2 border-dashed border-slate-300 z-0"></div>

            {[
              { step: 1, icon: 'fa-cloud-upload-alt', title: 'Upload Data', desc: 'Drag & drop your CSV or Excel files. We handle messy headers and formatting instantly.' },
              { step: 2, icon: 'fa-microchip', title: 'AI Processing', desc: 'Our dual-brain engine cleans data and detects patterns using deterministic logic.' },
              { step: 3, icon: 'fa-chart-pie', title: 'Get Insights', desc: 'Receive a comprehensive report with charts, trends, and business recommendations.' }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-purple-500/5 flex items-center justify-center text-4xl text-indigo-600 mb-8 border border-slate-100 group-hover:scale-110 group-hover:border-purple-200 transition-all duration-300">
                  <i className={`fas ${item.icon}`}></i>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-slate-50">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid (Bento) */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 md:h-[600px]">

            {/* Feature 1 */}
            <div className="md:row-span-2 rounded-[2.5rem] bg-slate-50 border border-slate-100 p-10 flex flex-col justify-between overflow-hidden relative group hover:shadow-xl transition-all">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mb-6">
                  <i className="fas fa-brain"></i>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Deterministic Core</h3>
                <p className="text-slate-500 leading-relaxed">Math doesn't lie. We use statistical proofs to ensure every insight is 100% accurate, unlike hallucinating LLMs.</p>
              </div>
              <img src="https://placehold.co/400x300/e2e8f0/64748b?text=Math+Proof+UI" className="rounded-2xl mt-8 opacity-80 group-hover:scale-105 transition-transform duration-500" alt="Feature Preview" />
            </div>

            {/* Feature 2 */}
            <div className="md:col-span-2 rounded-[2.5rem] bg-purple-600 text-white p-10 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] pointer-events-none"></div>
              <div className="flex-1 relative z-10">
                <h3 className="text-3xl font-bold mb-4">Lightning Fast</h3>
                <p className="text-purple-100 text-lg">Process gigabytes of data in seconds. Our serverless infrastructure scales infinitely to meet your workload.</p>
              </div>
              <div className="flex-1 w-full bg-white/10 rounded-2xl h-48 backdrop-blur-sm border border-white/20 p-6 flex flex-col justify-end">
                <div className="flex gap-2 items-end justify-between h-32">
                  <div className="w-8 bg-white/40 h-[40%] rounded-t-lg"></div>
                  <div className="w-8 bg-white/60 h-[70%] rounded-t-lg"></div>
                  <div className="w-8 bg-white/30 h-[30%] rounded-t-lg"></div>
                  <div className="w-8 bg-white h-[90%] rounded-t-lg shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
                  <div className="w-8 bg-white/50 h-[50%] rounded-t-lg"></div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-[2.5rem] bg-slate-900 text-white p-8 relative overflow-hidden group">
              <i className="fas fa-shield-alt text-6xl text-slate-800 absolute -bottom-4 -right-4 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-xl font-bold mb-2 relative z-10">Enterprise Security</h3>
              <p className="text-slate-400 text-sm relative z-10">SOC2 Type II Ready. End-to-end encryption for all your data.</p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-[2.5rem] bg-indigo-50 border border-indigo-100 p-8 relative group hover:border-indigo-300 transition-colors">
              <h3 className="text-xl font-bold text-indigo-900 mb-2">Universal Export</h3>
              <p className="text-indigo-700 text-sm">Download as PDF, Excel, or Sync to Sheets.</p>
              <div className="absolute bottom-6 right-6 flex gap-2">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-green-600"><i className="fas fa-file-excel"></i></div>
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-red-500"><i className="fas fa-file-pdf"></i></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 transition-all duration-300">
            <i className="fas fa-bolt text-indigo-600"></i>
            <span className="font-bold text-slate-900">NexusAnalyst</span>
          </div>
          <p className="text-slate-400 text-sm">© 2025 NexusAnalyst AI. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};
