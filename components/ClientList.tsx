
import React, { useState, useEffect } from 'react';
import { ClientService } from '../services/clientService';
import { Client } from '../types';

interface ClientListProps {
    onSelect: (client: Client) => void;
}

export const ClientList: React.FC<ClientListProps> = ({ onSelect }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [showCreate, setShowCreate] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [industry, setIndustry] = useState('SaaS');
    const [currency, setCurrency] = useState('$');

    useEffect(() => {
        const unsub = ClientService.subscribe((list) => {
            setClients(list);
        });
        return unsub;
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        await ClientService.createClient(name, industry, currency);
        setShowCreate(false);
        setName('');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-12 flex flex-col items-center">
            <div className="max-w-6xl w-full">

                {/* Header */}
                <div className="flex justify-between items-end mb-16">
                    <div>
                        <h1 className="text-6xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase italic mb-4">
                            Nexus <span className="text-indigo-600 dark:text-indigo-400">Workspace</span>
                        </h1>
                        <p className="text-2xl text-slate-500 dark:text-slate-400 font-medium">Select a client context to begin earning.</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-500/20 active:scale-95"
                    >
                        <i className="fas fa-plus mr-3"></i> Use New Client
                    </button>
                </div>

                {/* Client Grid */}
                {clients.length === 0 ? (
                    <div className="text-center py-32 bg-white dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 dark:text-slate-500 text-4xl">
                            <i className="fas fa-users-slash"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Clients Found</h3>
                        <p className="text-slate-500 dark:text-slate-400">Create your first client workspace to start analyzing data.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {clients.map(client => (
                            <div
                                key={client.id}
                                onClick={() => onSelect(client)}
                                className="group bg-white dark:bg-slate-800/80 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <i className="fas fa-building text-8xl text-indigo-900"></i>
                                </div>

                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <span className="font-display font-black">{client.name.substring(0, 2).toUpperCase()}</span>
                                    </div>

                                    <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white mb-2">{client.name}</h3>
                                    <div className="flex gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">
                                        <span>{client.industry}</span>
                                        <span>•</span>
                                        <span>{client.currency} Currency</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm font-medium border-t border-slate-100 dark:border-slate-700 pt-6">
                                        <span className="text-slate-500 dark:text-slate-400">Last active: Just now</span>
                                        <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Enter Workspace <i className="fas fa-arrow-right ml-1"></i></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Overlay */}
            {showCreate && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-12 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">New Client</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">Establish a new workspace for specific analysis.</p>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2 block mb-2">Company Name</label>
                                <input
                                    autoFocus
                                    placeholder="e.g. Acme Corp"
                                    className="w-full bg-slate-50 dark:bg-slate-700/50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2 block mb-2">Industry</label>
                                    <select
                                        value={industry}
                                        onChange={e => setIndustry(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-700/50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10"
                                    >
                                        <option>SaaS</option>
                                        <option>E-commerce</option>
                                        <option>Agency</option>
                                        <option>Retail</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2 block mb-2">Currency</label>
                                    <input
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-700/50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 text-center"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">Create Client</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
