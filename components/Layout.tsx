
import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { UserProfile, Client } from '../types';
import { SubscriptionService } from '../services/subscriptionService';
import { PricingModal } from './PricingModal';
import { CreditBalance } from './CreditBalance';
import { ThemeToggle } from './ThemeToggle';

export type AppView = 'dashboard' | 'settings' | 'monetization-lab' | 'profile' | 'reports';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  client?: Client;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, client }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [reportLimit, setReportLimit] = useState<number | 'unlimited'>(3);

  useEffect(() => {
    const unsubscribe = UserService.subscribe(async (p) => {
      setProfile(p);
      if (p) {
        const planType = p.planType || 'free';
        const limit = SubscriptionService.getReportLimit(planType);
        setReportLimit(limit);
        const usage = await SubscriptionService.getMonthlyUsage(p.userId);
        setMonthlyUsage(usage);
      }
    });

    const handleOpenPricing = () => setIsPricingOpen(true);
    window.addEventListener('nexus:open-pricing', handleOpenPricing);

    return () => {
      unsubscribe();
      window.removeEventListener('nexus:open-pricing', handleOpenPricing);
    };
  }, []);

  const isAtLimit = reportLimit !== 'unlimited' && monthlyUsage >= reportLimit;
  const usagePercent = reportLimit === 'unlimited' ? 0 : Math.min((monthlyUsage / (reportLimit as number)) * 100, 100);

  // Tooltip wrapper for collapsed mode
  const NavTooltip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="relative group/tip">
      {children}
      {!isSidebarOpen && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-all duration-200 shadow-xl z-[100]">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-900"></div>
        </div>
      )}
    </div>
  );

  // Navigation item component
  const NavItem: React.FC<{
    view: AppView;
    icon: string;
    label: string;
    accentColor?: string;
    onClick?: () => void;
  }> = ({ view, icon, label, accentColor = 'indigo', onClick }) => {
    const isActive = activeView === view;
    const colors: Record<string, { bg: string; text: string; accent: string; iconActive: string }> = {
      indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', accent: 'bg-indigo-500', iconActive: 'text-indigo-600 dark:text-indigo-400' },
      purple: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', accent: 'bg-purple-500', iconActive: 'text-purple-600 dark:text-purple-400' },
      amber: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', accent: 'bg-amber-500', iconActive: 'text-amber-600 dark:text-amber-400' },
      emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', accent: 'bg-emerald-500', iconActive: 'text-emerald-600 dark:text-emerald-400' },
    };
    const c = colors[accentColor] || colors.indigo;

    return (
      <NavTooltip label={label}>
        <button
          onClick={onClick || (() => onViewChange(view))}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 relative ${isActive
            ? `${c.bg} ${c.text} shadow-sm`
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
            }`}
        >
          {/* Active accent bar */}
          {isActive && (
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 ${c.accent} rounded-r-full`}></div>
          )}
          <i className={`fas ${icon} text-[13px] w-5 text-center transition-colors ${isActive ? c.iconActive : 'text-slate-400 dark:text-slate-500'}`}></i>
          <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'} transition-all duration-200 whitespace-nowrap`}>{label}</span>
        </button>
      </NavTooltip>
    );
  };



  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-[260px]' : 'w-[72px]'} bg-white/60 dark:bg-slate-900/90 backdrop-blur-2xl border-r border-slate-200/60 dark:border-slate-800/60 flex-shrink-0 flex flex-col transition-all duration-300 ease-out relative z-50`}
      >
        {/* Logo & Toggle */}
        <div className="px-4 h-16 flex items-center justify-between border-b border-slate-100/60 dark:border-slate-800/40">
          <div className={`flex items-center gap-3 transition-all duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <i className="fas fa-bolt text-white text-sm"></i>
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">NEXUS</span>
              <span className="text-[9px] ml-1.5 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold uppercase tracking-wider">AI</span>
            </div>
          </div>
          {!isSidebarOpen && (
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 mx-auto">
              <i className="fas fa-bolt text-white text-sm"></i>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all ${!isSidebarOpen ? 'absolute -right-3 top-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm z-10 rounded-full w-6 h-6' : ''}`}
          >
            <i className={`fas ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'} text-[9px]`}></i>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-5 px-3 space-y-6">
          {/* Main Section */}
          <div className="space-y-1">
            {isSidebarOpen && (
              <span className="px-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2 block">Main</span>
            )}
            <NavItem view="dashboard" icon="fa-grid-2" label="Studio" accentColor="indigo" />
            <NavTooltip label="Switch Client">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('nexus:switch-client'))}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all duration-200"
              >
                <i className="fas fa-arrow-right-from-bracket text-[13px] w-5 text-center text-slate-400 dark:text-slate-500"></i>
                <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'} transition-all duration-200 whitespace-nowrap`}>Switch Client</span>
              </button>
            </NavTooltip>
          </div>

          {/* Monetization Lab */}
          <div className="space-y-1">
            {isSidebarOpen && (
              <span className="px-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2 block">Tools</span>
            )}
            {!isSidebarOpen && (
              <div className="flex justify-center mb-2">
                <div className="w-6 h-px bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              </div>
            )}
            <NavItem view="monetization-lab" icon="fa-flask" label="Monetization Lab" accentColor="emerald" />
          </div>

          {/* Reports & Navigation */}
          <div className="space-y-1">
            {isSidebarOpen && (
              <span className="px-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2 block">Account</span>
            )}
            {!isSidebarOpen && (
              <div className="flex justify-center mb-2">
                <div className="w-6 h-px bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              </div>
            )}
            <NavItem view="reports" icon="fa-folder-open" label="My Reports" accentColor="indigo" />
            <NavTooltip label="Home">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all duration-200"
              >
                <i className="fas fa-home text-[13px] w-5 text-center text-slate-400 dark:text-slate-500"></i>
                <span className={`${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'} transition-all duration-200 whitespace-nowrap`}>Home</span>
              </button>
            </NavTooltip>
            <NavItem view="profile" icon="fa-user-circle" label="Profile" accentColor="indigo" />
            <NavItem view="settings" icon="fa-user-gear" label="Settings" accentColor="indigo" />
          </div>
        </div>

        {/* Bottom: Usage Card + User Section */}
        {profile && (
          <div className="p-3 space-y-3 border-t border-slate-100/60 dark:border-slate-800/40">
            {/* Usage Card — only when expanded */}
            {isSidebarOpen && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-700/50 shadow-xl relative overflow-hidden">
                {/* Glow effects */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl -mr-4 -mt-4"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/15 rounded-full blur-2xl -ml-4 -mb-4"></div>

                <div className="relative z-10 space-y-4">
                  {/* Plan badge + Upgrade */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${profile.planType === 'free' ? 'bg-slate-400' : 'bg-emerald-400'} animate-pulse`}></div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">{profile.planType} Plan</span>
                    </div>
                    {profile.planType === 'free' && (
                      <button
                        onClick={() => setIsPricingOpen(true)}
                        className="relative text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 overflow-hidden group"
                      >
                        <span className="relative z-10">Upgrade</span>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </button>
                    )}
                  </div>

                  {/* Monthly Reports */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="font-medium text-slate-400">Monthly Reports</span>
                      <span className={`font-bold ${isAtLimit ? 'text-rose-400' : 'text-white'}`}>
                        {reportLimit === 'unlimited' ? '∞' : `${monthlyUsage}/${reportLimit}`}
                      </span>
                    </div>
                    {reportLimit !== 'unlimited' && (
                      <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${isAtLimit ? 'bg-gradient-to-r from-rose-500 to-red-400' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                          style={{ width: `${usagePercent}%` }}
                        ></div>
                      </div>
                    )}
                    {isAtLimit && (
                      <p className="text-[9px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                        <i className="fas fa-exclamation-circle text-[8px]"></i>
                        Limit reached — upgrade for more
                      </p>
                    )}
                  </div>

                  {/* Daily Uploads */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="font-medium text-slate-400">Daily Uploads</span>
                      <span className="font-bold text-white">{profile.filesProcessedToday}/{profile.dailyFileLimit}</span>
                    </div>
                    <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((profile.filesProcessedToday / profile.dailyFileLimit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* AI Credits */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <i className="fas fa-coins text-amber-400 text-[10px]"></i>
                      </div>
                      <span className="text-white font-bold text-sm tabular-nums">{profile.aiCallsRemaining}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">AI Credits</span>
                  </div>
                </div>
              </div>
            )}

            {/* Collapsed usage indicator */}
            {!isSidebarOpen && (
              <NavTooltip label={`${reportLimit === 'unlimited' ? '∞' : `${monthlyUsage}/${reportLimit}`} reports used`}>
                <div
                  className="flex flex-col items-center gap-1 py-2 cursor-pointer"
                  onClick={() => isAtLimit && setIsPricingOpen(true)}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isAtLimit ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    <i className={`fas ${isAtLimit ? 'fa-lock' : 'fa-chart-simple'} text-xs`}></i>
                  </div>
                  {reportLimit !== 'unlimited' && (
                    <div className="w-6 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isAtLimit ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        style={{ width: `${usagePercent}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </NavTooltip>
            )}

            {/* User avatar section */}
            <div
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/50 cursor-pointer transition-all ${!isSidebarOpen ? 'justify-center' : ''}`}
              onClick={() => onViewChange('profile')}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs flex-shrink-0 ring-2 ring-white/50 dark:ring-slate-700/50 shadow-md">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="font-black">{profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : '?'}</span>
                )}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-none">{profile?.displayName || 'Nexus User'}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{profile?.email || 'Set up profile'}</p>
                </div>
              )}
              {isSidebarOpen && (
                <button
                  className="w-7 h-7 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); UserService.logout(); }}
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt text-[11px]"></i>
                </button>
              )}
            </div>
            {!isSidebarOpen && (
              <NavTooltip label="Logout">
                <button
                  className="w-full flex items-center justify-center py-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                  onClick={() => UserService.logout()}
                >
                  <i className="fas fa-sign-out-alt text-[12px]"></i>
                </button>
              </NavTooltip>
            )}
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
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Credit Balance */}
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
