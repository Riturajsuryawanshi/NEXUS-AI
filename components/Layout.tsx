
import React from 'react';
import { AppTab } from '../types';

interface LayoutProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const navItems = [
    { id: AppTab.DATA_ANALYST, label: 'Data Analyst', icon: '📊' },
    { id: AppTab.IMAGE_LAB, label: 'Image Lab', icon: '🎨' },
    { id: AppTab.VIDEO_LAB, label: 'Video Lab', icon: '🎬' },
    { id: AppTab.LIVE_CHAT, label: 'Live Assistant', icon: '🎙️' },
    { id: AppTab.GENERAL_CHAT, label: 'Smart Chat', icon: '💬' },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 flex flex-col glass border-r border-slate-800 transition-all duration-300">
        <div className="p-6 mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent hidden md:block">
            NEXUS AI
          </h1>
          <div className="md:hidden text-2xl">NX</div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <span className="text-xl mr-0 md:mr-3">{item.icon}</span>
              <span className="hidden md:block font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center space-y-2 text-xs text-slate-500 hidden md:block">
            <p>© 2025 Nexus AI Platforms</p>
            <p>Powered by Google Gemini</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 glass border-b border-slate-800 flex items-center justify-between px-8 z-10">
          <h2 className="text-lg font-semibold tracking-wide">
            {navItems.find(n => n.id === activeTab)?.label}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
              AI
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
