import React, { useEffect, useState } from 'react';

export const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('nexus_theme') as 'light' | 'dark' || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('nexus_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className={`
        relative w-16 h-8 rounded-full transition-colors duration-500 shadow-inner flex items-center px-1
        ${theme === 'dark' ? 'bg-slate-700' : 'bg-nexus-100'}
      `}
            aria-label="Toggle Dark Mode"
        >
            {/* Track Icons */}
            <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] pointer-events-none">
                <i className="fas fa-moon text-slate-400"></i>
                <i className="fas fa-sun text-nexus-500"></i>
            </div>

            {/* Thumb */}
            <div
                className={`
          w-6 h-6 rounded-full shadow-md transform transition-transform duration-500 flex items-center justify-center z-10
          ${theme === 'dark' ? 'translate-x-8 bg-slate-900' : 'translate-x-0 bg-white'}
        `}
            >
                <i
                    className={`
            text-[10px] transition-colors duration-300
            ${theme === 'dark' ? 'fas fa-moon text-slate-200' : 'fas fa-sun text-amber-500'}
          `}
                ></i>
            </div>
        </button>
    );
};
