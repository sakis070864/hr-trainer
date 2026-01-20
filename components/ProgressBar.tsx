
import React from 'react';

interface ProgressBarProps {
  progress: number;
  statusLabel?: string;
  scanningSource?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, statusLabel, scanningSource }) => {
  return (
    <div className="w-full max-w-2xl space-y-8 animate-in fade-in duration-500">

      {/* Cinematic Header Text */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
          <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-indigo-300 tracking-widest uppercase shadow-indigo-500/50 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
            {statusLabel || 'INITIALIZING NEURAL LINK...'}
          </h2>
        </div>

        <p className="text-xs font-mono text-indigo-400/60 tracking-[0.2em]">
          DATA_CORE_SYNC: {Math.round(progress)}%
        </p>
      </div>

      {/* The "Thick" Bar */}
      <div className="relative w-full h-8 bg-black/40 rounded-full border border-white/10 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)_inset]">

        {/* Grid Background Pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'linear-gradient(90deg, transparent 95%, rgba(255,255,255,0.2) 100%)', backgroundSize: '20px 100%' }}
        />

        {/* Liquid Light Filler */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(99,102,241,0.6)]"
          style={{ width: `${progress}%` }}
        >
          {/* Internal Flow Animation */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shimmer" />
        </div>
      </div>

      {/* Technical Footer (Source Log) */}
      <div className="flex justify-between items-center px-4 py-3 bg-indigo-950/30 rounded-xl border border-indigo-500/20">
        <div className="flex items-center gap-3">
          <span className="text-indigo-400 text-lg animate-pulse">⚡</span>
          <div className="text-[10px] md:text-xs font-mono text-indigo-300 tracking-wider">
            {scanningSource ? (
              <span className="flex gap-2">
                <span className="opacity-50">TARGET:</span>
                <span className="font-bold text-white">{scanningSource.replace('TARGETING: ', '').replace('ACCESSING: ', '').replace('>_ ', '')}</span>
              </span>
            ) : (
              <span className="opacity-50">WAITING FOR UPLINK...</span>
            )}
          </div>
        </div>
        <div className="hidden md:block text-[9px] text-indigo-500/50 font-black tracking-[0.3em]">
          SECURE_CONNECTION_TLS_1.3
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
