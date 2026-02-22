
import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { UserProfile, Client } from '../types';
import { PricingModal } from './PricingModal';
import { CreditBalance } from './CreditBalance';
import { ThemeToggle } from './ThemeToggle';

export type AppView = 'dashboard' | 'settings' | 'lab-make-money' | 'lab-opportunities' | 'lab-proof-reports' | 'profile' | 'reports';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  client?: Client;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, client }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPricingOpen, setIsPricingOpen] = useState(false); // New State

  useEffect(() => {
    const unsubscribe = UserService.subscribe(p => setProfile(p));

    const handleOpenPricing = () => setIsPricingOpen(true);
    window.addEventListener('nexus:open-pricing', handleOpenPricing);

    return () => {
      unsubscribe();
      window.removeEventListener('nexus:open-pricing', handleOpenPricing);
    };
  }, []);

  const labItems: { id: AppView; label: string; icon: string }[] = [
    { id: 'lab-make-money', label: 'Make Money', icon: 'fa-sack-dollar' },
    { id: 'lab-opportunities', label: 'Opportunities', icon: 'fa-radar' },
    { id: 'lab-proof-reports', label: 'Proof Reports', icon: 'fa-file-shield' },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-[240px]' : 'w-[68px]'} bg-[#f7f8fa]/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 flex-shrink-0 flex flex-col transition-all duration-300 ease-out relative z-50`}
      >
        <div className="p-4 h-14 flex items-center justify-between">
          <div className={`flex items-center gap-3 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-6 h-6 bg-slate-900 dark:bg-slate-700 rounded-md flex items-center justify-center shadow-sm">
              <i className="fas fa-bolt text-white text-[10px]"></i>
            </div>
            <span className="font-medium text-sm tracking-tight text-slate-900 dark:text-slate-100">Nexus</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-6 h-6 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <i className={`fas ${isSidebarOpen ? 'fa-angle-left' : 'fa-angle-right'} text-[10px]`}></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-6">
          {/* Main Navigation */}
          <nav className="space-y-0.5 px-2">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 ${activeView === 'dashboard' ? 'text-slate-900 dark:text-white bg-slate-200/50 dark:bg-slate-800/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'}`}
            >
              <i className={`fas fa-grid-2 text-[13px] w-5 text-center ${activeView === 'dashboard' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'}`}></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-200 whitespace-nowrap`}>Studio</span>
            </button>

            <button
              onClick={() => { window.dispatchEvent(new CustomEvent('nexus:switch-client')); }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all duration-200"
            >
              <i className="fas fa-arrow-right-from-bracket text-[13px] w-5 text-center text-slate-400 dark:text-slate-500"></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-200 whitespace-nowrap`}>Switch Client</span>
            </button>
          </nav>

          {/* Monetization Lab Section */}
          <div className={`${!isSidebarOpen && 'hidden'}`}>
            <span className="px-3 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 block">Monetization Lab</span>
            <nav className="space-y-1">
              {labItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${activeView === item.id ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                >
                  <i className={`fas ${item.icon} text-xs w-5 text-center ${activeView === item.id ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`}></i>
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <nav className="space-y-0.5 pt-3 mt-3 border-t border-slate-100/50 dark:border-slate-700/50 px-2">
            {/* My Reports Link */}
            <button
              onClick={() => onViewChange('reports')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 ${activeView === 'reports' ? 'text-slate-900 dark:text-white bg-slate-200/50 dark:bg-slate-800/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'}`}
            >
              <i className={`fas fa-folder-open text-[13px] w-5 text-center ${activeView === 'reports' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-200 whitespace-nowrap`}>My Reports</span>
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-all duration-200"
            >
              <i className="fas fa-home text-[13px] w-5 text-center text-slate-400 dark:text-slate-500"></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-200 whitespace-nowrap`}>Home</span>
            </button>

            <button
              onClick={() => onViewChange('profile')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 ${activeView === 'profile' ? 'text-slate-900 dark:text-white bg-slate-200/50 dark:bg-slate-800/50' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'}`}
            >
              <i className={`fas fa-user-circle text-[13px] w-5 text-center ${activeView === 'profile' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-200 whitespace-nowrap`}>Profile</span>
            </button>

            <button
              onClick={() => onViewChange('settings')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 ${activeView === 'settings' ? 'text-slate-900 bg-slate-200/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'}`}
            >
              <i className={`fas fa-user-gear text-[13px] w-5 text-center ${activeView === 'settings' ? 'text-slate-900' : 'text-slate-400'}`}></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-200 whitespace-nowrap`}>Settings</span>
            </button>

            <button
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md text-[13px] font-medium transition-all duration-200"
              onClick={() => UserService.logout()}
            >
              <i className="fas fa-sign-out-alt text-[13px] w-5 text-center"></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-200 whitespace-nowrap`}>Logout</span>
            </button>
          </nav>
        </div>

        {profile && isSidebarOpen && (
          <div className="p-3">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">{profile.planType}</span>
                {profile.planType === 'free' && (
                  <button
                    onClick={() => setIsPricingOpen(true)}
                    className="text-[9px] bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-wide"
                  >
                    Upgrade
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] mb-2 text-slate-300">
                    <span className="font-medium">Daily Uploads</span>
                    <span className="font-bold text-white">{profile.filesProcessedToday}/{profile.dailyFileLimit}</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                      style={{ width: `${(profile.filesProcessedToday / profile.dailyFileLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <i className="fas fa-coins text-purple-400 text-xs"></i>
                    </div>
                    <span className="text-white font-bold text-sm">{profile.aiCallsRemaining}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Credits</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-500 relative z-0">
        <header className="h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/20 flex items-center justify-between px-6 z-40 sticky top-0 transition-colors duration-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-colors">
              <i className="fas fa-search text-slate-400 mr-2 text-xs"></i>
              <input type="text" placeholder="Search analytics..." className="bg-transparent text-xs border-none focus:ring-0 w-40 placeholder-slate-400 text-slate-900 dark:text-slate-100" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* New: Theme Toggle */}
            <ThemeToggle />

            {/* New: Credit Balance */}
            {profile && (
              <CreditBalance
                credits={profile.creditsAvailable || 0}
                onClick={() => setIsPricingOpen(true)}
              />
            )}

            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
              <i className="far fa-bell text-sm"></i>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">{profile?.displayName || 'Nexus User'}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{profile?.email || profile?.userId}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-nexus-600 to-purple-600 flex items-center justify-center text-white text-xs ring-2 ring-white dark:ring-slate-700 shadow-lg shadow-nexus-500/20">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="font-display font-black">{profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : profile?.userId.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <div className="h-full w-full overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </main>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentUserProfile={profile}
      />
    </div>
  );
};
