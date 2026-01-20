
import React from 'react';
import { InterviewQuestion } from '../types';

interface QuestionCardProps {
  data: InterviewQuestion;
  onMasterclass: () => void;
  onTraining: () => void;
  onSimulation: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ data, onMasterclass, onTraining, onSimulation }) => {
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Technical': return 'text-blue-400 bg-blue-400/10';
      case 'Behavioral': return 'text-purple-400 bg-purple-400/10';
      case 'Case Study': return 'text-amber-400 bg-amber-400/10';
      default: return 'text-emerald-400 bg-emerald-400/10';
    }
  };

  return (
    <div className="bg-[#0d0d0d] p-8 rounded-[2rem] flex flex-col h-full border border-white/5 hover:border-white/10 transition-all group shadow-2xl">
      <div className="flex justify-between items-start mb-6">
        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] ${getCategoryColor(data.category)}`}>
          {data.category}
        </span>
        {data.status === 'pass' && (
          <div className="text-3xl text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)] font-black animate-in zoom-in spin-in-12 duration-500">
            ✓
          </div>
        )}
        {data.status === 'fail' && (
          <div className="text-3xl text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] font-black animate-in zoom-in spin-in-12 duration-500">
            ✕
          </div>
        )}
      </div>

      <p className="text-2xl font-bold leading-tight mb-10 flex-1 text-gray-100">
        {data.question}
      </p>

      <div className="grid grid-cols-1 gap-3 mt-auto">
        <button
          onClick={onMasterclass}
          className="w-full py-3 px-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center justify-between group/btn"
        >
          <span className="text-sm font-bold text-gray-200">[Masterclass]</span>
          <span className="text-[11px] text-gray-600 font-medium group-hover/btn:text-gray-400 transition-colors">Deep-dive answer</span>
        </button>

        <button
          onClick={onTraining}
          className="w-full py-3 px-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center justify-between group/btn"
        >
          <span className="text-sm font-bold text-gray-200">[Training Mode]</span>
          <span className="text-[11px] text-gray-600 font-medium group-hover/btn:text-gray-400 transition-colors">Real-time feedback</span>
        </button>

        <button
          onClick={onSimulation}
          className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/10 flex items-center justify-between transition-all active:scale-[0.98]"
        >
          <span className="text-sm font-bold">[Live Simulation]</span>
          <span className="text-[11px] text-indigo-200 font-medium opacity-70">Voice practice</span>
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
