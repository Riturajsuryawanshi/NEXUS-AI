import React, { useState, useEffect, useRef } from 'react';
import { ReviewService, ReviewPipelineStep } from '../services/reviewService';
import { ReviewAudit, UserProfile, PlanType } from '../types';
import { supabase } from '../services/supabaseClient';
import { UserService } from '../services/userService';
import { SubscriptionService } from '../services/subscriptionService';
import { PricingModal } from './PricingModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  LineController,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, LineController,
  RadialLinearScale, Filler
);

const STEP_LABELS: Record<ReviewPipelineStep, string> = {
  idle: '',
  parsing: 'Validating URL...',
  fetching: 'Fetching reviews from Google...',
  preprocessing: 'Crunching numbers (Deterministic)...',
  ai_analysis: 'AI Deep Analysis (11 Sections)...',
  complete: 'Report Ready!',
  error: 'Analysis failed',
};

export const ReviewIntelligence: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ReviewPipelineStep>('idle');
  const [audit, setAudit] = useState<ReviewAudit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [reportLimit, setReportLimit] = useState<number | 'unlimited'>(3);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  // Subscribe to user profile changes and fetch usage
  useEffect(() => {
    const unsubscribe = UserService.subscribe(async (profile) => {
      setUserProfile(profile);
      if (profile) {
        const planType = profile.planType || 'free';
        const limit = SubscriptionService.getReportLimit(planType);
        setReportLimit(limit);
        const usage = await SubscriptionService.getMonthlyUsage(profile.userId);
        setMonthlyUsage(usage);
      }
    });
    return () => unsubscribe();
  }, []);

  const refreshUsage = async () => {
    if (userProfile) {
      const usage = await SubscriptionService.getMonthlyUsage(userProfile.userId);
      setMonthlyUsage(usage);
    }
  };

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

  const isAtLimit = reportLimit !== 'unlimited' && monthlyUsage >= reportLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // --- CREDIT GATE ---
    if (userProfile) {
      const { allowed, used, limit, hasCredits } = await SubscriptionService.canGenerateReport(
        userProfile.userId,
        userProfile.planType || 'free'
      );

      if (!allowed) {
        setShowPricing(true);
        return;
      }

      // If we are over the monthly limit, we MUST have credits to proceed.
      // canGenerateReport already checked this, so we just need to consume if over limit.
      const isOverMonthlyLimit = limit !== 'unlimited' && used >= limit;
      if (isOverMonthlyLimit && hasCredits) {
        const consumed = await SubscriptionService.consumeCredit(userProfile.userId);
        if (!consumed) {
          setError('Failed to use credits. Please try again.');
          return;
        }
        showToast('🪙 1 Credit used (Monthly limit reached)');
      }
    }

    setIsLoading(true);
    setError(null);
    setAudit(null);
    setCurrentStep('parsing');

    try {
      const result = await ReviewService.getAudit(url, (step) => {
        setCurrentStep(step);
      });
      setAudit(result);

      // Auto-save report to database (counts toward monthly limit)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('business_audits').insert({
            user_id: user.id,
            place_id: result.business_summary.place_id,
            business_name: result.business_summary.name,
            audit_data: result
          });
          showToast('✅ Report saved to My Reports');
        }
      } catch (saveErr) {
        console.warn('[ReviewIntelligence] Auto-save failed:', saveErr);
        showToast('Report generated but auto-save failed', 'error');
      }

      // Refresh usage count after successful generation
      await refreshUsage();
    } catch (err: any) {
      console.error('[ReviewIntelligence]', err);
      const message = err.message || 'Failed to generate audit. Please check the URL and try again.';
      setError(message);
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleLoadAudit = () => {
      const stored = localStorage.getItem('nexus_active_audit');
      if (stored) {
        try {
          const auditData = JSON.parse(stored);
          setAudit(auditData);
          setCurrentStep('complete');
          console.log("Loaded audit from history:", auditData);
        } catch (e) {
          console.error("Failed to load audit from history", e);
        }
        localStorage.removeItem('nexus_active_audit');
      }
    };

    window.addEventListener('nexus:load-audit', handleLoadAudit);
    handleLoadAudit();

    return () => window.removeEventListener('nexus:load-audit', handleLoadAudit);
  }, []);

  const navigateToReports = () => {
    window.dispatchEvent(new CustomEvent('nexus:navigate', { detail: 'reports' }));
  };

  const exportToPDF = async () => {
    if (!audit || !printRef.current) return;
    setIsExporting(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 900,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add extra pages if dashboard is tall
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `${audit.business_summary.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_review_audit.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const Card: React.FC<{ title: string; icon?: string; children: React.ReactNode; className?: string; badge?: string; badgeColor?: string }> = ({ title, icon, children, className = '', badge, badgeColor }) => (
    <div className={`bg-white dark:bg-slate-800/80 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
          {icon && <i className={`fas ${icon}`}></i>}
          {title}
        </h4>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeColor || 'bg-slate-100 text-slate-500'}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );

  const SectionHeader: React.FC<{ number: number; title: string; icon: string; description?: string }> = ({ number, title, icon, description }) => (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-sm">{number}</div>
      <div>
        <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <i className={`fas ${icon} text-indigo-500`}></i>
          {title}
        </h3>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
    </div>
  );

  const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-green-100 text-green-700 border-green-200',
    };
    const icons: Record<string, string> = { critical: '🔴', medium: '🟡', low: '🟢' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${colors[priority] || colors.medium}`}>
        {icons[priority] || '⚪'} {priority}
      </span>
    );
  };

  const ScoreGauge: React.FC<{ label: string; score: number; icon: string }> = ({ label, score, icon }) => {
    const color = score >= 8 ? 'text-emerald-500' : score >= 6 ? 'text-amber-500' : 'text-red-500';
    const bg = score >= 8 ? 'bg-emerald-50' : score >= 6 ? 'bg-amber-50' : 'bg-red-50';
    return (
      <div className={`flex flex-col items-center p-3 rounded-xl ${bg} border border-slate-100`}>
        <i className={`fas ${icon} ${color} text-lg mb-1`}></i>
        <div className={`text-2xl font-black ${color}`}>{score}<span className="text-xs text-slate-400">/10</span></div>
        <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">{label}</span>
      </div>
    );
  };

  const RiskMeter: React.FC<{ level: string }> = ({ level }) => {
    const levels = ['low', 'medium', 'high', 'critical'];
    const idx = levels.indexOf(level);
    const colors = ['bg-emerald-500', 'bg-amber-400', 'bg-orange-500', 'bg-red-600'];
    const labels = ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'];
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100">
          {levels.map((_, i) => (
            <div key={i} className={`flex-1 rounded-full transition-all ${i <= idx ? colors[idx] : 'bg-slate-200'}`} />
          ))}
        </div>
        <span className={`text-xs font-bold ${idx >= 2 ? 'text-red-600' : idx === 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {labels[idx] || 'Unknown'}
        </span>
      </div>
    );
  };

  // ====================================================
  // MAIN DASHBOARD RENDERER
  // ====================================================

  const renderDashboard = () => {
    if (!audit) return null;
    const { preprocess, ai_insights } = audit;
    const ai = ai_insights;

    // Charts Config
    const ratingData = {
      labels: ['5★', '4★', '3★', '2★', '1★'],
      datasets: [{
        data: [5, 4, 3, 2, 1].map(s => preprocess.rating_distribution[s] || 0),
        backgroundColor: ['#10b981', '#34d399', '#fcd34d', '#fb923c', '#e11d48'],
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
        backgroundColor: ['#10b981', '#f43f5e', '#94a3b8'],
        borderWidth: 0,
      }]
    };

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
          type: 'bar' as 'line',
          backgroundColor: '#e2e8f0',
          yAxisID: 'y1'
        }
      ]
    };

    // Health Score Radar
    const healthRadarData = ai?.health_scores ? {
      labels: ['Service', 'Product', 'Management', 'Reputation', 'Operations'],
      datasets: [{
        label: 'Health Score',
        data: [ai.health_scores.service, ai.health_scores.product, ai.health_scores.management, ai.health_scores.reputation, ai.health_scores.operational_stability],
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#6366f1',
      }]
    } : null;

    return (
      <div className="space-y-2">

        {/* ============ SECTION 1: BUSINESS OVERVIEW ============ */}
        <SectionHeader number={1} title="Business Overview" icon="fa-building" description="Context & baseline metrics" />
        <div className="bg-white dark:bg-slate-800/80 p-5 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900 dark:text-white leading-tight">{audit.business_summary.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-slate-500 dark:text-slate-400 font-medium text-xs md:text-sm">
                {ai?.business_overview?.category && (
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">{ai.business_overview.category}</span>
                )}
                {ai?.business_overview?.sub_category && (
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs font-bold">{ai.business_overview.sub_category}</span>
                )}
                <span className="w-1 h-1 bg-slate-300 rounded-full hidden md:block"></span>
                <span><i className="fas fa-location-dot mr-1"></i>{preprocess.business_location}</span>
                {ai?.business_overview?.years_in_operation && (
                  <>
                    <span className="w-1 h-1 bg-slate-300 rounded-full hidden md:block"></span>
                    <span><i className="fas fa-calendar mr-1"></i>{ai.business_overview.years_in_operation}</span>
                  </>
                )}
              </div>
              {ai?.business_overview?.review_volume_assessment && (
                <p className="text-xs text-slate-400 mt-2 italic">{ai.business_overview.review_volume_assessment}</p>
              )}
            </div>
            <div className="text-right flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 p-4 rounded-2xl">
              <div>
                <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{audit.business_summary.rating}<span className="text-lg text-slate-400">/5</span></div>
                <div className="text-yellow-400 text-sm mt-1">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className={`fas fa-star ${i < Math.round(audit.business_summary.rating) ? '' : 'text-slate-200'}`}></i>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-slate-900 dark:text-white">{audit.business_summary.total_reviews.toLocaleString()}</div>
                <div className="text-xs text-slate-400 font-medium">Total Reviews</div>
              </div>
            </div>
          </div>

          {/* Rating Distribution Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card title="Rating Distribution" icon="fa-chart-bar">
              <div className="h-40">
                <Bar data={ratingData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: true }, y: { display: false } }, indexAxis: 'y' }} />
              </div>
            </Card>
            <Card title="Sentiment Ratio" icon="fa-chart-pie">
              <div className="h-40 flex justify-center">
                <Doughnut data={sentimentData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '70%' }} />
              </div>
            </Card>
            <Card title="Key Metrics" icon="fa-gauge">
              <div className="grid grid-cols-2 gap-3 h-40 content-start">
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <div className="text-2xl font-black text-emerald-600">{preprocess.positive_review_percentage}%</div>
                  <div className="text-[10px] text-emerald-700 font-bold uppercase">Positive</div>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-center">
                  <div className="text-2xl font-black text-red-600">{preprocess.negative_review_percentage}%</div>
                  <div className="text-[10px] text-red-700 font-bold uppercase">Negative</div>
                </div>
                {ai?.sentiment_analysis && (
                  <>
                    <div className="p-3 bg-orange-50 rounded-xl text-center">
                      <div className="text-2xl font-black text-orange-600">{ai.sentiment_analysis.repeat_complaints_percentage}%</div>
                      <div className="text-[10px] text-orange-700 font-bold uppercase">Repeat Issues</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-center">
                      <div className="text-2xl font-black text-blue-600">{ai.sentiment_analysis.repeat_praises_percentage}%</div>
                      <div className="text-[10px] text-blue-700 font-bold uppercase">Repeat Praise</div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* ============ SECTION 2: SENTIMENT BREAKDOWN ============ */}
        {ai?.sentiment_analysis && (
          <>
            <SectionHeader number={2} title="Sentiment Breakdown" icon="fa-face-smile" description="Data-level analysis of customer feelings" />
            <Card title="Sentiment Analysis" icon="fa-chart-pie">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{ai.sentiment_analysis.sentiment_summary}</p>
              <div className="grid grid-cols-5 gap-3 text-center">
                <div className="p-2 bg-emerald-50 rounded-xl"><div className="text-lg font-black text-emerald-600">{ai.sentiment_analysis.positive_percentage}%</div><div className="text-[9px] font-bold text-emerald-700 uppercase">Positive</div></div>
                <div className="p-2 bg-red-50 rounded-xl"><div className="text-lg font-black text-red-600">{ai.sentiment_analysis.negative_percentage}%</div><div className="text-[9px] font-bold text-red-700 uppercase">Negative</div></div>
                <div className="p-2 bg-slate-50 rounded-xl"><div className="text-lg font-black text-slate-600">{ai.sentiment_analysis.neutral_percentage}%</div><div className="text-[9px] font-bold text-slate-500 uppercase">Neutral</div></div>
                <div className="p-2 bg-orange-50 rounded-xl"><div className="text-lg font-black text-orange-600">{ai.sentiment_analysis.repeat_complaints_percentage}%</div><div className="text-[9px] font-bold text-orange-700 uppercase">Repeat Complaints</div></div>
                <div className="p-2 bg-blue-50 rounded-xl"><div className="text-lg font-black text-blue-600">{ai.sentiment_analysis.repeat_praises_percentage}%</div><div className="text-[9px] font-bold text-blue-700 uppercase">Repeat Praises</div></div>
              </div>
            </Card>
          </>
        )}

        {/* ============ SECTION 3: STRENGTHS ============ */}
        {ai?.strengths && ai.strengths.length > 0 && (
          <>
            <SectionHeader number={3} title="What Customers Love" icon="fa-heart" description="Recurring praise themes — your positioning advantages" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ai.strengths.map((s, i) => (
                <Card key={i} title={s.theme} icon="fa-thumbs-up" className="bg-emerald-50/30 border-emerald-100" badge={s.frequency} badgeColor="bg-emerald-100 text-emerald-700">
                  <p className="text-sm text-slate-600 mb-3">{s.description}</p>
                  {s.sample_quotes?.length > 0 && (
                    <div className="space-y-1">
                      {s.sample_quotes.slice(0, 2).map((q, qi) => (
                        <p key={qi} className="text-xs text-slate-500 italic border-l-2 border-emerald-300 pl-2">"{q}"</p>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}

        {/* ============ SECTION 4: WEAKNESSES ============ */}
        {ai?.weaknesses && ai.weaknesses.length > 0 && (
          <>
            <SectionHeader number={4} title="What Customers Hate" icon="fa-thumbs-down" description="Categorized issues with frequency and trend analysis" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ai.weaknesses.map((w, i) => (
                <Card key={i} title={w.theme} icon="fa-triangle-exclamation" className="bg-red-50/30 border-red-100" badge={w.category} badgeColor="bg-red-100 text-red-700">
                  <p className="text-sm text-slate-600 mb-2">{w.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full font-medium">{w.frequency}</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full font-medium">{w.recency}</span>
                    {w.is_increasing && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">
                        <i className="fas fa-arrow-trend-up mr-1"></i>Increasing
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* ============ SECTION 5: OPERATIONAL GAPS ============ */}
        {ai?.operational_gaps && ai.operational_gaps.length > 0 && (
          <>
            <SectionHeader number={5} title="Operational Gaps Identified" icon="fa-gears" description="Translating complaints into business problems" />
            <Card title="Complaint → Business Problem Mapping" icon="fa-arrows-left-right">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-400 uppercase">Customer Complaint</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-400 uppercase">Business Problem</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-400 uppercase">Root Cause</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ai.operational_gaps.map((gap, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-slate-600"><i className="fas fa-quote-left text-red-300 mr-1 text-[10px]"></i>{gap.complaint}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{gap.business_problem}</td>
                        <td className="py-3 px-3 text-slate-500 italic">{gap.root_cause}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* ============ SECTION 6: REPUTATION RISK ============ */}
        {ai?.reputation_risk && (
          <>
            <SectionHeader number={6} title="Reputation Risk Level" icon="fa-shield-halved" description="How vulnerable is this business to reputation damage?" />
            <Card title="Risk Assessment" icon="fa-gauge-high">
              <RiskMeter level={ai.reputation_risk.risk_level} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Review Type</div>
                  <div className="text-sm font-bold text-slate-700">{ai.reputation_risk.negative_review_type}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Mgmt Responds</div>
                  <div className={`text-sm font-bold ${ai.reputation_risk.management_responds ? 'text-emerald-600' : 'text-red-600'}`}>
                    {ai.reputation_risk.management_responds ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Response Quality</div>
                  <div className="text-sm font-bold text-slate-700 capitalize">{ai.reputation_risk.response_quality}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Accountability</div>
                  <div className="text-sm font-bold text-indigo-600">{ai.reputation_risk.accountability_score}/10</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-4">{ai.reputation_risk.summary}</p>
            </Card>
          </>
        )}

        {/* ============ SECTION 7: COMPETITIVE POSITIONING ============ */}
        {ai?.competitive_positioning && (
          <>
            <SectionHeader number={7} title="Competitive Positioning" icon="fa-ranking-star" description="How does this business stack up?" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="vs Competitors" icon="fa-scale-balanced">
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Rating</div><p className="text-sm text-slate-700">{ai.competitive_positioning.rating_vs_competitors}</p></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Review Volume</div><p className="text-sm text-slate-700">{ai.competitive_positioning.review_volume_vs_competitors}</p></div>
                </div>
              </Card>
              <Card title="Industry Context" icon="fa-industry">
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs font-bold text-slate-400 uppercase mb-1">Complaints vs Industry Norm</div><p className="text-sm text-slate-700">{ai.competitive_positioning.common_complaints_vs_industry}</p></div>
                  <div className="p-3 bg-indigo-50 rounded-xl"><div className="text-xs font-bold text-indigo-400 uppercase mb-1">Market Position</div><p className="text-sm font-medium text-indigo-700">{ai.competitive_positioning.market_position_summary}</p></div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* ============ SECTION 8: FINANCIAL IMPACT ============ */}
        {ai?.financial_impact && ai.financial_impact.risk_areas?.length > 0 && (
          <>
            <SectionHeader number={8} title="Financial Impact Analysis" icon="fa-coins" description="Translating sentiment into revenue impact" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ai.financial_impact.risk_areas.map((r, i) => (
                <Card key={i} title={r.issue} icon="fa-chart-line" className="bg-orange-50/20 border-orange-100">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">{r.customer_segment_affected}</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">{r.estimated_revenue_impact}</span>
                    </div>
                    <p className="text-sm text-slate-600">{r.explanation}</p>
                  </div>
                </Card>
              ))}
            </div>
            <Card title="Overall Revenue Risk" icon="fa-money-bill-trend-up" className="bg-gradient-to-r from-red-50 to-orange-50 border-red-100">
              <p className="text-sm text-slate-700 font-medium">{ai.financial_impact.overall_revenue_risk}</p>
            </Card>
          </>
        )}

        {/* ============ SECTION 9: PRIORITY FIX LIST ============ */}
        {ai?.priority_fixes && ai.priority_fixes.length > 0 && (
          <>
            <SectionHeader number={9} title="Priority Fix List" icon="fa-list-check" description="Actionable execution roadmap" />
            <div className="space-y-3">
              {ai.priority_fixes.map((fix, i) => (
                <Card key={i} title={fix.issue} icon={fix.priority === 'critical' ? 'fa-fire' : fix.priority === 'medium' ? 'fa-bolt' : 'fa-feather'}>
                  <div className="mb-3"><PriorityBadge priority={fix.priority} /></div>
                  <ul className="space-y-1.5">
                    {fix.action_steps.map((step, si) => (
                      <li key={si} className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{si + 1}</div>
                        {step}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* ============ SECTION 10: SWOT ============ */}
        {ai?.swot && (
          <>
            <SectionHeader number={10} title="SWOT Summary" icon="fa-table-cells" description="Founder-level strategic view" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Strengths" icon="fa-shield" className="bg-emerald-50/30 border-emerald-100">
                <ul className="space-y-2">{ai.swot.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700"><i className="fas fa-check text-emerald-500 mt-1 shrink-0"></i>{s}</li>
                ))}</ul>
              </Card>
              <Card title="Weaknesses" icon="fa-xmark" className="bg-red-50/30 border-red-100">
                <ul className="space-y-2">{ai.swot.weaknesses.map((w, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700"><i className="fas fa-xmark text-red-500 mt-1 shrink-0"></i>{w}</li>
                ))}</ul>
              </Card>
              <Card title="Opportunities" icon="fa-lightbulb" className="bg-blue-50/30 border-blue-100">
                <ul className="space-y-2">{ai.swot.opportunities.map((o, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700"><i className="fas fa-lightbulb text-blue-500 mt-1 shrink-0"></i>{o}</li>
                ))}</ul>
              </Card>
              <Card title="Threats" icon="fa-skull-crossbones" className="bg-amber-50/30 border-amber-100">
                <ul className="space-y-2">{ai.swot.threats.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700"><i className="fas fa-triangle-exclamation text-amber-500 mt-1 shrink-0"></i>{t}</li>
                ))}</ul>
              </Card>
            </div>
          </>
        )}

        {/* ============ SECTION 11: HEALTH SCORES ============ */}
        {ai?.health_scores && (
          <>
            <SectionHeader number={11} title="Business Health Score" icon="fa-heartbeat" description="Final structured assessment" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Score Breakdown" icon="fa-star">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  <ScoreGauge label="Service" score={ai.health_scores.service} icon="fa-concierge-bell" />
                  <ScoreGauge label="Product" score={ai.health_scores.product} icon="fa-box" />
                  <ScoreGauge label="Mgmt" score={ai.health_scores.management} icon="fa-user-tie" />
                  <ScoreGauge label="Reputation" score={ai.health_scores.reputation} icon="fa-award" />
                  <ScoreGauge label="Operations" score={ai.health_scores.operational_stability} icon="fa-gears" />
                </div>
                <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl text-center">
                  <div className="text-4xl font-black text-indigo-600">{ai.health_scores.overall}<span className="text-lg text-indigo-300">/10</span></div>
                  <div className="text-xs font-bold text-indigo-400 uppercase mt-1">Overall Health Score</div>
                </div>
              </Card>
              {healthRadarData && (
                <Card title="Health Radar" icon="fa-compass">
                  <div className="h-64">
                    <Radar data={healthRadarData} options={{
                      maintainAspectRatio: false,
                      scales: { r: { min: 0, max: 10, ticks: { stepSize: 2 } } },
                      plugins: { legend: { display: false } }
                    }} />
                  </div>
                </Card>
              )}
            </div>
            {ai.health_scores.summary && (
              <Card title="Final Verdict" icon="fa-gavel" className="bg-gradient-to-r from-indigo-50 to-slate-50 border-indigo-100">
                <p className="text-sm text-slate-700 font-medium">{ai.health_scores.summary}</p>
              </Card>
            )}
          </>
        )}

        {/* ============ REVIEW TREND (Deterministic) ============ */}
        {sortedTrends.length > 2 && (
          <>
            <SectionHeader number={0} title="Review Trend" icon="fa-chart-line" description="Monthly rating and volume trend" />
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
          </>
        )}

        {/* ============ KEYWORDS ============ */}
        <Card title="Top Keywords from Reviews" icon="fa-tags">
          <div className="flex flex-wrap gap-2">
            {preprocess.top_keywords.slice(0, 15).map((kw, i) => (
              <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-default">
                {kw.word} <span className="text-slate-400">({kw.count})</span>
              </span>
            ))}
          </div>
        </Card>

        {/* ============ AI NOT AVAILABLE FALLBACK ============ */}
        {!ai && (
          <div className="mt-6 p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <i className="fas fa-robot text-2xl"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-700">AI Insights Not Available</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2">
              {audit.source === 'deterministic'
                ? "AI analysis couldn't be generated. The basic stats above are still accurate and useful!"
                : "Upgrade to PRO to unlock deep AI analysis with all 11 sections."}
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
      {/* Header */}
      <div className="px-6 md:px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <i className="fas fa-brain text-indigo-500"></i>
            Review Intelligence
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">11-Section Business Analysis • Powered by Google AI</p>
        </div>
        {/* Usage Badge */}
        <div className="flex items-center gap-3">
          {reportLimit !== 'unlimited' ? (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${isAtLimit
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'
                }`}
              onClick={() => isAtLimit && setShowPricing(true)}
            >
              <i className={`fas ${isAtLimit ? 'fa-lock' : 'fa-chart-bar'}`}></i>
              <span>{monthlyUsage}/{reportLimit} reports used</span>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min((monthlyUsage / (reportLimit as number)) * 100, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-100 text-emerald-700">
              <i className="fas fa-infinity"></i>
              <span>Unlimited reports</span>
            </div>
          )}
        </div>
        {audit && (
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={navigateToReports}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm text-sm"
            >
              <i className="fas fa-folder-open"></i>
              <span>My Reports</span>
            </button>
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm text-sm disabled:opacity-50"
            >
              <i className={`fas ${isExporting ? 'fa-circle-notch fa-spin' : 'fa-file-pdf'}`}></i>
              <span>{isExporting ? 'Generating PDF...' : 'Export PDF'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 md:px-8 pb-32">
        {!audit && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
              <i className="fas fa-search text-2xl text-slate-300"></i>
            </div>
            <p className="text-lg font-medium text-slate-600">Enter a Google Maps URL to begin</p>
            <p className="text-sm text-slate-400 mt-2">Get a full 11-section business intelligence report</p>
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

        {audit && <div ref={printRef}>{renderDashboard()}</div>}
      </div>

      {/* Floating Input */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
        {isAtLimit && (
          <div
            onClick={() => setShowPricing(true)}
            className="mb-2 mx-auto max-w-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2 px-4 rounded-full text-xs font-bold cursor-pointer hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg animate-pulse"
          >
            <i className="fas fa-rocket mr-1"></i>
            You've used all {reportLimit} free reports — Upgrade to continue
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-full blur-xl transition-opacity opacity-0 group-hover:opacity-100"></div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={isAtLimit ? 'Upgrade your plan to generate more reports...' : 'Paste Google Maps URL or business name...'}
            disabled={isAtLimit}
            className={`relative z-10 w-full pl-6 pr-14 py-3.5 rounded-full bg-white dark:bg-slate-800 border shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus:shadow-[0_8px_30px_rgb(0,0,0,0.16)] outline-none transition-all font-medium text-sm ${isAtLimit
              ? 'border-rose-200 text-slate-400 cursor-not-allowed bg-slate-50'
              : 'border-slate-200 dark:border-slate-700 focus:border-nexus-300 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
              }`}
          />
          <button
            type={isAtLimit ? 'button' : 'submit'}
            disabled={isLoading || (!isAtLimit && !url.trim())}
            onClick={isAtLimit ? () => setShowPricing(true) : undefined}
            className={`absolute right-2 top-2 w-9 h-9 rounded-full flex items-center justify-center transition-all z-20 shadow-md ${isAtLimit
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 cursor-pointer'
              : 'bg-nexus-900 text-white hover:bg-nexus-800 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-300'
              }`}
          >
            {isLoading ? (
              <i className="fas fa-circle-notch fa-spin text-xs"></i>
            ) : isAtLimit ? (
              <i className="fas fa-lock text-xs"></i>
            ) : (
              <i className="fas fa-arrow-up text-xs"></i>
            )}
          </button>
        </form>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-24 right-6 z-[200] animate-in slide-in-from-right-5 fade-in duration-300 max-w-sm`}>
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl ${toast.type === 'success'
            ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-rose-500'} text-lg`}></i>
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600 transition-colors">
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        currentUserProfile={userProfile || undefined}
      />
    </div>
  );
};
