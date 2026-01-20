
import React, { useState, useEffect, useRef } from 'react';
import { InterviewQuestion, SimulationReport } from '../types';
import { getGeminiClient, encode, decode, decodeAudioData, generateSimulationReport } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';

interface SimulationViewProps {
  question: InterviewQuestion;
  jobTitle: string;
  onBack: () => void;
}

const SimulationView: React.FC<SimulationViewProps> = ({ question, jobTitle, onBack }) => {
  const [status, setStatus] = useState<'IDLE' | 'PERMISSIONS' | 'CONNECTING' | 'ACTIVE' | 'ERROR'>('IDLE');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [report, setReport] = useState<SimulationReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // New state variable
  const [userTranscript, setUserTranscript] = useState<string>(''); // New state variable
  
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSimulation = async () => {
    // Reset report when starting new simulation
    setReport(null);
    setStatus('PERMISSIONS');
    
    try {
      // 1. Προτεραιότητα στο Μικρόφωνο
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true } 
      });
      streamRef.current = stream;
      
      setStatus('CONNECTING');

      // 2. Ενεργοποίηση Ήχου (Κρίσιμο για να ακουστεί ο "Coach")
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (outCtx.state === 'suspended') await outCtx.resume();
      outputAudioContextRef.current = outCtx;

      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inCtx;

      // 3. Σύνδεση με Gemini
      const ai = getGeminiClient();
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('ACTIVE');
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then((session) => {
                if (inCtx.state === 'closed') return;
                try {
                  session.sendRealtimeInput({ 
                    media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
                  });
                } catch (e) {
                  // Ignore errors during shutdown
                }
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Transcription
            if (message.serverContent?.outputTranscription) {
              setTranscript(prev => [...prev.slice(-4), `Coach: ${message.serverContent?.outputTranscription?.text}`]);
            }

            // Audio Playback
            const audioPart = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData);
            if (audioPart?.inlineData?.data && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioPart.inlineData.data), ctx);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => { setStatus('ERROR'); console.error(e); },
          onclose: () => setStatus('IDLE')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are an elite HR Director. 
          Start the interview for ${jobTitle} by asking: "${question.question}". 
          Listen to the candidate and provide challenging follow-up questions.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      setStatus('ERROR');
      console.error(err);
    }
  };

  const endSimulation = async () => {
    // 1. Clean up Input Audio (Stop recording immediately)
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close().catch(() => {});
      inputAudioContextRef.current = null;
    }

    // 2. Clean up Stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    // 3. Clean up Session
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }

    // 4. Clean up Output Audio
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close().catch(() => {});
      outputAudioContextRef.current = null;
    }
    
    // 5. Clear sources
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();

    // 6. Generate Report
    setStatus('IDLE');
    setIsGeneratingReport(true);
    try {
      if (transcript.length > 0) {
        const result = await generateSimulationReport(transcript, jobTitle);
        setReport(result);
      } else {
        // No transcript, just go back
        onBack();
      }
    } catch (e) {
      console.error(e);
      // Fallback if report fails
      onBack();
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isGeneratingReport) return (
    <div className="max-w-3xl mx-auto glass p-10 rounded-[2.5rem] border border-white/10 min-h-[70vh] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-2xl font-bold text-white mb-2">Compiling Post-Interview Report...</h2>
      <p className="text-gray-400 text-sm">Analyzing communication patterns and technical depth</p>
    </div>
  );

  if (report) return (
    <div className="max-w-4xl mx-auto glass p-12 rounded-[2.5rem] border border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-700">
       <button onClick={onBack} className="text-gray-500 hover:text-white mb-8 font-bold text-sm uppercase tracking-widest">← Back to Terminal</button>
       
       <div className="flex flex-col md:flex-row items-center gap-12 mb-12">
         <div className={`relative w-40 h-40 rounded-full flex items-center justify-center border-8 ${report.score >= 60 ? 'border-green-500/20' : 'border-red-500/20'}`}>
           <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="46" fill="none" strokeWidth="8" className={report.score >= 60 ? 'stroke-green-500' : 'stroke-red-500'} strokeDasharray="289.02652413026095" strokeDashoffset={289.02652413026095 - (289.02652413026095 * report.score) / 100} strokeLinecap="round" />
           </svg>
           <div className="text-center">
             <span className={`text-5xl font-black ${report.score >= 60 ? 'text-green-400' : 'text-red-400'}`}>{report.score}</span>
             <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Score</span>
           </div>
         </div>
         
         <div className="flex-1">
           <h2 className="text-4xl font-black text-white mb-4">Executive Summary</h2>
           <p className="text-lg text-gray-300 leading-relaxed font-medium">{report.feedback}</p>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
         <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
            <h3 className="text-green-400 font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Top Strengths</h3>
            <ul className="space-y-4">
              {report.strengths.map((s, i) => <li key={i} className="text-gray-300 font-bold flex gap-3"><span className="text-green-500/50">✓</span> {s}</li>)}
            </ul>
         </div>
         
         <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
            <h3 className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Areas for Growth</h3>
            <ul className="space-y-4">
              {report.improvements.map((s, i) => <li key={i} className="text-gray-300 font-bold flex gap-3"><span className="text-indigo-500/50">↑</span> {s}</li>)}
            </ul>
         </div>
       </div>

       {report.redFlags.length > 0 && (
         <div className="bg-red-500/10 p-8 rounded-3xl border border-red-500/20 mb-12">
             <h3 className="text-red-400 font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Critical Warning</h3>
             <ul className="space-y-2">
               {report.redFlags.map((s, i) => <li key={i} className="text-red-200 font-bold flex gap-3"><span className="text-red-500">!</span> {s}</li>)}
             </ul>
         </div>
       )}

       <button onClick={() => { setReport(null); setTranscript([]); }} className="w-full py-5 bg-white text-black font-black text-xl rounded-2xl hover:bg-gray-200 transition-colors shadow-xl">
         Start New Session
       </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto glass p-10 rounded-[2.5rem] border border-white/10 min-h-[70vh] flex flex-col items-center justify-center text-center">
      <div className="mb-12 relative">
        <div className={`w-32 h-32 rounded-full accent-gradient flex items-center justify-center shadow-2xl transition-all duration-500 ${status === 'ACTIVE' ? 'scale-110 shadow-indigo-500/50' : ''}`}>
          {status === 'ACTIVE' ? (
            <div className="flex items-center gap-1">
              {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-8 bg-white rounded-full animate-pulse" style={{animationDelay: `${i*0.1}s`}}></div>)}
            </div>
          ) : (status === 'CONNECTING' || status === 'PERMISSIONS') ? (
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v1a7 7 0 01-14 0v-1M12 18.5V23M8 23h8" strokeWidth="2" strokeLinecap="round"/></svg>
          )}
        </div>
      </div>

      <h2 className="text-3xl font-bold text-white mb-4">
        {status === 'IDLE' && 'Voice Simulation'}
        {status === 'ACTIVE' && 'Coach is Listening...'}
        {status === 'CONNECTING' && 'Connecting...'}
        {status === 'ERROR' && 'Connection Error'}
      </h2>
      
      <p className="text-gray-400 mb-10 max-w-sm">
        {status === 'IDLE' && 'Practice your response via voice. The AI will challenge your answers.'}
        {status === 'ACTIVE' && 'Speak clearly. The coach will respond in real-time.'}
      </p>

      {status === 'ACTIVE' && (
        <div className="w-full bg-white/5 p-6 rounded-2xl mb-8 text-left border border-white/5">
          <div className="space-y-3">
            {transcript.map((t, i) => <p key={i} className="text-sm text-indigo-200 opacity-80 italic">{t}</p>)}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {status === 'IDLE' ? (
          <button onClick={startSimulation} className="px-12 py-4 accent-gradient rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform">
            Start Voice Interview
          </button>
        ) : (
          <button onClick={endSimulation} className="px-12 py-4 bg-white/10 hover:bg-white/20 rounded-full font-bold text-white transition-all">
            Exit Simulation
          </button>
        )}
      </div>
    </div>
  );
};

export default SimulationView;
