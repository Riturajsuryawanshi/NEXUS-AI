
import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { UserProfile } from '../types';

export const Settings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = UserService.subscribe(p => setProfile(p));
    return unsubscribe;
  }, []);

  if (!profile) return null;

  return (
    <div className="space-y-10 max-w-4xl">
      <section>
        <h3 className="text-3xl font-display font-black text-slate-900 mb-8 tracking-tight">Profile Settings</h3>
        <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/40 space-y-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-4xl shadow-lg shadow-indigo-600/20">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-3xl" />
              ) : (
                <span className="font-display font-black">{profile.displayName ? profile.displayName.charAt(0).toUpperCase() : profile.userId.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-display font-black text-slate-900 text-3xl tracking-tight">
                {profile.displayName || 'Nexus User'}
              </h4>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <i className="fas fa-envelope text-indigo-500"></i>
                {profile.email || profile.userId}
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <i className="fas fa-calendar-alt"></i>
                  Member since 2025
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Display Name</label>
              <div className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-lg">
                {profile.displayName || 'Not set'}
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
              <div className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-lg flex items-center justify-between group">
                <span>{profile.email || profile.userId}</span>
                <i className="fas fa-lock text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-display font-bold text-slate-900 mb-6">Subscription & Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-crown text-xl"></i>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Plan</p>
            <h4 className="text-xl font-display font-bold text-slate-900 mb-4 capitalize">{profile.planType}</h4>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('nexus:open-pricing'))}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all"
            >
              Upgrade Plan
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-file-arrow-up text-xl"></i>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Uploads Used</p>
            <h4 className="text-xl font-display font-bold text-slate-900 mb-2">{profile.filesProcessedToday} / {profile.dailyFileLimit}</h4>
            <p className="text-[10px] text-slate-400 italic">Resets at midnight</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-brain text-xl"></i>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI Insights</p>
            <h4 className="text-xl font-display font-bold text-slate-900 mb-2">{profile.aiCallsRemaining} Remaining</h4>
            <p className="text-[10px] text-slate-400 italic">Unlimited on Pro</p>
          </div>
        </div>
      </section>

      <section className="pt-8 border-t border-slate-200">
        <h3 className="text-xl font-display font-bold text-rose-600 mb-6">Danger Zone</h3>
        <div className="bg-rose-50 rounded-3xl border border-rose-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-bold text-rose-900">Delete Account</h4>
            <p className="text-rose-700 text-sm opacity-80">This will permanently remove all your datasets and job history.</p>
          </div>
          <button className="px-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all">Delete Everything</button>
        </div>
      </section>
    </div>
  );
};
