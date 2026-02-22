
import React, { useState, useEffect } from 'react';
import { Layout, AppView } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { AuthFlow } from './components/AuthFlow';
import { Settings } from './components/Settings';
import { MonetizationLab } from './components/MonetizationLab';
import { ClientList } from './components/ClientList';
import { ReviewIntelligence } from './components/ReviewIntelligence';
import { JobService } from './services/jobService';
import { UserService } from './services/userService';
import { ClientService } from './services/clientService'; // New
import { JobRecord, UserProfile, Client } from './types'; // New
import { JobCard } from './components/JobCard';
import { ProfileView } from './components/ProfileView';
import { MyReports } from './components/MyReports';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'signup' | 'app'>('landing');
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [activeClient, setActiveClient] = useState<Client | undefined>(undefined); // New
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = UserService.subscribe(p => {
      setProfile(p);

      if (p) {
        // User is logged in
        // Generate a slug for the URL: usage display name or email prefix
        const nameSlug = p.displayName
          ? p.displayName.toLowerCase().replace(/\s+/g, '')
          : p.email?.split('@')[0] || 'user';

        // Update URL to /slug if not already there
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '/login') {
          window.history.pushState({}, '', `/${nameSlug}`);
        }

        // If we are on landing or login, switch to App view
        // Unconditionally switch to app if user is present
        setAuthMode('app');

      } else {
        // User is logged out
        setAuthMode('landing');
        // Reset URL to root
        if (window.location.pathname !== '/') {
          window.history.pushState({}, '', '/');
        }
      }
    });

    const unsubscribeJobs = JobService.subscribe(updatedJobs => {
      setJobs(updatedJobs);
    });

    // New: Subscribe to Client Service
    const unsubscribeClients = ClientService.subscribe((clients, activeId) => {
      const client = activeId ? clients.find(c => c.id === activeId) : undefined;
      setActiveClient(client);
    });

    // New: Listen for Switch Client Event
    const handleSwitch = () => ClientService.setActiveClient(null);
    window.addEventListener('nexus:switch-client', handleSwitch);

    return () => {
      unsubscribeAuth();
      unsubscribeJobs();
      unsubscribeClients();
      window.removeEventListener('nexus:switch-client', handleSwitch);
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Only CSV and Excel files are supported.');
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      await JobService.createJob(file);
      event.target.value = '';
    } catch (err: any) {
      setError(err.message || 'Processing queue failed.');
    } finally {
      setIsUploading(false);
    }
  };

  if (authMode === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setAuthMode('signup')}
        onLogin={() => setAuthMode('login')}
        profile={profile}
        onEnterApp={() => setAuthMode('app')}
      />
    );
  }

  if (authMode === 'login' || authMode === 'signup') {
    return (
      <AuthFlow
        initialMode={authMode}
        onSuccess={() => {
          // User logged in. Go to app.
          // The subscription already handles this, but explicitly setting it doesn't hurt.
          // We must NOT set it back to 'landing' as previously implemented.
          setAuthMode('app');
        }}
      />
    );
  }

  // New: If no client selected, show Client List
  if (!activeClient) {
    return <ClientList onSelect={(client) => ClientService.setActiveClient(client.id)} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="max-w-[1600px] mx-auto p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  <div className="h-px w-8 bg-slate-200"></div>
                </div>
                <h1 className="text-4xl md:text-5xl font-sans font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4 transition-colors">
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexus-600 to-purple-600 animate-fade-in">{profile?.displayName?.split(' ')[0] || 'Analyst'}</span>.
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-xl transition-colors">
                  Your neural engine is online. Upload raw data to generate deterministic insights or audit a business presence instantly.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                  disabled={isUploading}
                  className="px-6 py-4 bg-nexus-900 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-nexus-800 disabled:opacity-50 shadow-xl shadow-nexus-200 transition-all hover:scale-105 active:scale-95 group"
                >
                  <i className={`fas ${isUploading ? 'fa-circle-notch fa-spin' : 'fa-plus'} text-lg group-hover:rotate-90 transition-transform duration-300`}></i>
                  <span className="text-base">New Analysis</span>
                </button>
                <input id="file-upload-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-layer-group text-6xl text-nexus-600"></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Plan</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white capitalize transition-colors">{profile?.planType || 'Free'}</p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-coins text-6xl text-purple-600"></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Credits</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors">{profile?.creditsAvailable || 0}</p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-file-csv text-6xl text-emerald-600"></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Files Processed</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors">{profile?.filesProcessedToday || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-nexus-600 to-purple-600 p-6 rounded-3xl shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-nexus-200 hover:scale-[1.02] transition-all" onClick={() => window.dispatchEvent(new CustomEvent('nexus:open-pricing'))}>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-between h-full relative z-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Upgrade</p>
                    <p className="text-xl font-black text-white">Get Pro Access</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    <i className="fas fa-arrow-right text-white"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-16">
              {/* Review Intelligence Module - now full width/open canvas */}
              <div className="-mx-8">
                <ReviewIntelligence key="review-intel-module" />
              </div>

              {jobs.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Empty State / Quick Start Cards */}
                  <div onClick={() => document.getElementById('file-upload-input')?.click()} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-200 border-dashed dark:border-slate-700 hover:border-nexus-500 dark:hover:border-nexus-400 hover:bg-nexus-50/50 dark:hover:bg-nexus-900/20 cursor-pointer transition-all group text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 bg-nexus-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-nexus-600 dark:group-hover:bg-nexus-500 transition-colors duration-500 shadow-sm group-hover:shadow-nexus-500/30">
                      <i className="fas fa-cloud-arrow-up text-nexus-600 dark:text-nexus-400 group-hover:text-white transition-colors"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Upload Dataset</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs transition-colors">Upload a CSV or Excel file to trigger the automated cleaning and insight pipeline.</p>
                  </div>

                  <div onClick={() => setActiveView('lab-make-money')} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl cursor-pointer transition-all group text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                      <i className="fas fa-sack-dollar text-purple-600 dark:text-purple-400 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">Monetization Lab</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs transition-colors">Explore high-value opportunities and generate proof reports for clients.</p>
                  </div>

                  <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[2.5rem] text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group shadow-2xl shadow-slate-900/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-nexus-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <i className="fas fa-graduation-cap text-slate-700 dark:text-slate-600 text-6xl mb-6 group-hover:text-slate-600 dark:group-hover:text-slate-500 transition-colors"></i>
                    <h3 className="text-xl font-bold text-white mb-2">Learning Mode</h3>
                    <p className="text-slate-400 text-sm max-w-xs mb-6">Switch to Learning Mode to see the "why" behind every AI decision.</p>
                    <button onClick={() => UserService.updatePreference('learningMode', !profile?.preferences.learningMode)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors">
                      {profile?.preferences.learningMode ? 'Disable' : 'Enable'} Learning Mode
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-24">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Recent Analysis Jobs</h3>
                  </div>
                  {jobs.filter(job => job.clientId === activeClient?.id).map(job => <JobCard key={job.id} job={job} />)}
                </div>
              )}
            </div>
          </div>
        );
      case 'settings':
        return <Settings />;
      case 'lab-make-money':
        return <MonetizationLab jobs={jobs} profile={profile!} client={activeClient!} view="make-money" />;
      case 'lab-opportunities':
        return <MonetizationLab jobs={jobs} profile={profile!} client={activeClient!} view="opportunities" />;

      case 'lab-proof-reports':
        return <MonetizationLab jobs={jobs} profile={profile!} client={activeClient!} view="proof-reports" />;
      case 'profile':
        return <ProfileView profile={profile!} />;
      case 'reports':
        return (
          <div className="max-w-[1600px] mx-auto p-8 space-y-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-3xl font-sans font-black text-slate-900 tracking-tight">
                My <span className="text-indigo-600">Review Audits</span>
              </h2>
            </div>
            <MyReports onSelectAudit={(audit) => {
              // Hacky but effective: We switch to dashboard view and inject the audit
              // Ideally we should have a cleaner way to pass state, but this works for now.
              // We will push to local storage or URL params? 
              // For now, let's just use localStorage to pass the audit to ReviewIntelligence
              localStorage.setItem('nexus_active_audit', JSON.stringify(audit));
              setActiveView('dashboard');
              // We need to trigger an event to tell ReviewIntelligence to load it
              setTimeout(() => window.dispatchEvent(new CustomEvent('nexus:load-audit')), 100);
            }} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView} client={activeClient}>
      {renderContent()}
    </Layout>
  );
};

export default App;
