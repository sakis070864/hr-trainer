
import React, { useState, useEffect } from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  onReset: () => void;
  onViewChange: (mode: ViewMode) => void;
  onHelp: () => void;
  currentView: ViewMode;
  locationActive: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, onViewChange, onHelp, currentView, locationActive }) => {
  const [hasPersonalKey, setHasPersonalKey] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      try {
        // @ts-ignore
        if (window.aistudio?.hasSelectedApiKey) {
          // @ts-ignore
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasPersonalKey(hasKey);
        }
      } catch (e) {
        console.warn("Key check unavailable");
      }
    };
    checkKey();
  }, []);

  const proceedToKeySelection = async () => {
    try {
      // @ts-ignore
      if (window.aistudio?.openSelectKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setHasPersonalKey(true);
      } else {
        window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
      }
    } catch (e) {
      console.error("Failed to open key selector");
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'sakis@1964') {
      setShowLogin(false);
      setPassword('');
      setLoginError(false);
      proceedToKeySelection();
    } else {
      setLoginError(true);
    }
  };

  const menuItems: { id: ViewMode; label: string }[] = [
    { id: 'CAREER_PATH', label: 'Career Path' },
    { id: 'SALARY_INSIGHTS', label: 'Salary Insights' },
    { id: 'NETWORKING', label: 'Elite Networking' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={onReset}
          >
            <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center font-bold italic text-white group-hover:scale-110 transition-transform">T</div>
            <span className="font-bold text-xl tracking-tight whitespace-nowrap">HR Trainer</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex gap-6 text-sm font-medium">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => locationActive && onViewChange(item.id)}
                disabled={!locationActive}
                className={`transition-all relative py-1 ${!locationActive
                  ? 'text-gray-700 cursor-not-allowed'
                  : currentView === item.id
                    ? 'text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {item.label}
                {currentView === item.id && <div className="absolute -bottom-1 left-0 w-full h-0.5 accent-gradient rounded-full"></div>}
              </button>
            ))}
          </div>

          <button
            onClick={onHelp}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-bold group"
            title="System Guide"
          >
            <span className="group-hover:scale-110 transition-transform">?</span>
          </button>
        </div>
      </header>

      {/* Auth Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <div className="w-full max-w-md glass p-10 rounded-[2.5rem] border border-white/10 shadow-3xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">System Access</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black">Authorized Personnel Only</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(false); }}
                  placeholder="Enter Security Token"
                  className={`w-full px-6 py-4 bg-white/5 border ${loginError ? 'border-red-500/50' : 'border-white/10'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg text-center font-mono`}
                />
                {loginError && (
                  <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-4 text-center animate-pulse">
                    Access Denied: Invalid Security Token
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowLogin(false); setPassword(''); setLoginError(false); }}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-gray-500 text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 accent-gradient rounded-2xl font-black text-white text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
