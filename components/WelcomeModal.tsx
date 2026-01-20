import React, { useEffect, useState } from 'react';


interface WelcomeModalProps {
    onStart: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStart }) => {
    const [show, setShow] = useState(false);


    useEffect(() => {
        // Small delay for entrance animation
        const timer = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0'}`}>

            <div className="relative w-full max-w-3xl glass p-12 rounded-[3.5rem] border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.3)] overflow-hidden">

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center text-center">

                    <div className="mb-8 p-4 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl animate-in zoom-in-50 duration-1000 delay-300">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                            HR Trainer
                        </h1>
                    </div>

                    <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.3em] mb-6 animate-in slide-in-from-bottom-8 duration-700 delay-500">
                        Neural Interview Intelligence
                    </p>

                    <div className="mb-10 animate-in slide-in-from-bottom-8 duration-700 delay-500">
                        <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 inline-flex">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            App updating data in real time
                        </span>
                    </div>

                    <div className="space-y-8 max-w-2xl">
                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 animate-in slide-in-from-bottom-12 duration-700 delay-700">
                            <p className="text-xl md:text-2xl font-medium text-gray-200 leading-relaxed font-light">
                                Designed by <span className="text-white font-black text-3xl md:text-4xl block my-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">Thanasis Athanasopoulos</span>
                            </p>
                            <p className="text-gray-400 mt-4 text-sm font-medium tracking-wide">
                                To empower candidates in the modern job market.
                            </p>
                        </div>

                        <p className="text-lg text-gray-300 leading-relaxed font-light animate-in slide-in-from-bottom-12 duration-700 delay-1000">
                            This application leverages <span className="text-indigo-400 font-bold">Gemini 3 Flash</span> to perform deep, real-time web searches. It uncovers the exact questions major corporations and smaller companies are asking <span className="italic text-white">right now</span>.
                        </p>

                        <p className="text-lg text-gray-300 leading-relaxed font-light animate-in slide-in-from-bottom-12 duration-700 delay-1200">
                            Master <span className="text-emerald-400 font-black text-2xl">40 to 80</span> of these questions, and your probability of impressing HR increases exponentially.
                        </p>
                    </div>

                    <button
                        onClick={onStart}
                        className="mt-12 px-16 py-6 bg-white text-black rounded-full font-black text-xl hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] animate-in fade-in zoom-in duration-700 delay-1000"
                    >
                        Start Training
                    </button>


                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
