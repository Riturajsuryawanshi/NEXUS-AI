import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { UserService } from '../services/userService';

interface ProfileViewProps {
    profile: UserProfile;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile }) => {
    const [displayName, setDisplayName] = useState(profile.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        setDisplayName(profile.displayName || '');
    }, [profile]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await UserService.updateProfile({ display_name: displayName });
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-12 space-y-12">
            <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                <div>
                    <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight">User Profile</h2>
                    <p className="text-slate-500 mt-2 font-medium">Manage your account settings and preferences.</p>
                </div>
                <div className="text-xs font-mono bg-slate-100 px-3 py-1 rounded text-slate-500">ID: {profile.userId.substring(0, 8)}...</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Profile Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <i className="fas fa-user-circle text-indigo-600 text-2xl"></i>
                            Personal Information
                        </h3>

                        <div className="space-y-6 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={profile.authProvider === 'email' ? 'Managed by Auth Provider' : 'Linked Account'}
                                        disabled
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-medium cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 font-semibold placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                    <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                    {message.text}
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-3 shadow-lg shadow-indigo-500/10"
                                >
                                    {isSaving ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-save"></i>}
                                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Card */}
                <div className="space-y-8">
                    <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden min-h-[400px] flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] -ml-10 -mb-10"></div>

                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white/90">
                                <i className="fas fa-chart-pie text-indigo-400"></i>
                                Usage Statistics
                            </h3>

                            <div className="space-y-8">
                                <div>
                                    <div className="text-indigo-200/60 text-[10px] font-bold uppercase tracking-widest mb-2">Current Plan</div>
                                    <div className="text-3xl font-display font-black capitalize text-white tracking-tight">{profile.planType}</div>
                                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 uppercase tracking-wide">
                                        {profile.planType === 'free' ? 'Upgrade to Pro' : 'Active Subscription'}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="text-indigo-200/60 text-[10px] font-bold uppercase tracking-widest">Daily File Limit</div>
                                        <div className="text-right">
                                            <span className="text-white font-mono font-bold text-lg">{profile.filesProcessedToday}</span>
                                            <span className="text-indigo-200/40 text-sm mx-1">/</span>
                                            <span className="text-indigo-200/60 font-mono text-sm">{profile.dailyFileLimit}</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${Math.min((profile.filesProcessedToday / profile.dailyFileLimit) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-indigo-200/60 text-[10px] font-bold uppercase tracking-widest mb-1">AI Credits</div>
                                    <div className="text-3xl font-mono font-bold text-white tracking-tight">{profile.aiCallsRemaining}</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 pt-8 border-t border-white/10 mt-4">
                            <p className="text-xs text-indigo-200/40 leading-relaxed">
                                Usage resets daily at 00:00 UTC. Need more capacity? Contact enterprise support.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
