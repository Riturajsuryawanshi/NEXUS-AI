
import React, { useState } from 'react';
import { JobRecord, JobStatus } from '../types';
import { DashboardView } from './DashboardView';
import { OperationsPanel } from './OperationsPanel';
import { ExportManager } from '../data_engine/export';
import { DataChat } from './DataChat';
import { JobService } from '../services/jobService';

interface JobCardProps {
  job: JobRecord;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'causal' | 'dashboard' | 'audit'>('insights');
  const [isExporting, setIsExporting] = useState(false);
  const [isBuildingDashboard, setIsBuildingDashboard] = useState(false);
  
  const isProcessing = [JobStatus.PENDING, JobStatus.PROCESSING, JobStatus.AI_REASONING].includes(job.status);
  
  if (isProcessing) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-[3rem] p-16 shadow-sm animate-pulse">
        <div className="flex items-center gap-8 mb-10">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center">
            <i className="fas fa-dna fa-fade text-indigo-400 text-3xl"></i>
          </div>
          <div className="flex-1">
            <div className="h-8 bg-slate-100 rounded-full w-1/3 mb-4"></div>
            <div className="h-5 bg-slate-50 rounded-full w-1/4"></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-5 bg-slate-50 rounded-full w-full"></div>
          <div className="h-5 bg-slate-50 rounded-full w-11/12"></div>
          <div className="h-5 bg-slate-50 rounded-full w-4/5"></div>
        </div>
      </div>
    );
  }

  const handleExportDashboard = async () => {
    if (!job.summary?.dashboard) return;
    setIsExporting(true);
    try {
      const csvContent = await ExportManager.toDashboardReport(job.summary.dashboard);
      const fileName = `nexus_dashboard_${job.fileName.replace(/\.[^/.]+$/, "")}.csv`;
      ExportManager.downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBuildDashboard = async () => {
    setIsBuildingDashboard(true);
    try {
      await JobService.applyAction(job.id, 'build_dashboard');
    } finally {
      setIsBuildingDashboard(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-[3rem] shadow-2xl shadow-slate-200/60 flex flex-col mb-32 overflow-hidden transition-all hover:border-slate-300">
      <OperationsPanel job={job} />

      {/* Modern Workspace Header */}
      <div className="px-12 py-10 border-b border-slate-100 bg-[#fafbfc]/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
            <i className="fas fa-file-invoice text-slate-400 text-lg"></i>
          </div>
          <div>
            <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">{job.fileName}</h3>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Trust Score: {job.summary?.qualityScore}%</span>
              <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-1000"
                  style={{ width: `${job.summary?.qualityScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center bg-slate-100/80 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner">
          {['insights', 'causal', 'dashboard', 'audit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {tab === 'causal' ? 'Reasoning' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Expansive Content Area */}
      <div className="px-12 py-16 flex-1">
        {activeTab === 'insights' && (
          <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {job.aiResult ? (
              <>
                <div className="relative p-10 bg-indigo-50/20 rounded-[3rem] border border-indigo-100/40">
                  <i className="fas fa-quote-left absolute top-8 left-8 text-indigo-100 text-5xl opacity-40"></i>
                  <p className="text-2xl text-slate-800 font-medium leading-relaxed italic relative z-10 text-center px-12">
                    {job.aiResult.summary}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {job.aiResult.key_insights.map((insight, i) => (
                    <div key={i} className="flex gap-6 p-8 bg-white border border-slate-100 rounded-[2.5rem] transition-all hover:bg-slate-50 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 group cursor-default">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-white shadow-sm flex items-center justify-center text-sm text-indigo-600 font-black shrink-0">
                        {i+1}
                      </div>
                      <p className="text-slate-600 text-base font-medium leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-24 text-center">
                 <i className="fas fa-atom-simple text-5xl text-slate-100 mb-6 animate-spin-slow"></i>
                 <p className="text-slate-400 font-bold text-lg">Synthesizing mathematical pathways...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {job.summary?.dashboard ? (
              <div className="space-y-12">
                <div className="flex justify-between items-center mb-8 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live Visualization console</h4>
                  </div>
                  <button 
                    onClick={handleExportDashboard}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-2xl shadow-slate-900/10 active:scale-95"
                  >
                    <i className="fas fa-file-excel"></i>
                    Export Master Report
                  </button>
                </div>
                <DashboardView config={job.summary.dashboard} />
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center bg-[#fafbfc] rounded-[4rem] border-2 border-dashed border-slate-200">
                 <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl mb-10 text-indigo-500 ring-1 ring-slate-100">
                   <i className="fas fa-diagram-nested text-4xl"></i>
                 </div>
                 <h4 className="text-3xl font-display font-black text-slate-900 mb-4 tracking-tight">Construct Data Visuals</h4>
                 <p className="text-slate-500 text-center max-w-md mb-12 leading-relaxed text-lg font-medium">
                   Nexus will run a deep variance analysis to identify the most significant KPI trends and categorical distributions for your business.
                 </p>
                 <button 
                  onClick={handleBuildDashboard}
                  disabled={isBuildingDashboard}
                  className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-bold flex items-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-600/20 active:scale-95 disabled:opacity-40"
                 >
                   {isBuildingDashboard ? <i className="fas fa-circle-notch fa-spin text-xl"></i> : <i className="fas fa-sparkles text-xl"></i>}
                   <span className="text-lg tracking-tight">{isBuildingDashboard ? 'Reasoning...' : 'Build AI Dashboard'}</span>
                 </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'causal' && (
          <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Causal Inference Engine</h4>
              <p className="text-slate-600 text-lg font-medium max-w-xl mx-auto">Drivers identified via mathematical variance decomposition and population-split analysis.</p>
            </div>
            {job.summary?.rootCause ? (
               <div className="grid grid-cols-1 gap-6">
                 {job.summary.rootCause.top_contributors.map((c, i) => (
                    <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:border-indigo-100 group">
                       <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                               <i className="fas fa-chart-tree-map text-sm"></i>
                             </div>
                             <span className="text-lg font-bold text-slate-900">{c.factor}</span>
                          </div>
                          <span className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest ${c.direction === 'increase' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             {c.direction === 'increase' ? 'Positive' : 'Negative'} Impact: {Math.abs(c.contribution_percentage).toFixed(1)}%
                          </span>
                       </div>
                       <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div 
                             className={`h-full transition-all duration-1000 ${c.direction === 'increase' ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                             style={{ width: `${Math.min(100, Math.abs(c.contribution_percentage) * 4)}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
               </div>
            ) : (
               <div className="py-24 text-center text-slate-300">
                  <i className="fas fa-layer-group text-5xl opacity-20 mb-6"></i>
                  <p className="text-lg font-medium">Insufficient variance for causal mapping.</p>
               </div>
            )}
          </div>
        )}

        <DataChat job={job} />
      </div>

      <div className="px-12 py-8 bg-slate-900 text-slate-500 flex items-center justify-between border-t border-slate-800">
        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-slate-300">Deterministic Engine Active</span>
           </div>
           <span className="w-px h-4 bg-slate-800"></span>
           <span>Processed in {job.metrics?.processingTimeMs}ms</span>
        </div>
        <div className="flex gap-8">
           <button className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-indigo-400 transition-colors flex items-center gap-3">
              <i className="fas fa-clock-rotate-left"></i>
              Audit Log
           </button>
           <button className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center gap-3">
              <i className="fas fa-cloud-share"></i>
              Export Cleaned Frame
           </button>
        </div>
      </div>
    </div>
  );
};
