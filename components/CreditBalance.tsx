import React from 'react';

interface CreditBalanceProps {
    credits: number;
    onClick: () => void;
}

export const CreditBalance: React.FC<CreditBalanceProps> = ({ credits, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full transition-all group"
        >
            <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <i className="fas fa-coins text-[10px]"></i>
            </div>
            <span className="text-xs font-bold text-amber-700">
                {credits} <span className="opacity-70">Credits</span>
            </span>
            <i className="fas fa-plus-circle text-amber-400 text-xs ml-1"></i>
        </button>
    );
};
