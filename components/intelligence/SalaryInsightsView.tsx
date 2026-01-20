
import React, { useState, useEffect } from 'react';
import { SalaryData } from '../../types';
import { getSalaryIntelligence } from '../../services/geminiService';
import AriaBriefing from '../AriaBriefing';

const SalaryInsightsView: React.FC<{ jobTitle: string; location: string; onBack: () => void; cachedData?: SalaryData }> = ({ jobTitle, location, onBack, cachedData }) => {
  const [data, setData] = useState<SalaryData | null>(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    getSalaryIntelligence(jobTitle, location).then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [jobTitle, location, cachedData]);

  const safeRender = (val: any) => {
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (val === null || val === undefined) return '';
    return JSON.stringify(val);
  };

  if (loading) return <div className="animate-pulse flex flex-col items-center justify-center py-40"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">Scraping Local Salary Deltas...</p></div>;

  const briefingText = `Analyzing 2026 salary trends for ${location}. Median band: ${safeRender(data?.bands?.median) || 'TBD'}. COL adjustment: ${safeRender(data?.colAdjustment) || 'calculating'}.`;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <button onClick={onBack} className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4 hover:text-white transition-colors">← Terminal</button>
          <h2 className="text-5xl font-black">2026 Salary Intelligence</h2>
        </div>
        <AriaBriefing text={briefingText} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {['min', 'median', 'max'].map((type) => (
          <div key={type} className="glass p-10 rounded-[2.5rem] border border-white/5 text-center group hover:border-emerald-500/30 transition-all">
            <h4 className="text-[10px] font-black uppercase text-emerald-500/60 tracking-[0.3em] mb-4">{type} Band</h4>
            <p className="text-4xl font-black text-white group-hover:scale-110 transition-transform">
              {safeRender((data?.bands as any)?.[type]) || 'N/A'}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass p-10 rounded-[2.5rem] border border-white/5">
          <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] mb-6">Bonus Structure</h4>
          <p className="text-xl font-bold leading-relaxed text-gray-300">{safeRender(data?.bonusStructure) || 'Analyzing performance incentives...'}</p>
        </div>
        <div className="glass p-10 rounded-[2.5rem] border border-white/5">
          <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] mb-6">COL Adjustment</h4>
          <p className="text-xl font-bold leading-relaxed text-gray-300">{safeRender(data?.colAdjustment) || 'Synthesizing living standards...'}</p>
        </div>
        <div className="glass p-10 rounded-[2.5rem] border border-white/5 bg-emerald-500/5">
          <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] mb-6">Equity & RSUs</h4>
          <p className="text-xl font-bold leading-relaxed text-gray-300">{safeRender(data?.equityInsights) || 'Calculating vesting logic...'}</p>
        </div>
      </div>
    </div>
  );
};

export default SalaryInsightsView;
