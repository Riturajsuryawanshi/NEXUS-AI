import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ReviewAudit } from '../types';

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

    useEffect(() => {
        fetchReports();
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

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this report?')) return;

        try {
            const { error } = await supabase.from('business_audits').delete().eq('id', id);
            if (error) throw error;
            setReports(reports.filter(r => r.id !== id));
        } catch (err) {
            console.error('Error deleting report:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <i className="fas fa-folder-open text-2xl"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Reports Yet</h3>
                <p className="text-slate-500">Analyze a business to save your first report.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
                <div
                    key={report.id}
                    onClick={() => onSelectAudit(report.audit_data)}
                    className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group relative"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                            <i className="fas fa-store"></i>
                        </div>
                        <button
                            onClick={(e) => handleDelete(e, report.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <i className="fas fa-trash-alt"></i>
                        </button>
                    </div>

                    <h4 className="font-bold text-slate-900 mb-1 line-clamp-1">{report.business_name}</h4>
                    <p className="text-xs text-slate-500 font-medium mb-4">
                        {new Date(report.created_at).toLocaleDateString()} • {report.audit_data.preprocess.total_reviews} Reviews
                    </p>

                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">
                            {report.audit_data.preprocess.average_rating?.toFixed(1) ?? report.audit_data.business_summary.rating.toFixed(1)} ★
                        </span>
                        <span className="text-xs text-slate-400">Average Rating</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
