
import React, { useState, useEffect, useRef } from 'react';
import { InterviewQuestion, MasterclassData } from '../types';
import { getMasterclassContent } from '../services/geminiService'; // Removed generateSpeech, decode, decodeAudioData

interface MasterclassViewProps {
  question: InterviewQuestion;
  jobTitle: string;
  location: string;
  onBack: () => void;
  cachedData?: MasterclassData;
}

const MasterclassView: React.FC<MasterclassViewProps> = ({ question, jobTitle, location, onBack, cachedData }) => {
  const [data, setData] = useState<MasterclassData | null>(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceLoadError, setVoiceLoadError] = useState<string | null>(null); // New state for voice error

  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const sanitize = (text: string) => text.replace(/[\*\_#`~]/g, '');

  // Voice Selection Logic for Microsoft Aria
  const findAriaVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // Strictly find Microsoft Aria Online (Natural)
    const aria = voices.find(v => v.name.includes('Aria') && v.name.includes('Online (Natural)'));
    return aria || null; // Return null if not strictly found
  };

  useEffect(() => {
    const loadVoices = () => {
      const voice = findAriaVoice();
      if (voice) {
        setSelectedVoice(voice);
        setVoiceLoadError(null);
      } else {
        setSelectedVoice(null);
        setVoiceLoadError("Preferred voice 'Microsoft Aria' not found. Falling back to system voice.");
      }
    };

    // Listen for voices to be loaded (they are often async)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices(); // Try to load immediately

    const fetchContent = async () => {
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      try {
        const result = await getMasterclassContent(question.question, jobTitle, location);

        const cleanData = {
          ...result,
          coreConcept: sanitize(result.coreConcept),
          why: sanitize(result.why),
          technicalPoints: result.technicalPoints.map(sanitize),
          insiderTip: sanitize(result.insiderTip),
          redFlags: result.redFlags.map(sanitize)
        };

        setData(cleanData);
        setLoading(false);
      } catch (e) {
        console.error("Masterclass Load Failure:", e);
        setLoading(false);
        // Optionally set an error state for the UI here
      }
    };
    fetchContent();

    return () => {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [question, jobTitle, location, cachedData]);


  const handlePlay = () => {
    if (!data) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const fullSpeechText = `${data.coreConcept}. Executive Intelligence: ${data.insiderTip}`;
    const utterance = new SpeechSynthesisUtterance(fullSpeechText);

    // Force specific parameters for HR Director voice
    utterance.lang = 'en-US';
    utterance.pitch = 1.0;
    utterance.rate = 0.95; // San Francisco HR Director cadence

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      // If Aria isn't found, try to find any default en-US voice to prevent silence
      const defaultUSVoice = window.speechSynthesis.getVoices().find(v => v.lang === 'en-US');
      if (defaultUSVoice) {
        utterance.voice = defaultUSVoice;
      }
      // If no suitable voice, user will hear default system voice or nothing, but UI indicates fallback.
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (event) => {
      // "interrupted" and "canceled" are expected when we stop speech manually
      if (event.error === 'interrupted' || event.error === 'canceled') {
        setIsPlaying(false);
        return;
      }
      console.error("SpeechSynthesis error:", event.error);
      setIsPlaying(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-indigo-400 font-bold tracking-[0.2em] text-[10px] uppercase animate-pulse">Establishing Market Logic</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto bg-[#0d0d0d] p-8 md:p-14 rounded-[2.5rem] border border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-700 shadow-3xl">
      <button
        onClick={onBack}
        className="text-indigo-400/80 font-bold mb-10 hover:text-indigo-400 transition-colors uppercase tracking-widest text-xs"
      >
        ← Terminal
      </button>

      <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-16">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-indigo-500/80 uppercase tracking-[0.3em]">Masterclass Active</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black leading-tight text-white tracking-tight">
            {question.question}
          </h2>
        </div>

        <div className="flex flex-col items-center gap-4 flex-shrink-0">
          <button
            onClick={handlePlay}
            disabled={!data || voiceLoadError !== null} // Disable if no data or voice error
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 group ${isPlaying ? 'bg-indigo-600 shadow-indigo-500/40' : 'bg-white/5 border border-white/10 hover:bg-white/10'
              } ${!data || voiceLoadError !== null ? 'opacity-30' : 'opacity-100'}`}
          >
            {isPlaying ? (
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-6 bg-white rounded-full animate-[bounce_0.6s_infinite_ease-in-out]"></div>
                <div className="w-1 h-10 bg-white rounded-full animate-[bounce_0.6s_infinite_ease-in-out_0.2s]"></div>
                <div className="w-1 h-5 bg-white rounded-full animate-[bounce_0.6s_infinite_ease-in-out_0.4s]"></div>
              </div>
            ) : (
              <svg className="w-8 h-8 text-indigo-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">
              {isPlaying ? 'Streaming' : 'Voice Feed'}
            </p>
            <p className="text-[9px] text-indigo-500/60 font-medium">
              {selectedVoice ? `HD: ${selectedVoice.name}` : (voiceLoadError ? 'System Voice Fallback' : 'Loading Voice...')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-20">
        <section className="relative">
          <h3 className="text-indigo-500 font-black tracking-[0.3em] text-[10px] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-px bg-indigo-500/30"></span> Core Strategy
          </h3>
          <p className="text-xl md:text-2xl text-gray-200 leading-relaxed font-semibold tracking-tight italic">
            "{data?.coreConcept}"
          </p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h3 className="text-indigo-500 font-black tracking-[0.3em] text-[10px] uppercase mb-8 flex items-center gap-4">
              <span className="w-8 h-px bg-indigo-500/30"></span> Interviewer Intent
            </h3>
            <p className="text-xl text-gray-400 font-medium leading-relaxed">
              {data?.why}
            </p>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/10 p-10 rounded-[2rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-[50px]"></div>
            <h3 className="text-indigo-400 font-black tracking-[0.3em] text-[10px] uppercase mb-6">Executive Insight</h3>
            <p className="text-2xl text-indigo-50 font-bold leading-snug">
              {data?.insiderTip}
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-indigo-500 font-black tracking-[0.3em] text-[10px] uppercase mb-10 flex items-center gap-4">
            <span className="w-8 h-px bg-indigo-500/30"></span> Critical Points
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.technicalPoints.map((point, idx) => (
              <div key={idx} className="bg-[#111] p-10 rounded-[2rem] border border-white/5 hover:border-indigo-500/20 transition-all group">
                <span className="text-3xl font-black text-indigo-500/20 mb-4 block group-hover:text-indigo-500/40 transition-colors">0{idx + 1}</span>
                <span className="text-xl text-gray-300 font-bold">{point}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-red-500/5 border border-red-500/10 p-12 rounded-[2.5rem]">
          <h3 className="text-red-500 font-black tracking-[0.3em] text-[10px] uppercase mb-8">Red Flags</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data?.redFlags.map((flag, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-500 font-black text-xs">!</div>
                <span className="text-xl font-bold text-red-100/60 leading-tight">{flag}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MasterclassView;
