
import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { UserProfile } from '../types';

import { Client } from '../types';

export type AppView = 'dashboard' | 'settings' | 'lab-make-money' | 'lab-opportunities' | 'lab-proof-reports';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  client?: Client;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, client }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = UserService.subscribe(p => setProfile(p));
    return unsubscribe;
  }, []);

  const labItems: { id: AppView; label: string; icon: string }[] = [
    { id: 'lab-make-money', label: 'Make Money', icon: 'fa-sack-dollar' },
    { id: 'lab-opportunities', label: 'Opportunities', icon: 'fa-radar' },
    { id: 'lab-proof-reports', label: 'Proof Reports', icon: 'fa-file-shield' },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-slate-950 text-white flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out relative z-50`}
      >
        <div className="p-6 h-20 flex items-center justify-between border-b border-slate-900">
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <i className="fas fa-layer-group text-white text-lg"></i>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-tight text-white whitespace-nowrap leading-none">NexusAnalyst</span>
              {client && <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400">{client.name}</span>}
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-8 h-8 rounded-lg hover:bg-slate-900 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
          >
            <i className={`fas ${isSidebarOpen ? 'fa-angle-left' : 'fa-angle-right'}`}></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-4 space-y-8">
          {/* Main Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <i className={`fas fa-grid-2 text-lg ${activeView === 'dashboard' ? 'text-white' : 'group-hover:text-white'}`}></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-300 whitespace-nowrap`}>Studio</span>
            </button>

            <button
              onClick={() => { window.dispatchEvent(new CustomEvent('nexus:switch-client')); }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group text-slate-400 hover:text-white hover:bg-slate-900"
            >
              <i className="fas fa-arrow-right-from-bracket text-lg group-hover:text-amber-400"></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-300 whitespace-nowrap`}>Switch Client</span>
            </button>
          </nav>

          {/* Monetization Lab Section */}
          <div className={`${!isSidebarOpen && 'hidden'}`}>
            <span className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Monetization Lab</span>
            <nav className="space-y-1">
              {labItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${activeView === item.id ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white hover:bg-slate-900'}`}
                >
                  <i className={`fas ${item.icon} text-lg w-6 text-center ${activeView === item.id ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`}></i>
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <nav className="space-y-2 pt-4 border-t border-slate-900">
            <button
              onClick={() => onViewChange('settings')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${activeView === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            >
              <i className={`fas fa-user-gear text-lg ${activeView === 'settings' ? 'text-white' : 'group-hover:text-white'}`}></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-300 whitespace-nowrap`}>Settings</span>
            </button>

            <button
              className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-sm font-medium transition-all group"
              onClick={() => UserService.logout()}
            >
              <i className="fas fa-sign-out-alt text-lg"></i>
              <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'} transition-all duration-300 whitespace-nowrap`}>Logout</span>
            </button>
          </nav>
        </div>

        {profile && isSidebarOpen && (
          <div className="p-6">
            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{profile.planType}</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-2 text-slate-400">
                    <span>Usage</span>
                    <span className="text-slate-200">{Math.round((profile.filesProcessedToday / profile.dailyFileLimit) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-1000"
                      style={{ width: `${(profile.filesProcessedToday / profile.dailyFileLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                  <i className="fas fa-brain text-indigo-500"></i>
                  <span>{profile.aiCallsRemaining} Credits Left</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen bg-[#f8fafc]">
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8 z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
              <i className="fas fa-search text-slate-400 mr-2 text-xs"></i>
              <input type="text" placeholder="Search analytics..." className="bg-transparent text-sm border-none focus:ring-0 w-48 placeholder-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500">
              <i className="far fa-bell"></i>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-bold text-slate-800 leading-none">{profile?.userId.split('@')[0]}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs shadow-md">
                <i className="fas fa-user"></i>
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
    </div>
  );
};
