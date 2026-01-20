
import React, { useState, useEffect } from 'react';

interface AriaBriefingProps {
  text: string;
}

const AriaBriefing: React.FC<AriaBriefingProps> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ariaVoice, setAriaVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const aria = voices.find(v => v.name.includes('Aria') && v.name.includes('Online (Natural)'));
      setAriaVoice(aria || null);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => window.speechSynthesis.cancel();
  }, []);

  const handleBriefing = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = ariaVoice;
    utterance.lang = 'en-US';
    utterance.pitch = 1.0;
    utterance.rate = 0.95;
    
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button 
      onClick={handleBriefing}
      className={`px-6 py-3 rounded-full border transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest ${
        isPlaying 
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
          : 'bg-white/5 border-white/10 text-indigo-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {isPlaying ? (
        <>
          <div className="flex gap-0.5">
            <div className="w-0.5 h-3 bg-white animate-pulse"></div>
            <div className="w-0.5 h-3 bg-white animate-pulse delay-75"></div>
            <div className="w-0.5 h-3 bg-white animate-pulse delay-150"></div>
          </div>
          Neural Stream
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          Neural Briefing
        </>
      )}
    </button>
  );
};

export default AriaBriefing;
