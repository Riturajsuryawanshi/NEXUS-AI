
import React, { useState, useRef } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { ImageSize, AspectRatio } from '../types';

const ImageLab: React.FC = () => {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async () => {
    if (!prompt) return;

    // Check for user-selected API key if using high-res models
    if (mode === 'generate' && (size === '2K' || size === '4K')) {
      // @ts-ignore
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Assuming success after triggering the dialog to avoid race conditions
      }
    }

    setLoading(true);
    try {
      if (mode === 'generate') {
        const result = await generateImage(prompt, size, ratio);
        setImage(result);
      } else {
        if (!uploadedImage) return;
        const result = await editImage(uploadedImage, prompt);
        setImage(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-center">
        <div className="bg-slate-900 p-1 rounded-2xl flex border border-slate-800">
          <button
            onClick={() => setMode('generate')}
            className={`px-8 py-2 rounded-xl transition-all ${mode === 'generate' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Generate
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-8 py-2 rounded-xl transition-all ${mode === 'edit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="glass p-8 rounded-3xl space-y-6 h-fit">
          <h3 className="text-xl font-bold">
            {mode === 'generate' ? 'Image Generation' : 'AI Image Editing'}
          </h3>

          {mode === 'edit' && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all group"
              >
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Upload" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <>
                    <span className="text-4xl group-hover:scale-110 transition-transform">📸</span>
                    <span className="text-slate-500 mt-2">Click to upload original photo</span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'generate' ? "A futuristic city in space, neon colors, cinematic lighting..." : "Add a retro filter and remove the person in background"}
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          {mode === 'generate' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Image Size</label>
                <select 
                  value={size} 
                  onChange={(e) => setSize(e.target.value as ImageSize)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                >
                  <option value="1K">1K Resolution</option>
                  <option value="2K">2K Resolution</option>
                  <option value="4K">4K Resolution</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Aspect Ratio</label>
                <select 
                  value={ratio} 
                  onChange={(e) => setRatio(e.target.value as AspectRatio)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="4:3">4:3 Standard</option>
                  <option value="3:4">3:4 Book</option>
                </select>
              </div>
            </div>
          )}

          <button
            onClick={handleAction}
            disabled={loading || !prompt || (mode === 'edit' && !uploadedImage)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-blue-900/20"
          >
            {loading ? "Processing with AI..." : mode === 'generate' ? "Generate Image" : "Apply AI Edits"}
          </button>
        </div>

        {/* Output */}
        <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-medium">Nexus AI is creating your image...</p>
            </div>
          ) : image ? (
            <div className="space-y-4 w-full">
              <img src={image} alt="AI Generated" className="w-full h-auto rounded-2xl shadow-2xl border border-slate-700" />
              <div className="flex justify-center gap-4">
                <a 
                  href={image} 
                  download="nexus-ai-image.png"
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-all"
                >
                  Download Image
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-6xl mb-4 grayscale opacity-30">🖼️</div>
              <p className="text-slate-500 font-medium">Your creation will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageLab;
