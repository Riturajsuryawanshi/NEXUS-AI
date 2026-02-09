
import React, { useState, useEffect } from 'react';
import { JobRecord, UserProfile, BusinessContext, Opportunity, BusinessDecision, Client } from '../types';
import { MonetizationService } from '../services/monetizationService';
import { ExportManager } from '../data_engine/export';
import { ClientService } from '../services/clientService';
import { ReportService } from '../services/reportService'; // New
// import { UserService } from '../services/userService'; // Removed

interface MonetizationLabProps {
  jobs: JobRecord[];
  profile: UserProfile;
  client: Client; // New
  view: 'make-money' | 'opportunities' | 'proof-reports';
}

export const MonetizationLab: React.FC<MonetizationLabProps> = ({ jobs, profile, client, view }) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [showSetup, setShowSetup] = useState(!client.businessContext);
  const [context, setContext] = useState<BusinessContext>(client.businessContext || {
    businessType: 'E-commerce',
    primaryGoal: 'Revenue Growth',
    primaryKPI: 'Sales',
    currency: '$',
    timeGranularity: 'monthly'
  });

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  useEffect(() => {
    if (selectedJob && selectedJob.summary && client.businessContext) {
      const opps = MonetizationService.analyzeOpportunities(selectedJob, client.businessContext);
      selectedJob.opportunities = opps;
      selectedJob.decisions = MonetizationService.generateDecisions(selectedJob, client.businessContext);
    }
  }, [selectedJobId, client.businessContext]);

  const handleSaveContext = async (e: React.FormEvent) => {
    e.preventDefault();
    await ClientService.updateBusinessContext(client.id, context);
    setShowSetup(false);
  };

  const handlePrintReport = () => {
    if (!selectedJob) return;
    ReportService.logReport(client, selectedJob, 'PDF');

    // Create a print window
    const win = window.open('', 'PRINT', 'height=800,width=1000');
    if (win) {
      win.document.write('<html><head><title>Nexus Proof Report</title>');
      win.document.write('<style>');
      win.document.write(`
        body { font-family: 'Helvetica Neue', sans-serif; padding: 40px; color: #1e293b; }
        h1 { font-size: 24px; font-weight: 900; letter-spacing: -1px; margin-bottom: 10px; }
        .meta { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
        .section { margin-bottom: 40px; }
        h2 { font-size: 14px; font-weight: 900; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
        .decision { margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #f1f5f9; padding: 20px; border-radius: 8px; }
        .decision h3 { margin: 0 0 10px 0; font-size: 16px; font-weight: 800; }
        .decision p { margin: 0; font-size: 13px; line-height: 1.5; color: #475569; }
        .stat { display: inline-block; margin-right: 20px; font-weight: 700; color: #0f172a; }
        .footer { margin-top: 60px; font-size: 10px; text-align: center; color: #cbd5e1; }
      `);
      win.document.write('</style></head><body>');
      win.document.write(`<h1>NEXUS REVENUE PROOF</h1>`);
      win.document.write(`<div class="meta">Client: ${client.name} &bull; Generated: ${new Date().toLocaleDateString()}</div>`);

      win.document.write('<div class="section"><h2>Executive Decisions</h2>');
      selectedJob.decisions?.forEach(d => {
        win.document.write(`
          <div class="decision">
            <h3>${d.title}</h3>
            <p>${d.action}</p>
            <div style="margin-top:10px;">
              <span class="stat">Gain: ${client.currency}${d.expectedGain.toLocaleString()}</span>
              <span class="stat">Confidence: ${(d.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        `);
      });
      win.document.write('</div>');

      win.document.write('<div class="section"><h2>Audit Trail</h2>');
      win.document.write(`<p>Source Data: ${selectedJob.fileName}</p>`);
      win.document.write(`<p>Methodology: Deterministic Variance Decomposition</p>`);
      win.document.write('</div>');

      win.document.write('<div class="footer">NEXUS-AI VERIFIED INTELLIGENCE</div>');
      win.document.write('</body></html>');
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 500);
    }
  };

  const handleExcelExport = async () => {
    if (!selectedJob || !client.businessContext) return;
    ReportService.logReport(client, selectedJob, 'Excel');
    const csv = await ExportManager.toProofReport(selectedJob, client, client.businessContext);
    const fileName = `nexus_proof_${client.name}_${selectedJob.fileName.replace('.csv', '')}.csv`;
    ExportManager.downloadFile(csv, fileName, 'text/csv');
  };

  if (!jobs.length) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-12">
        <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-300">
          <i className="fas fa-folder-open text-4xl"></i>
        </div>
        <h2 className="text-3xl font-display font-black text-slate-900 mb-4 tracking-tight">Data Required</h2>
        <p className="text-slate-500 max-w-sm mb-8 leading-relaxed font-medium">
          The Monetization Lab needs a processed dataset to calculate ROI and identify revenue levers.
        </p>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="max-w-4xl mx-auto p-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/20">
            <i className="fas fa-briefcase text-white text-3xl"></i>
          </div>
          <h2 className="text-4xl font-display font-black text-slate-900 mb-4 tracking-tight">Business Alignment</h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl mx-auto">
            To generate money-making decisions, Nexus needs to understand your fiscal goals and current metrics.
          </p>
        </div>

        <form onSubmit={handleSaveContext} className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-2xl space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Industry</label>
              <select
                value={context.businessType}
                onChange={e => setContext({ ...context, businessType: e.target.value })}
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800"
              >
                <option>SaaS</option>
                <option>E-commerce</option>
                <option>Agency</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Primary Goal</label>
              <select
                value={context.primaryGoal}
                onChange={e => setContext({ ...context, primaryGoal: e.target.value })}
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800"
              >
                <option>Revenue Growth</option>
                <option>Cost Reduction</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Target KPI</label>
              <select
                value={context.primaryKPI}
                onChange={e => setContext({ ...context, primaryKPI: e.target.value })}
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800"
              >
                {selectedJob?.summary && Object.keys(selectedJob.summary.columns).map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Currency</label>
              <input
                type="text"
                value={context.currency}
                onChange={e => setContext({ ...context, currency: e.target.value })}
                placeholder="$"
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-bold text-xl hover:bg-indigo-600 transition-all">Launch monetization</button>
        </form>
      </div>
    );
  }

  // Explicitly type sub-component as React.FC to inherit standard props like 'key' correctly in TypeScript
  const DecisionCard: React.FC<{ decision: BusinessDecision }> = ({ decision }) => (
    <div className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 hover:border-indigo-500 transition-all flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${decision.type === 'top_3' ? 'bg-indigo-50 text-indigo-600' : decision.type === 'quick_win' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
          {decision.type === 'top_3' ? 'Top Opportunity' : decision.type === 'quick_win' ? 'Quick Win' : 'High Impact Bet'}
        </div>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
          Confidence: {(decision.confidence * 100).toFixed(0)}%
        </div>
      </div>

      <h4 className="text-xl font-display font-black text-slate-900 mb-2 leading-tight">{decision.title}</h4>
      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-6">Affecting: {decision.affectedSegment}</p>

      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6 flex-1">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">The Action</p>
        <p className="text-sm font-medium text-slate-700 leading-relaxed">{decision.action}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Impact</p>
          <p className="text-lg font-display font-black text-indigo-700">{context.currency}{decision.expectedGain.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Timeframe</p>
          <p className="text-lg font-display font-black text-slate-900">{decision.timeToImpact}</p>
        </div>
      </div>

      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
        View Full Calculation <i className="fas fa-chevron-right text-[8px]"></i>
      </button>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-12 space-y-16 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-5xl font-display font-black text-slate-900 tracking-tight uppercase italic">
              Lab <span className="text-indigo-600">01</span>
            </h2>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-[10px] font-black uppercase text-white tracking-widest">
              {view === 'make-money' ? 'ROI Action Center' : view === 'opportunities' ? 'Opportunity Scan' : 'Report Studio'}
            </div>
          </div>
          <p className="text-slate-500 text-xl font-medium leading-relaxed">
            {view === 'make-money' && "Statistical decisions to scale revenue and plug financial leaks."}
            {view === 'opportunities' && "Surface hidden anomalies and performance deltas across segments."}
            {view === 'proof-reports' && "Export mathematically-grounded reports for clients or stakeholders."}
          </p>
        </div>

        <div className="flex shrink-0 gap-4">
          <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm flex items-center gap-3">
            <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none">
              {jobs.map(j => <option key={j.id} value={j.id}>{j.fileName}</option>)}
            </select>
          </div>
          <button onClick={() => setShowSetup(true)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm"><i className="fas fa-sliders"></i></button>
        </div>
      </div>

      {view === 'make-money' && (
        <div className="space-y-20">
          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-10 text-center">Top 3 Strategic Decisions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
              {selectedJob?.decisions?.filter(d => d.type === 'top_3').map(d => <DecisionCard key={d.id} decision={d} />)}
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Quick Revenue Wins</h3>
              <div className="space-y-6">
                {selectedJob?.decisions?.filter(d => d.type === 'quick_win').map(d => (
                  <div key={d.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg"><i className="fas fa-bolt-lightning"></i></div>
                      <div>
                        <h5 className="font-bold text-slate-900">{d.title}</h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gain: {context.currency}{d.expectedGain.toLocaleString()}</p>
                      </div>
                    </div>
                    <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">Execute</button>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8">High Impact Bets</h3>
              <div className="space-y-6">
                {selectedJob?.decisions?.filter(d => d.type === 'high_impact').map(d => (
                  <div key={d.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-amber-300 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg"><i className="fas fa-trophy-star"></i></div>
                      <div>
                        <h5 className="font-bold text-slate-900">{d.title}</h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Est. ROI: {context.currency}{d.expectedGain.toLocaleString()}</p>
                      </div>
                    </div>
                    <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all">Strategize</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {view === 'opportunities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {selectedJob?.opportunities?.map(opp => (
            <div key={opp.id} className="p-10 bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/40">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl mb-8 shadow-inner ${opp.type === 'revenue_gain' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <i className={`fas ${opp.type === 'revenue_gain' ? 'fa-chart-line-up' : 'fa-droplet-slash'}`}></i>
              </div>
              <h4 className="text-2xl font-display font-black text-slate-900 mb-2">{opp.title}</h4>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">{opp.description}</p>
              <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Impact Score</p>
                  <p className="text-xl font-display font-black text-slate-900">{opp.roiScore.toFixed(1)}x</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Effort</p>
                  <p className="text-xl font-display font-black text-indigo-600 uppercase tracking-widest text-[14px]">{opp.effort || 'low'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'proof-reports' && (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-[3rem] p-16 shadow-2xl">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h3 className="text-3xl font-display font-black text-slate-900 mb-2 uppercase italic tracking-tight">Proof <span className="text-indigo-600">Report</span></h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nexus Verified Intelligence • {selectedJob?.fileName}</p>
            </div>
            <i className="fas fa-shield-check text-4xl text-emerald-500"></i>
          </div>
          <div className="p-10 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-mono text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap mb-12 max-h-[500px] overflow-y-auto">
            {MonetizationService.getMockReport(selectedJob!, client.businessContext!)}
          </div>
          <div className="flex gap-6">
            <button onClick={handlePrintReport} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-95 shadow-2xl shadow-slate-900/10"><i className="fas fa-file-pdf"></i> Export PDF Proof</button>
            <button onClick={handleExcelExport} className="flex-1 py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 shadow-md"><i className="fas fa-file-excel"></i> Export Excel Audit</button>
          </div>
        </div>
      )}
    </div>
  );
};
