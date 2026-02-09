
import React, { useState, useRef, useEffect } from 'react';
import { searchGroundedChat } from '../services/geminiService';
import { ChatMessage } from '../types';

const GeneralChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await searchGroundedChat(input);
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: result.text || "No response received.",
        sources: result.sources
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error searching for that." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col glass rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl shadow-lg shadow-blue-900/40">
            🔍
          </div>
          <div>
            <h3 className="font-bold text-lg">Smart Search Chat</h3>
            <p className="text-xs text-slate-500">Powered by Gemini 3 & Google Search</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4">
            <div className="text-6xl">🤖</div>
            <div className="space-y-1">
              <p className="text-lg font-medium">Ask me anything</p>
              <p className="text-sm max-w-xs">I have access to real-time information via Google Search grounding.</p>
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`group flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
              <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
              }`}>
                {m.text}
              </div>
              
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.sources.map((s, si) => s.web && (
                    <a 
                      key={si} 
                      href={s.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-1 rounded-md border border-slate-700 transition-colors"
                    >
                      🔗 {s.web.title || 'Source'}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-5 py-3 rounded-2xl rounded-tl-none border border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 glass border-t border-slate-800">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Search recent events, news, or general knowledge..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4 px-6 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl transition-all shadow-xl shadow-blue-900/30"
          >
            <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralChat;
