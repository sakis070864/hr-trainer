
import React, { useState, useEffect } from 'react';
import { CareerPathData } from '../../types';
import { getCareerPathIntelligence } from '../../services/geminiService';
import AriaBriefing from '../AriaBriefing';

const CareerPathView: React.FC<{ jobTitle: string; location: string; onBack: () => void; cachedData?: CareerPathData }> = ({ jobTitle, location, onBack, cachedData }) => {
  const [data, setData] = useState<CareerPathData | null>(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    getCareerPathIntelligence(jobTitle, location).then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [jobTitle, location, cachedData]);

  if (loading) return <div className="animate-pulse flex flex-col items-center justify-center py-40"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">Architecting Roadmap...</p></div>;

  const briefingText = `Here is your 2026 Career Roadmap for ${location}. By Year 5, you should be targeting high-impact roles. Focus on ${data?.highDemandSkills?.slice(0, 3).join(', ') || 'specialized certifications'}.`;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <button onClick={onBack} className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-4 hover:text-white transition-colors">← Terminal</button>
          <h2 className="text-5xl font-black">2026 Strategic Roadmap</h2>
        </div>
        <AriaBriefing text={briefingText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {data?.roadmap?.map((item, i) => (
            <div key={i} className="glass p-8 rounded-[2rem] border-l-4 border-l-indigo-500 relative overflow-hidden">
              <span className="text-4xl font-black text-white/5 absolute -right-4 -bottom-4">{item.year}</span>
              <h4 className="text-indigo-400 font-black uppercase text-xs mb-4">Phase: {item.year}</h4>
              <ul className="space-y-2">
                {item.milestones?.map((m, j) => <li key={j} className="text-lg font-bold text-gray-200 flex gap-3"><span className="text-indigo-500">•</span> {m}</li>)}
              </ul>
            </div>
          )) || <div className="glass p-8 rounded-[2rem] text-gray-500 italic">No roadmap data available for this sector.</div>}
        </div>

        <div className="space-y-8">
          <div className="glass p-8 rounded-[2rem]">
            <h4 className="text-indigo-400 font-black uppercase text-xs mb-6 tracking-widest">High-Demand Skills</h4>
            <div className="flex flex-wrap gap-2">
              {data?.highDemandSkills?.map(s => <span key={s} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-bold text-sm">{s}</span>) || <span className="text-gray-600 italic">No data</span>}
            </div>
          </div>
          <div className="glass p-8 rounded-[2rem]">
            <h4 className="text-indigo-400 font-black uppercase text-xs mb-6 tracking-widest">Local Certifications</h4>
            <ul className="space-y-4">
              {data?.localCerts?.map(c => <li key={c} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-sm font-bold text-gray-300">{c}</li>) || <li className="text-gray-600 italic">No certifications found</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerPathView;
