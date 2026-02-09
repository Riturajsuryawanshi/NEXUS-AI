
import React, { useState } from 'react';
import { UserService } from '../services/userService';

interface AuthFlowProps {
  onSuccess: () => void;
  initialMode: 'login' | 'signup';
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onSuccess, initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await UserService.loginWithGoogle();
      // Note: This often redirects, so onSuccess might not be reached immediately
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'login') await UserService.login(email);
      else await UserService.signup(email);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <i className="fas fa-bolt text-white text-2xl"></i>
          </div>
          <h2 className="text-4xl font-display font-black text-slate-900 mb-2 tracking-tight">
            Nexus Analyst
          </h2>
          <p className="text-slate-500 font-medium">
            Professional AI Data Intelligence
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl">

          <div className="mb-8">
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all group shadow-sm hover:shadow-md"
              >
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                <span className="text-sm font-bold text-slate-700">
                  {isLoading ? 'Connecting...' : 'Continue with Google'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Or Secure Email</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Business Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@company.com"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-slate-900 font-medium"
                required
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/10"
            >
              {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-all"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
