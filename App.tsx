
import React, { useState, useEffect } from 'react';
import { Layout, AppView } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { AuthFlow } from './components/AuthFlow';
import { Settings } from './components/Settings';
import { MonetizationLab } from './components/MonetizationLab';
import { ClientList } from './components/ClientList'; // New
import { JobService } from './services/jobService';
import { UserService } from './services/userService';
import { ClientService } from './services/clientService'; // New
import { JobRecord, UserProfile, Client } from './types'; // New
import { JobCard } from './components/JobCard';
import { ProfileView } from './components/ProfileView';

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
      // If user logs out, go back to landing
      if (!p) setAuthMode('landing');
      // If user logs in, we can stay on landing (user request) or go to app
      // For now, let's keep them on landing if they were there, or landing if they just logged in?
      // User said "signin button show the profile", implying they are on landing page.
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
          // User logged in. Go back to landing page as requested?
          // "sign in button show the profile" -> Landing Page.
          setAuthMode('landing');
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
          <div className="max-w-[1600px] mx-auto p-12 space-y-16">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="max-w-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-5xl font-sans font-black text-slate-900 tracking-tighter leading-none uppercase italic">
                    Nexus <span className="text-slate-900">Studio</span>
                  </h2>
                  <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                  <button
                    onClick={() => UserService.updatePreference('learningMode', !profile?.preferences.learningMode)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${profile?.preferences.learningMode ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900'}`}
                  >
                    <i className="fas fa-graduation-cap mr-2"></i>
                    {profile?.preferences.learningMode ? 'AI Learning Active' : 'Performance Mode'}
                  </button>
                </div>
                <p className="text-slate-600 text-xl font-medium leading-relaxed max-w-lg">
                  Connect your business intelligence to our deterministic neural engine.
                  Get explainable insights grounded in mathematical truth.
                </p>
              </div>

              <div className="flex shrink-0">
                <button
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                  disabled={isUploading}
                  className="group relative px-10 py-5 bg-black text-white rounded-full font-bold flex items-center gap-4 hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <i className={`fas ${isUploading ? 'fa-circle-notch fa-spin' : 'fa-plus'} relative z-10 text-lg`}></i>
                  <span className="relative z-10 text-lg tracking-tight">
                    {isUploading ? 'Processing Pipeline...' : 'New Analysis Session'}
                  </span>
                </button>
                <input id="file-upload-input" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>

            <div className="flex flex-col gap-16">
              {jobs.length === 0 ? (
                <div className="bg-white rounded-[4rem] border-2 border-dashed border-slate-100 py-48 text-center shadow-sm">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-slate-200 shadow-inner">
                    <i className="fas fa-cloud-arrow-up text-4xl"></i>
                  </div>
                  <h4 className="text-3xl font-display font-black text-slate-300">Awaiting Data Stream</h4>
                  <p className="text-slate-400 max-w-sm mx-auto text-lg mt-4 font-medium leading-relaxed">
                    Upload a raw dataset to trigger the automated cleaning and reasoning pipeline.
                  </p>
                </div>
              ) : (
                <div className="space-y-24">
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
