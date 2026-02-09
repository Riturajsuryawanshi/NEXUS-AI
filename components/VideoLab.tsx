
import React, { useState, useRef } from 'react';
import { animateImage } from '../services/geminiService';
import { AspectRatio } from '../types';

const VideoLab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState<AspectRatio>('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setVideoUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnimate = async () => {
    if (!uploadedImage) return;

    // MANDATORY: Check for user-selected paid API key for Veo models
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume success after triggering to avoid race conditions
    }

    setLoading(true);
    setVideoUrl(null);
    setStatusMessage('Initiating Veo generation...');
    
    // Simulate periodic status updates
    const messages = [
      'Analyzing your image...',
      'Synthesizing temporal frames...',
      'Applying cinematic motion...',
      'This may take 1-2 minutes, Nexus AI is hard at work!',
      'Finalizing rendering...',
      'Almost there...'
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      setStatusMessage(messages[msgIdx % messages.length]);
      msgIdx++;
    }, 15000);

    try {
      const result = await animateImage(uploadedImage, prompt, ratio);
      setVideoUrl(result);
    } catch (err) {
      console.error(err);
      setStatusMessage('Error during animation. Please try again.');
    } finally {
      setLoading(false);
      clearInterval(interval);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold">Veo Video Studio</h3>
        <p className="text-slate-400">Transform your still photos into cinematic videos with Veo 3.1 Fast.</p>
        <p className="text-xs text-slate-500">Requires a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">paid GCP project API key</a>.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="glass p-8 rounded-3xl space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[16/9] bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden"
          >
            {uploadedImage ? (
              <img src={uploadedImage} alt="Upload" className="w-full h-full object-cover" />
            ) : (
              <>
                <span className="text-4xl mb-2">🖼️</span>
                <span className="text-slate-500">Upload Starting Image</span>
              </>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Motion Description (Optional)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the motion, e.g., 'The camera pans slowly around the robot as sparks fly from its hand.'"
              className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Aspect Ratio</label>
            <div className="flex gap-4">
              <button
                onClick={() => setRatio('16:9')}
                className={`flex-1 py-2 rounded-lg border transition-all ${ratio === '16:9' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
              >
                16:9 Landscape
              </button>
              <button
                onClick={() => setRatio('9:16')}
                className={`flex-1 py-2 rounded-lg border transition-all ${ratio === '9:16' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
              >
                9:16 Portrait
              </button>
            </div>
          </div>

          <button
            onClick={handleAnimate}
            disabled={loading || !uploadedImage}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-900/20"
          >
            {loading ? "Generating Video..." : "Create Video with Veo"}
          </button>
        </div>

        <div className="glass p-8 rounded-3xl min-h-[400px] flex flex-col items-center justify-center">
          {loading ? (
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🎬</div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">Generating your video...</p>
                <p className="text-slate-400 animate-pulse">{statusMessage}</p>
              </div>
            </div>
          ) : videoUrl ? (
            <div className="space-y-6 w-full animate-in zoom-in-95 duration-700">
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full rounded-2xl shadow-2xl border border-slate-700 bg-black"
              />
              <a 
                href={videoUrl} 
                download="nexus-ai-video.mp4"
                className="block w-full text-center py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold transition-all"
              >
                Download Master File
              </a>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-40">
              <div className="text-7xl">🎞️</div>
              <p className="text-slate-500 max-w-[200px] mx-auto">Upload a photo and Nexus AI will bring it to life.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoLab;
