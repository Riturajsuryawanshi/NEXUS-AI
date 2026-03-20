import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ReviewAudit, UserProfile } from '../types';
import { UserService } from '../services/userService';
import { SubscriptionService } from '../services/subscriptionService';
import { ReportPaywallModal } from './ReportPaywallModal';

interface SavedAudit {
    id: string;
    place_id: string;
    business_name: string;
    created_at: string;
    audit_data: ReviewAudit;
}

interface MyReportsProps {
    onSelectAudit: (audit: ReviewAudit) => void;
}

export const MyReports: React.FC<MyReportsProps> = ({ onSelectAudit }) => {
    const [reports, setReports] = useState<SavedAudit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [previewReport, setPreviewReport] = useState<SavedAudit | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        fetchReports();
        const unsubscribe = UserService.subscribe(setUserProfile);
        return () => unsubscribe();
    }, []);

    const fetchReports = async () => {
        try {
            const { data, error } = await supabase
                .from('business_audits')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('business_audits').delete().eq('id', id);
            if (error) throw error;
            setReports(reports.filter(r => r.id !== id));
            setDeleteTarget(null);
            if (previewReport?.id === id) setPreviewReport(null);
        } catch (err) {
            console.error('Error deleting report:', err);
        }
    };

    // Filter reports by search query
    const filteredReports = reports.filter(r =>
        r.business_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group reports by month
    const groupedReports: Record<string, SavedAudit[]> = {};
    filteredReports.forEach(report => {
        const date = new Date(report.created_at);
        const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        if (!groupedReports[key]) groupedReports[key] = [];
        groupedReports[key].push(report);
    });

    const getHealthScore = (audit: ReviewAudit): number | null => {
        return audit.ai_insights?.health_scores?.overall ?? null;
    };

    const getHealthColor = (score: number) => {
        if (score >= 8) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' };
        if (score >= 6) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' };
        return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800' };
    };

    const handleDownloadClick = () => {
        if (!previewReport) return;
        const plan = userProfile?.planType || 'free';
        const credits = userProfile?.creditsAvailable ?? 0;

        if (plan === 'free' && credits <= 0) {
            setShowPaywall(true);
        } else {
            handlePaywallSuccess();
        }
    };

    const handlePaywallSuccess = () => {
        if (!previewReport) return;

        // Save audit to local storage so ReviewIntelligence can load it
        localStorage.setItem('nexus_active_audit', JSON.stringify(previewReport.audit_data));
        // Add a flag to trigger auto-download
        localStorage.setItem('nexus_auto_download', 'true');

        // Close preview and navigate
        setPreviewReport(null);
        window.dispatchEvent(new CustomEvent('nexus:navigate', { detail: 'dashboard' }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-16 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Loading your reports...</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Search Bar */}
            <div className="mb-8">
                <div className="relative max-w-md">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm"></i>
                    <input
                        type="text"
                        placeholder="Search reports by business name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-600 transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <i className="fas fa-times text-[10px]"></i>
                        </button>
                    )}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                    {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} found
                </p>
            </div>

            {/* Empty State */}
            {filteredReports.length === 0 && (
                <div className="text-center p-16 bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-400 dark:text-slate-500">
                        <i className="fas fa-folder-open text-3xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {searchQuery ? 'No Matching Reports' : 'No Reports Yet'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                        {searchQuery
                            ? `No reports found matching "${searchQuery}". Try a different search.`
                            : 'Analyze a business with Review Intelligence to see your reports here.'}
                    </p>
                </div>
            )}

            {/* Grouped Reports */}
            <div className="space-y-10">
                {Object.entries(groupedReports).map(([monthLabel, monthReports]) => (
                    <div key={monthLabel}>
                        {/* Month Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                                <i className="fas fa-calendar-day text-indigo-500 dark:text-indigo-400 text-xs"></i>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{monthLabel}</h3>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{monthReports.length} {monthReports.length === 1 ? 'report' : 'reports'}</p>
                            </div>
                        </div>

                        {/* Report Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {monthReports.map((report) => {
                                const healthScore = getHealthScore(report.audit_data);
                                const healthColors = healthScore !== null ? getHealthColor(healthScore) : null;
                                const rating = report.audit_data.preprocess?.average_rating ?? report.audit_data.business_summary?.rating;
                                const totalReviews = report.audit_data.preprocess?.total_reviews ?? report.audit_data.business_summary?.total_reviews ?? 0;
                                const category = report.audit_data.ai_insights?.business_overview?.category;

                                return (
                                    <div
                                        key={report.id}
                                        onClick={() => setPreviewReport(report)}
                                        className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700/50 hover:-translate-y-0.5 transition-all cursor-pointer group relative"
                                    >
                                        {/* Top Row: Icon + Delete */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-xl flex items-center justify-center">
                                                <i className="fas fa-store text-indigo-600 dark:text-indigo-400 text-sm"></i>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(report.id); }}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <i className="fas fa-trash-alt text-xs"></i>
                                            </button>
                                        </div>

                                        {/* Business Name */}
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 text-[15px]">{report.business_name}</h4>

                                        {/* Meta Row */}
                                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium mb-4">
                                            <span>{new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                            <span>{totalReviews.toLocaleString()} reviews</span>
                                            {category && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                                    <span className="truncate max-w-[100px]">{category}</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Metrics Row */}
                                        <div className="flex items-center gap-2">
                                            {/* Rating */}
                                            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                {rating?.toFixed(1)} ★
                                            </span>

                                            {/* Health Score */}
                                            {healthScore !== null && healthColors && (
                                                <span className={`px-2.5 py-1 ${healthColors.bg} ${healthColors.text} text-xs font-bold rounded-lg border ${healthColors.border}`}>
                                                    {healthScore}/10 Health
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950/40 rounded-xl flex items-center justify-center">
                                <i className="fas fa-trash-alt text-rose-600 dark:text-rose-400"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Delete Report?</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteTarget)}
                                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Preview Panel */}
            {previewReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/30 backdrop-blur-sm" onClick={() => setPreviewReport(null)}>
                    <div
                        className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl border-l border-slate-200 dark:border-slate-700 overflow-y-auto animate-in slide-in-from-right duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Preview Header */}
                        <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 p-5 z-10">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Report Preview</span>
                                <button
                                    onClick={() => setPreviewReport(null)}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    <i className="fas fa-times text-sm"></i>
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{previewReport.business_name}</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                                Generated on {new Date(previewReport.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>

                        {/* Preview Body */}
                        <div className="p-5 space-y-5">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                                        {(previewReport.audit_data.preprocess?.average_rating ?? previewReport.audit_data.business_summary?.rating)?.toFixed(1)}
                                    </div>
                                    <div className="text-yellow-400 text-xs mt-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <i key={i} className={`fas fa-star ${i < Math.round(previewReport.audit_data.business_summary?.rating || 0) ? '' : 'text-slate-200 dark:text-slate-600'}`}></i>
                                        ))}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">Average Rating</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                                        {(previewReport.audit_data.preprocess?.total_reviews ?? previewReport.audit_data.business_summary?.total_reviews ?? 0).toLocaleString()}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">Total Reviews</div>
                                </div>
                            </div>

                            {/* Health Score */}
                            {previewReport.audit_data.ai_insights?.health_scores && (
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/30">
                                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Health Score</div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                            {previewReport.audit_data.ai_insights.health_scores.overall}
                                            <span className="text-sm text-indigo-300 dark:text-indigo-600">/10</span>
                                        </div>
                                        <div className="flex-1 grid grid-cols-5 gap-1.5 text-center">
                                            {[
                                                { label: 'SVC', score: previewReport.audit_data.ai_insights.health_scores.service },
                                                { label: 'PRD', score: previewReport.audit_data.ai_insights.health_scores.product },
                                                { label: 'MGT', score: previewReport.audit_data.ai_insights.health_scores.management },
                                                { label: 'REP', score: previewReport.audit_data.ai_insights.health_scores.reputation },
                                                { label: 'OPS', score: previewReport.audit_data.ai_insights.health_scores.operational_stability },
                                            ].map(({ label, score }) => (
                                                <div key={label}>
                                                    <div className={`text-xs font-black ${score >= 7 ? 'text-emerald-600 dark:text-emerald-400' : score >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{score}</div>
                                                    <div className="text-[8px] font-bold text-slate-400 dark:text-slate-500">{label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sentiment Breakdown */}
                            {previewReport.audit_data.preprocess?.sentiment_breakdown && (
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Sentiment</div>
                                    <div className="flex gap-2">
                                        {[
                                            { label: 'Positive', value: previewReport.audit_data.preprocess.sentiment_breakdown.positive, color: 'bg-emerald-400' },
                                            { label: 'Neutral', value: previewReport.audit_data.preprocess.sentiment_breakdown.neutral, color: 'bg-slate-300 dark:bg-slate-500' },
                                            { label: 'Negative', value: previewReport.audit_data.preprocess.sentiment_breakdown.negative, color: 'bg-red-400' },
                                        ].map(({ label, value, color }) => {
                                            const total = previewReport.audit_data.preprocess.sentiment_breakdown.positive + previewReport.audit_data.preprocess.sentiment_breakdown.neutral + previewReport.audit_data.preprocess.sentiment_breakdown.negative;
                                            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                                            return (
                                                <div key={label} className="flex-1 text-center">
                                                    <div className={`h-2 ${color} rounded-full mb-1.5`} style={{ width: `${Math.max(pct, 8)}%`, margin: '0 auto' }}></div>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white">{pct}%</div>
                                                    <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Top Strengths */}
                            {previewReport.audit_data.ai_insights?.strengths && previewReport.audit_data.ai_insights.strengths.length > 0 && (
                                <div>
                                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Top Strengths</div>
                                    <div className="space-y-2">
                                        {previewReport.audit_data.ai_insights.strengths.slice(0, 3).map((s, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <i className="fas fa-check-circle text-emerald-500 mt-0.5 text-xs shrink-0"></i>
                                                <span className="font-medium">{s.theme}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Top Weaknesses */}
                            {previewReport.audit_data.ai_insights?.weaknesses && previewReport.audit_data.ai_insights.weaknesses.length > 0 && (
                                <div>
                                    <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Top Issues</div>
                                    <div className="space-y-2">
                                        {previewReport.audit_data.ai_insights.weaknesses.slice(0, 3).map((w, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <i className="fas fa-exclamation-triangle text-red-400 mt-0.5 text-xs shrink-0"></i>
                                                <span className="font-medium">{w.theme}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preview Footer */}
                        <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 p-5">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        onSelectAudit(previewReport.audit_data);
                                        setPreviewReport(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-expand"></i>
                                    Open Full Report
                                </button>
                                <button
                                    onClick={handleDownloadClick}
                                    className="px-4 py-3 bg-white border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-all flex items-center justify-center gap-2"
                                    title="Download PDF"
                                >
                                    <i className={`fas ${(userProfile?.planType === 'free' && !userProfile?.creditsAvailable) ? 'fa-lock' : 'fa-file-pdf'}`}></i>
                                </button>
                                <button
                                    onClick={() => { setDeleteTarget(previewReport.id); }}
                                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                >
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Paywall Modal */}
            <ReportPaywallModal
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                onDownloadReady={handlePaywallSuccess}
                currentUserProfile={userProfile}
                businessName={previewReport?.business_name}
            />
        </div>
    );
};
