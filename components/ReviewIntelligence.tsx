import React, { useState } from 'react';
import { ReviewService } from '../services/reviewService';
import { ReviewAudit, ReviewCluster, RevenueLeak, UpsellOpportunity } from '../types';

export const ReviewIntelligence: React.FC = () => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [audit, setAudit] = useState<ReviewAudit | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setIsLoading(true);
        setError(null);
        setAudit(null);

        try {
            const result = await ReviewService.getAudit(url);
            setAudit(result);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate audit. Please check the URL.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[500px] max-h-[800px] relative transition-all duration-500">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <i className="fas fa-star-half-stroke text-xl"></i>
                    </div>
                    <div>
                        <h3 className="text-2xl font-display font-bold text-slate-900">Review Intelligence</h3>
                        <p className="text-slate-500 font-medium">Turn Public Reviews Into Revenue Insights</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-[#f8fafc]">
                {!audit && !isLoading && !error && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-12 text-slate-400">
                        <i className="fas fa-map-location-dot text-6xl mb-6 text-slate-200"></i>
                        <p className="text-lg font-medium">Paste a Google Maps link below to start auditing.</p>
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <div className="text-center">
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Analyzing Brand Sentiment</h4>
                            <p className="text-slate-500 animate-pulse">Clustering reviews • Identifying leaks • Calculating impact...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h4 className="text-lg font-bold text-rose-900 mb-2">Audit Failed</h4>
                        <p className="text-rose-600 font-medium">{error}</p>
                    </div>
                )}

                {audit && (
                    <>
                        {/* Business Summary Card */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-display font-black text-slate-900">{audit.business_summary.name}</h2>
                                <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
                                    <span>{audit.business_summary.total_reviews} Reviews</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>ID: {audit.business_summary.place_id.substring(0, 10)}...</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-5xl font-black text-slate-900 tracking-tighter">{audit.business_summary.rating}<span className="text-2xl text-slate-400">/5</span></div>
                                <div className="text-yellow-400 text-sm">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`fas fa-star ${i < Math.round(audit.business_summary.rating) ? '' : 'text-slate-200'}`}></i>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Review Clusters */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2">Sentiment Clusters</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {audit.review_clusters.map((cluster, i) => (
                                    <div key={i} className={`p-6 rounded-2xl border ${cluster.sentiment === 'positive' ? 'bg-emerald-50 border-emerald-100' : cluster.sentiment === 'negative' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'} `}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${cluster.sentiment === 'positive' ? 'bg-emerald-200 text-emerald-800' : cluster.sentiment === 'negative' ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                                                {cluster.sentiment}
                                            </span>
                                            <span className="text-2xl font-black opacity-20">{cluster.frequency_percentage}%</span>
                                        </div>
                                        <h5 className="font-bold text-lg mb-2 capitalize">{cluster.theme}</h5>
                                        <p className="text-sm opacity-80 mb-4 font-medium">{cluster.business_impact_estimate}</p>
                                        <ul className="space-y-1">
                                            {cluster.key_complaints_or_praises.slice(0, 2).map((pt, j) => (
                                                <li key={j} className="text-xs flex items-start gap-2">
                                                    <i className={`fas ${cluster.sentiment === 'positive' ? 'fa-check' : 'fa-circle-exclamation'} mt-0.5 opacity-50`}></i>
                                                    {pt}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Revenue Leaks */}
                        <div>
                            <h4 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-4 pl-2">Critical Revenue Leaks</h4>
                            <div className="space-y-4">
                                {audit.revenue_leak_indicators.map((leak, i) => (
                                    <div key={i} className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute left-0 top-0 w-1 h-full bg-rose-500"></div>
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                                                <i className="fas fa-money-bill-wave"></i>
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-900 text-lg">{leak.issue}</h5>
                                                <p className="text-rose-600 font-medium text-sm mt-1 mb-2">{leak.potential_business_risk}</p>
                                                <div className="bg-slate-50 p-3 rounded-xl text-sm font-medium text-slate-600">
                                                    <i className="fas fa-wrench mr-2 text-indigo-500"></i>
                                                    Fix: {leak.recommended_fix}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upsell Opportunities */}
                        <div>
                            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 pl-2">Growth & Upsell</h4>
                            <div className="space-y-4">
                                {audit.upsell_opportunities.map((opp, i) => (
                                    <div key={i} className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <i className="fas fa-lightbulb text-yellow-300 text-xl"></i>
                                                <h5 className="font-bold text-lg">{opp.opportunity}</h5>
                                            </div>
                                            <p className="opacity-90 font-medium text-sm border-l-2 border-white/30 pl-3">
                                                "{opp.supporting_review_pattern}"
                                            </p>
                                        </div>
                                        {/* Decorative BG */}
                                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Sticky Footer Input */}
            <div className="p-6 bg-white border-t border-slate-100 z-10">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste Google Maps business link..."
                        className="w-full pl-6 pr-16 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !url}
                        className="absolute right-3 top-3 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md shadow-indigo-200"
                    >
                        {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                    </button>
                </form>
            </div>
        </div>
    );
};
