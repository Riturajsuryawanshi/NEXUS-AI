
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
        <h3 className="text-2xl font-display font-bold text-slate-900 mb-6">Profile Settings</h3>
        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl">
                <i className="fas fa-user-astronaut"></i>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{profile.userId}</h4>
                <p className="text-slate-500 text-sm">Member since March 2025</p>
                <button className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">Change Avatar</button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Full Name</label>
                <input type="text" value={profile.userId.split('@')[0]} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none" readOnly />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Email Address</label>
                <input type="email" value={profile.userId} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none" readOnly />
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
              <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all">Upgrade Plan</button>
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
