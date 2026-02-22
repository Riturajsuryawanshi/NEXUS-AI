import React, { useState, useEffect } from 'react';
import { ReviewService, ReviewPipelineStep } from '../services/reviewService';
import { ReviewAudit } from '../types';
import { supabase } from '../services/supabaseClient'; // Added import
import { UserService } from '../services/userService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  LineController
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, LineController
);

const STEP_LABELS: Record<ReviewPipelineStep, string> = {
  idle: '',
  parsing: 'Validating URL...',
  fetching: 'Fetching reviews from Google...',
  preprocessing: 'Crunching numbers (Deterministic)...',
  ai_analysis: 'Gemini AI reasoning...',
  complete: 'Audit Ready!',
  error: 'Analysis failed',
};

export const ReviewIntelligence: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ReviewPipelineStep>('idle');
  const [audit, setAudit] = useState<ReviewAudit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPaidUser = (): boolean => {
    const userId = UserService.getCurrentUserId();
    if (userId === 'guest') return false;
    try {
      const profile = (UserService as any).currentUserProfile;
      return profile?.planType && profile.planType !== 'free';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setAudit(null);
    setCurrentStep('parsing');

    try {
      // Simulate slight delay for steps that might be too fast in real API
      const result = await ReviewService.getAudit(url, (step) => {
        setCurrentStep(step);
      });
      setAudit(result);
    } catch (err: any) {
      console.error('[ReviewIntelligence]', err);
      const message = err.message || 'Failed to generate audit. Please check the URL and try again.';
      setError(message);
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // ... inside ReviewIntelligence component ...
  const [isSaving, setIsSaving] = useState(false); // New state

  // Effect to load audit from history (injected via localStorage from MyReports)
  useEffect(() => {
    const handleLoadAudit = () => {
      const stored = localStorage.getItem('nexus_active_audit');
      if (stored) {
        try {
          const auditData = JSON.parse(stored);
          setAudit(auditData);
          setCurrentStep('complete');
          // Extract URL from business summary if available, or just leave blank
          // setUrl(auditData.business_summary?.url || ''); 
          console.log("Loaded audit from history:", auditData);
        } catch (e) {
          console.error("Failed to load audit from history", e);
        }
        // Clear it so it doesn't reload on refresh unexpectedly
        localStorage.removeItem('nexus_active_audit');
      }
    };

    window.addEventListener('nexus:load-audit', handleLoadAudit);
    // Check immediately on mount too
    handleLoadAudit();

    return () => window.removeEventListener('nexus:load-audit', handleLoadAudit);
  }, []);

  const saveReport = async () => {
    if (!audit) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to save reports.");
        return;
      }

      const { error } = await supabase.from('business_audits').insert({
        user_id: user.id,
        place_id: audit.business_summary.place_id,
        business_name: audit.business_summary.name,
        audit_data: audit
      });

      if (error) throw error;
      alert("Report saved to your history!");
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("Failed to save report: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const Card: React.FC<{ title: string; icon?: string; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        {icon && <i className={`fas ${icon}`}></i>}
        {title}
      </h4>
      {children}
    </div>
  );

  const renderDashboard = () => {
    if (!audit) return null;
    const { preprocess, ai_insights } = audit;
    const paid = isPaidUser();
    const showAI = audit.source === 'full' && ai_insights;

    // Charts Config
    const ratingData = {
      labels: ['5★', '4★', '3★', '2★', '1★'],
      datasets: [{
        data: [5, 4, 3, 2, 1].map(s => preprocess.rating_distribution[s] || 0),
        backgroundColor: ['#10b981', '#34d399', '#fcd34d', '#f43f5e', '#e11d48'],
        borderRadius: 4,
      }]
    };

    const sentimentData = {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [{
        data: [
          preprocess.sentiment_breakdown.positive,
          preprocess.sentiment_breakdown.negative,
          preprocess.sentiment_breakdown.neutral
        ],
        backgroundColor: ['#10b981', '#f43f5e', '#fcd34d'],
        borderWidth: 0,
      }]
    };

    // Sort trends by date (month string is YYYY-MM)
    const sortedTrends = [...preprocess.time_trends].sort((a, b) => a.month.localeCompare(b.month));
    const trendData = {
      labels: sortedTrends.map(t => t.month),
      datasets: [
        {
          label: 'Avg Rating',
          data: sortedTrends.map(t => t.avgRating),
          borderColor: '#6366f1',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Review Vol',
          data: sortedTrends.map(t => t.count),
          type: 'bar' as 'line', // Hack to allow mixed chart types in typescript
          backgroundColor: '#e2e8f0',
          yAxisID: 'y1'
        }
      ]
    };

    return (
      <div className="space-y-6">
        {/* Row 1: Business Overview */}
        <div className="bg-white dark:bg-slate-800/80 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-3xl font-display font-black text-slate-900 dark:text-white leading-tight">{audit.business_summary.name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mt-2 text-slate-500 dark:text-slate-400 font-medium text-xs md:text-sm">
              <span>{preprocess.business_industry}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full hidden md:block"></span>
              <span>{preprocess.business_location}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full hidden md:block"></span>
              <span>{audit.business_summary.total_reviews} Reviews</span>
            </div>
          </div>
          <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end bg-slate-50 dark:bg-slate-700/50 md:bg-transparent md:dark:bg-transparent p-3 md:p-0 rounded-xl">
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 md:hidden">Rating</span>
            <div className="text-right">
              <div className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{audit.business_summary.rating}<span className="text-lg md:text-2xl text-slate-400 dark:text-slate-500">/5</span></div>
              <div className="text-yellow-400 text-xs md:text-sm">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fas fa-star ${i < Math.round(audit.business_summary.rating) ? '' : 'text-slate-200'}`}></i>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Charts (Deterministic) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Rating Breakdown" icon="fa-chart-bar">
            <div className="h-40">
              <Bar data={ratingData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: true }, y: { display: false } }, indexAxis: 'y' }} />
            </div>
          </Card>
          <Card title="Sentiment Ratio" icon="fa-chart-pie">
            <div className="h-40 flex justify-center">
              <Doughnut data={sentimentData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '70%' }} />
            </div>
          </Card>
          <Card title="Top Complaints Keywords" icon="fa-tags">
            <div className="flex flex-wrap gap-2 h-40 content-start overflow-y-auto custom-scrollbar">
              {preprocess.top_keywords.slice(0, 10).map((kw, i) => (
                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                  {kw.word} ({kw.count})
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 3: Trend (Hidden if sparse) */}
        {sortedTrends.length > 2 && (
          <Card title="Review Trend (Monthly)" icon="fa-chart-line">
            <div className="h-48">
              <Line data={trendData} options={{
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, max: 5 },
                  y1: { position: 'right', grid: { drawOnChartArea: false } }
                }
              }} />
            </div>
          </Card>
        )}

        {/* Section: AI Insights */}
        {showAI ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customers Like */}
              <Card title="What Customers Like" icon="fa-thumbs-up" className="bg-emerald-50/50 border-emerald-100">
                <ul className="space-y-2">
                  {ai_insights?.what_people_like?.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <i className="fas fa-check text-emerald-500 mt-1"></i>
                      {item}
                    </li>
                  )) || <p className="text-slate-400 text-sm italic">No specific praise detected.</p>}
                </ul>
              </Card>

              {/* Customers Dislike */}
              <Card title="What Customers Dislike" icon="fa-thumbs-down" className="bg-rose-50/50 border-rose-100">
                <ul className="space-y-2">
                  {ai_insights?.what_people_dislike?.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <i className="fas fa-xmark text-rose-500 mt-1"></i>
                      {item}
                    </li>
                  )) || <p className="text-slate-400 text-sm italic">No specific complaints detected.</p>}
                </ul>
              </Card>
            </div>

            {/* Major Problems */}
            <Card title="Major Problems & Business Impact" icon="fa-triangle-exclamation">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ai_insights?.complaint_clusters.map((cluster, i) => (
                  <div key={i} className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <h5 className="font-bold text-slate-900 text-sm mb-1">{cluster.theme}</h5>
                    <div className="text-xs text-orange-600 font-bold mb-2 uppercase">{cluster.frequency_indicator}</div>
                    <p className="text-xs text-slate-600 mb-2">
                      <strong>Impact:</strong> {cluster.impact_explanation}
                    </p>
                    <div className="mt-auto pt-2 border-t border-orange-100">
                      <p className="text-xs text-slate-800 font-medium">
                        <i className="fas fa-wrench mr-1 text-orange-400"></i>
                        {cluster.recommended_action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Improvements & Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Improvement Suggestions" icon="fa-arrow-trend-up">
                <div className="space-y-3">
                  {ai_insights?.improvement_priorities.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                      <p className="text-sm text-slate-700 pt-0.5">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Opportunity Areas" icon="fa-lightbulb" className="bg-indigo-50/30 border-indigo-100">
                <div className="space-y-3">
                  {ai_insights?.opportunity_areas?.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0"><i className="fas fa-star"></i></div>
                      <p className="text-sm text-slate-700 pt-0.5">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        ) : (
          // AI Locked / Failed State
          <div className="mt-8 p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <i className="fas fa-robot text-2xl"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-700">AI Insights Not Available</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2">
              {audit.source === 'deterministic'
                ? "We couldn't generate AI insights for this business (possibly too few reviews). Enjoy the deterministic stats above!"
                : "Upgrade to PRO to unlock deep AI analysis including customer sentiment clustering and action plans."}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStepIndicator = () => {
    const steps: ReviewPipelineStep[] = ['parsing', 'fetching', 'preprocessing', 'ai_analysis'];
    const currentIdx = steps.indexOf(currentStep);

    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 py-12">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="space-y-4 w-full max-w-sm">
          {steps.map((step, i) => {
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            return (
              <div key={step} className={`flex items-center gap-3 transition-all duration-300 ${isActive ? 'opacity-100' : isDone ? 'opacity-60' : 'opacity-30'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {isDone ? <i className="fas fa-check"></i> : i + 1}
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                  {STEP_LABELS[step]}
                </span>
                {isActive && <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse ml-auto"></div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-[600px] relative bg-[#f7f8fa]">
      {/* Header - Transparent/Minimal */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-medium text-slate-900 tracking-tight">Review Intelligence</h3>
          <p className="text-slate-500 text-sm">Google Places Analysis</p>
        </div>
        {audit && (
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={saveReport}
              disabled={isSaving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
            >
              <i className={`fas ${isSaving ? 'fa-circle-notch fa-spin' : 'fa-save'}`}></i>
              <span>{isSaving ? 'Saving...' : 'Save Report'}</span>
            </button>
            <button
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([JSON.stringify(audit, null, 2)], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = `${audit.business_summary.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audit.txt`;
                document.body.appendChild(element); // Required for this to work in FireFox
                element.click();
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
            >
              <i className="fas fa-download"></i>
              <span>Export Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Area - Open Canvas */}
      <div className="flex-1 px-8 pb-32">
        {!audit && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
              <i className="fas fa-search text-2xl text-slate-300"></i>
            </div>
            <p className="text-lg font-medium text-slate-600">Enter a Google Maps URL to begin</p>
            <p className="text-sm text-slate-400 mt-2">Press Enter to analyze</p>
          </div>
        )}

        {isLoading && renderStepIndicator()}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h4 className="text-lg font-bold text-rose-900 mb-2">Analysis Failed</h4>
            <p className="text-rose-600 font-medium">{error}</p>
            <button
              onClick={() => { setError(null); setCurrentStep('idle'); }}
              className="mt-4 px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-sm font-bold hover:bg-rose-200 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {audit && renderDashboard()}
      </div>

      {/* Floating Input - Bottom Center - Fixed to Viewport */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-full blur-xl transition-opacity opacity-0 group-hover:opacity-100"></div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Search Google Maps Place..."
            className="relative z-10 w-full pl-6 pr-14 py-3.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus:shadow-[0_8px_30px_rgb(0,0,0,0.16)] focus:border-nexus-300 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="absolute right-2 top-2 w-9 h-9 bg-nexus-900 text-white rounded-full flex items-center justify-center hover:bg-nexus-800 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-300 transition-all z-20 shadow-md"
          >
            {isLoading ? <i className="fas fa-circle-notch fa-spin text-xs"></i> : <i className="fas fa-arrow-up text-xs"></i>}
          </button>
        </form>
      </div>
    </div>
  );
};
