
import React from 'react';
import { DashboardConfig } from '../types';

export const DashboardView: React.FC<{ config: DashboardConfig }> = ({ config }) => {
  if (!config || (config.kpis.length === 0 && config.charts.length === 0)) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-200">
        <i className="fas fa-chart-line text-6xl mb-6 opacity-20"></i>
        <p className="text-lg font-bold">Session Visualization Empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4">
      {/* Expansive KPI Belt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {config.kpis.map((kpi, i) => (
          <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-indigo-500 transition-colors">{kpi.label}</p>
            <div className="flex items-center justify-between">
              <h5 className="text-4xl font-display font-black text-slate-900 tracking-tight">{kpi.value}</h5>
              {kpi.trend !== undefined && (
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black ${kpi.trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <i className={`fas ${kpi.trend > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                  {Math.abs(kpi.trend)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Chart Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {config.charts.map((chart, i) => (
          <div key={i} className="p-10 bg-slate-50 border border-slate-100 rounded-[3rem] group">
            <div className="flex items-center justify-between mb-12">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-500">
                  <i className={`fas ${chart.type === 'bar' ? 'fa-chart-simple' : 'fa-chart-line'}`}></i>
                </div>
                {chart.title}
              </h4>
              <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                Enlarge View
              </button>
            </div>
            
            <div className="h-80 flex items-end justify-between gap-6 px-4">
              {chart.data.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center italic text-sm text-slate-300">
                   Awaiting distribution signals...
                 </div>
              ) : chart.data.map((item, idx) => {
                const maxVal = Math.max(...chart.data.map(d => d.value), 1);
                const height = (item.value / maxVal) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group/item h-full">
                    <div className="relative w-full flex justify-center items-end h-full">
                       {/* Rich Tooltip */}
                       <div className="absolute bottom-full mb-3 bg-slate-900 text-white p-3 rounded-2xl opacity-0 group-hover/item:opacity-100 transition-all scale-75 group-hover/item:scale-100 whitespace-nowrap z-20 shadow-2xl pointer-events-none">
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{item.segment}</p>
                         <p className="text-sm font-black">{item.value.toLocaleString()}</p>
                       </div>
                       
                       <div 
                         className="w-full max-w-[50px] bg-white border border-slate-200 rounded-t-2xl transition-all duration-700 hover:bg-indigo-600 hover:border-indigo-600 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] cursor-pointer overflow-hidden relative"
                         style={{ height: `${Math.max(8, height)}%` }}
                       >
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-50/50 to-transparent"></div>
                       </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 mt-6 truncate w-full text-center group-hover/item:text-slate-900 transition-colors">
                      {item.segment}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
