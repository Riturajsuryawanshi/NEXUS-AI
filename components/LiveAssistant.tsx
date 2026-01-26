
import React, { useState, useRef, useEffect } from 'react';
import { createAI } from '../services/geminiService';
import { Modality } from '@google/genai';

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Standby');
  const [transcriptions, setTranscriptions] = useState<{role: string, text: string}[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  // Helper functions for PCM encoding/decoding
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const encodePCM = (data: Float32Array): string => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      int16[i] = data[i] * 32768;
    }
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
    setStatus('Standby');
  };

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = createAI();
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          // Fix: Use Modality.AUDIO enum instead of string literal
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are Nexus Assistant, a helpful AI data analyst and creative companion. Keep responses conversational and concise.',
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('Listening...');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const base64 = encodePCM(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' } 
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
              const buffer = await decodeAudioData(decodeBase64(base64), outputCtx, 24000);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscriptions(prev => [...prev, { role: 'You', text }]);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscriptions(prev => [...prev, { role: 'Nexus', text }]);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start Live session:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="glass flex-1 rounded-3xl overflow-hidden flex flex-col mb-6">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
            <div>
              <h3 className="font-bold text-lg">Nexus Voice Assistant</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest">{status}</p>
            </div>
          </div>
          <button 
            onClick={() => setTranscriptions([])}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear Log
          </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
          {transcriptions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
              <div className="text-6xl">🎙️</div>
              <p className="max-w-[200px]">Nexus Assistant is ready to talk. Click the button below to start.</p>
            </div>
          ) : (
            transcriptions.map((t, i) => (
              <div key={i} className={`flex ${t.role === 'You' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${t.role === 'You' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                  <p className="text-[10px] font-bold opacity-50 mb-1 uppercase tracking-tighter">{t.role}</p>
                  <p className="text-sm leading-relaxed">{t.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={isActive ? stopSession : startSession}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
            isActive 
            ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-500/20' 
            : 'bg-blue-600 hover:bg-blue-500 ring-4 ring-blue-500/20'
          }`}
        >
          {isActive ? (
            <div className="w-8 h-8 bg-white rounded-md"></div>
          ) : (
            <div className="flex gap-1 items-end">
              <div className="w-1.5 h-6 bg-white animate-[bounce_1s_infinite_0s] rounded-full"></div>
              <div className="w-1.5 h-10 bg-white animate-[bounce_1s_infinite_0.2s] rounded-full"></div>
              <div className="w-1.5 h-8 bg-white animate-[bounce_1s_infinite_0.4s] rounded-full"></div>
              <div className="w-1.5 h-5 bg-white animate-[bounce_1s_infinite_0.6s] rounded-full"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default LiveAssistant;
