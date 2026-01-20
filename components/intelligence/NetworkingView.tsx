
import React, { useState, useEffect } from 'react';
import { NetworkingData } from '../../types';
import { getNetworkingIntelligence } from '../../services/geminiService';
import AriaBriefing from '../AriaBriefing';

const NetworkingView: React.FC<{ jobTitle: string; location: string; onBack: () => void; cachedData?: NetworkingData }> = ({ jobTitle, location, onBack, cachedData }) => {
  const [data, setData] = useState<NetworkingData | null>(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    getNetworkingIntelligence(jobTitle, location).then(res => {
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

  if (loading) return <div className="animate-pulse flex flex-col items-center justify-center py-40"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest">Mapping Local Hubs...</p></div>;

  const briefingText = `Mapping elite networks in ${location}. Focus on these tech hubs and conferences. I've also prepared professional scripts for your regional market.`;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <button onClick={onBack} className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-4 hover:text-white transition-colors">← Terminal</button>
          <h2 className="text-5xl font-black">Elite Networking Map</h2>
        </div>
        <AriaBriefing text={briefingText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="glass p-10 rounded-[2.5rem]">
            <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-6">2026 Tech Hubs</h4>
            <div className="grid grid-cols-1 gap-4">
              {data?.hubs && Array.isArray(data.hubs) && data.hubs.length > 0 ? (
                data.hubs.map((hub, idx) => (
                  <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/5 font-bold text-gray-200">
                    {safeRender(hub)}
                  </div>
                ))
              ) : (
                <div className="text-gray-600 italic p-6">Analyzing localized tech centers...</div>
              )}
            </div>
          </div>
          <div className="glass p-10 rounded-[2.5rem]">
            <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-6">Conferences & Meetups</h4>
            <div className="grid grid-cols-1 gap-4">
              {data?.conferences && Array.isArray(data.conferences) && data.conferences.length > 0 ? (
                data.conferences.map((conf, idx) => (
                  <div key={idx} className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 font-black text-indigo-200">
                    {safeRender(conf)}
                  </div>
                ))
              ) : (
                <div className="text-gray-600 italic p-6">Querying event schedules...</div>
              )}
            </div>
          </div>
        </section>

        <section className="glass p-10 rounded-[2.5rem] border border-white/5">
          <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-8">Networking Scripts</h4>
          <div className="space-y-6">
            {data?.scripts && Array.isArray(data.scripts) && data.scripts.length > 0 ? (
              data.scripts.map((script, idx) => (
                <div key={idx} className="bg-[#111] p-8 rounded-3xl border border-white/5 relative group">
                  <span className="text-[10px] font-black text-white/10 absolute top-4 right-4">{safeRender(script.platform)}</span>
                  <p className="text-gray-300 font-medium italic leading-relaxed">"{safeRender(script.content)}"</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(String(script.content))}
                    className="mt-6 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Copy Script
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-600 italic p-8">Generating etiquette-aware scripts...</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default NetworkingView;
