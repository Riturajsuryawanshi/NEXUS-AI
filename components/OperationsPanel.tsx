
import React, { useState } from 'react';
import { JobService } from '../services/jobService';
import { JobRecord } from '../types';
import { TransformationEngine } from '../data_engine/transformation';

interface OperationsPanelProps {
  job: JobRecord;
}

interface PreviewState {
  id: string;
  label: string;
  summary: string;
  icon: string;
  color: string;
  metrics?: { label: string; value: number }[];
}

export const OperationsPanel: React.FC<OperationsPanelProps> = ({ job }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const actions = [
    { id: 'clean_data', label: 'Clean Data', icon: 'fa-wand-magic-sparkles', color: 'text-indigo-500' },
    { id: 'remove_duplicates', label: 'Deduplicate', icon: 'fa-clone', color: 'text-emerald-500' },
    { id: 'build_dashboard', label: 'Build Dashboard', icon: 'fa-chart-pie', color: 'text-purple-500' },
    { id: 'undo', label: 'Undo Last', icon: 'fa-rotate-left', color: 'text-slate-400' },
  ];

  const handleActionClick = (action: typeof actions[0]) => {
    setIsOpen(false);

    if (action.id === 'clean_data' || action.id === 'remove_duplicates') {
      const currentData = job.dataStack[job.dataStack.length - 1] || [];
      const columns = Object.values(job.summary?.columns || {}) as any;
      let summaryText = "";
      let previewMetrics: { label: string; value: number }[] = [];

      if (action.id === 'remove_duplicates') {
        const deduplicated = TransformationEngine.deduplicate(currentData);
        const diff = currentData.length - deduplicated.length;
        summaryText = diff > 0 
          ? `Redundant rows detected. This action will prune exact matches to ensure analytical integrity.`
          : `No duplicate rows were detected in the current version of the data.`;
        
        if (diff > 0) {
          previewMetrics.push({ label: 'Duplicates Found', value: diff });
          previewMetrics.push({ label: 'Rows Remaining', value: deduplicated.length });
        }
      } else {
        // clean_data
        let nullsFilled = 0;
        let normalizedCount = 0;
        
        columns.forEach((col: any) => {
          currentData.forEach(row => {
            const val = row[col.name];
            if (val === null || val === undefined) {
              nullsFilled++;
            } else if (typeof val === 'string' && val !== val.trim()) {
              normalizedCount++;
            }
          });
        });

        summaryText = (nullsFilled > 0 || normalizedCount > 0)
          ? `The deterministic engine has identified opportunities to stabilize your dataset for Brain-2 reasoning.`
          : `Dataset is already optimal. No further cleaning required for current schema.`;
        
        if (nullsFilled > 0) previewMetrics.push({ label: 'Nulls Imputed', value: nullsFilled });
        if (normalizedCount > 0) previewMetrics.push({ label: 'Values Normalized', value: normalizedCount });
      }

      setPreview({
        id: action.id,
        label: action.label,
        summary: summaryText,
        icon: action.icon,
        color: action.color,
        metrics: previewMetrics
      });
    } else {
      // Direct execution for other actions
      JobService.applyAction(job.id, action.id);
    }
  };

  const confirmAction = () => {
    if (preview) {
      JobService.applyAction(job.id, preview.id);
      setPreview(null);
    }
  };

  return (
    <>
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-4">
        {isOpen && (
          <div className="flex flex-col gap-2 mb-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className="group flex items-center gap-4 bg-white border border-slate-200 px-6 py-4 rounded-[1.5rem] shadow-2xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
              >
                <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center ${action.color}`}>
                  <i className={`fas ${action.icon} text-sm`}></i>
                </div>
                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isOpen ? 'bg-slate-900 rotate-45' : 'bg-indigo-600 hover:scale-110 shadow-indigo-500/40'}`}
        >
          <i className={`fas ${isOpen ? 'fa-plus' : 'fa-bolt'} text-white text-xl`}></i>
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {preview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setPreview(null)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-6 mb-8">
              <div className={`w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-2xl ${preview.color}`}>
                <i className={`fas ${preview.icon}`}></i>
              </div>
              <div>
                <h3 className="text-2xl font-display font-black text-slate-900 leading-tight">Review Operation</h3>
                <p className="text-slate-500 font-medium">{preview.label}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl mb-8">
              <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                "{preview.summary}"
              </p>
            </div>

            {preview.metrics && preview.metrics.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-10">
                {preview.metrics.map((m, i) => (
                  <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                    <p className="text-xl font-display font-black text-slate-900">{m.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={confirmAction}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                Finalize Operation
              </button>
              <button 
                onClick={() => setPreview(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>

            <p className="mt-6 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Tip: You can always use 'Undo Last' to revert this change.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
