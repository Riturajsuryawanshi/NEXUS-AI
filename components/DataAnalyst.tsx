
import React, { useState, useRef } from 'react';
// Add missing XLSX import
import * as XLSX from 'xlsx';
import { performDataAnalysis } from '../services/geminiService';
import { AnalysisResult } from '../types';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const DataAnalyst: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const readExcel = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        // Use imported XLSX
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Use imported XLSX
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        resolve(csv);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleAnalyze = async () => {
    if (!file || !prompt) return;
    setLoading(true);
    setError(null);
    try {
      const csv = await readExcel(file);
      const csvSnippet = csv.split('\n').slice(0, 100).join('\n'); // Take first 100 rows
      const analysis = await performDataAnalysis(csvSnippet, prompt);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || "Something went wrong during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!result) return null;
    const { chartType, chartData, columns } = result;
    const dataKeys = Object.keys(chartData[0]).filter(k => typeof chartData[0][k] === 'number');
    const labelKey = Object.keys(chartData[0]).find(k => typeof chartData[0][k] === 'string') || Object.keys(chartData[0])[0];

    const containerStyle = "h-[400px] w-full mt-6";

    switch (chartType) {
      case 'bar':
        return (
          <div className={containerStyle}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey={labelKey} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Legend />
                {dataKeys.map((key, i) => (
                  <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'line':
        return (
          <div className={containerStyle}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey={labelKey} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Legend />
                {dataKeys.map((key, i) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 6 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      case 'area':
        return (
          <div className={containerStyle}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey={labelKey} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Legend />
                {dataKeys.map((key, i) => (
                  <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.3} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      case 'pie':
        return (
          <div className={containerStyle}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey={dataKeys[0]}
                  nameKey={labelKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="glass p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white">Advanced Data Analyst</h3>
            <p className="text-slate-400">Upload your data and let Nexus AI provide deep insights.</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
          >
            <span>📁</span> {file ? file.name : "Choose Excel/CSV"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />
        </div>

        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., 'Analyze the sales performance across regions and show me the trend for the last 6 months.'"
            className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !file || !prompt}
            className="absolute bottom-4 right-4 px-8 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-all shadow-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : "Run Analysis"}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 glass p-8 rounded-3xl">
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-blue-400">📊</span> Visual Representation
            </h4>
            {renderChart()}
          </div>

          <div className="glass p-8 rounded-3xl space-y-6 overflow-y-auto max-h-[500px] custom-scrollbar">
            <div>
              <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span className="text-indigo-400">💡</span> Summary
              </h4>
              <p className="text-slate-300 leading-relaxed">{result.summary}</p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span className="text-emerald-400">✨</span> Key Insights
              </h4>
              <ul className="space-y-3">
                {result.insights.map((insight, idx) => (
                  <li key={idx} className="flex gap-3 text-slate-300">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnalyst;
