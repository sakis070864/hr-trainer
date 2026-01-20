import React, { useState } from 'react';

interface HelpModalProps {
    onClose: () => void;
}

const steps = [
    {
        title: "Localized Grounding",
        text: "Start your journey with our neural search engine. Specify your target role and territory to access locally relevant intelligence.",
        image: "/screenshots/picture_1.png"
    },
    {
        title: "Neural Analysis",
        text: "Watch as the system aggregates real-time market data. We parse thousands of data points to construct a live interview landscape.",
        image: "/screenshots/picture_2.png"
    },
    {
        title: "Intelligence Library",
        text: "Explore a curated grid of high-probability interview questions. Each card represents a confirmed trend in your target market.",
        image: "/screenshots/picture_3.png"
    },
    {
        title: "Three-Tier Practice",
        text: "Choose your mode directly from the card. Select Masterclass to learn, Training to write, or the Microphone icon for live Simulation.",
        image: "/screenshots/picture_4.png"
    },
    {
        title: "Masterclass Mode",
        text: "Unlock executive-level insights. Study the 'Why', 'What', and 'How' of every question to understand recruiter psychology.",
        image: "/screenshots/picture_5.png"
    },
    {
        title: "AI Training Lab",
        text: "Enter the simulator. Type your best response in a distraction-free environment designed to mimic written assessments.",
        image: "/screenshots/picture_6.png"
    },
    {
        title: "Forensic Scoring",
        text: "Get instant, brutal feedback. Our AI grades you out of 10 and provides a structured teardown of your answer.",
        image: "/screenshots/picture_7.png"
    },
    {
        title: "Visual Validation",
        text: "Track your status. A neon Blue 'V' appears on cards you've mastered, while a Red 'X' indicates answers that failed the quality check.",
        image: "/screenshots/picture_8.png"
    },
    {
        title: "Voice Initiation",
        text: "Go hands-free. Launch the voice interface to practice verbal delivery and timing before facing a real human.",
        image: "/screenshots/picture_9.png"
    },
    {
        title: "Live Simulation",
        text: "The Coach is listening. Engage in a real-time, interruptible conversation. The AI reacts to your tone and content instantly.",
        image: "/screenshots/picture_10.png"
    },
    {
        title: "Precision Filtering",
        text: "Isolate your weaknesses. Use the top filters to focus specifically on Technical, Behavioral, or Cultural questions.",
        image: "/screenshots/picture_11.png"
    },
    {
        title: "Strategic Intelligence",
        text: "Go beyond the interview. Access Career Paths, Salary Intelligence, and Elite Networking hubs from the main dashboard.",
        image: "/screenshots/picture_12.png"
    }
];

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-[#0d0d0d] border border-white/10 w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300">

                {/* Image Section */}
                <div className="w-full md:w-1/2 bg-[#050505] p-8 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-white/5">
                    <img
                        src={steps[currentStep].image}
                        alt={steps[currentStep].title}
                        className="rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.15)] max-h-[300px] object-contain transition-all duration-300 transform hover:scale-105"
                    />
                    {/* Pagination Dots (Mobile) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 md:hidden">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-colors ${idx === currentStep ? 'bg-indigo-500' : 'bg-white/20'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content Section */}
                <div className="w-full md:w-1/2 p-10 flex flex-col justify-between bg-gradient-to-br from-[#0d0d0d] to-[#131313]">
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-xs font-black tracking-[0.2em] text-indigo-500 uppercase">
                                Tutorial {currentStep + 1}/{steps.length}
                            </span>
                            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-4 animate-in slide-in-from-right-4 duration-300 key={currentStep}">
                            {steps[currentStep].title}
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed animate-in slide-in-from-right-8 duration-300 delay-75 key={currentStep + 'text'}">
                            {steps[currentStep].text}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-12">
                        <button
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className={`text-sm font-bold uppercase tracking-widest transition-colors ${currentStep === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                        >
                            Previous
                        </button>

                        {/* Pagination Dots (Desktop) */}
                        <div className="hidden md:flex gap-2">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-indigo-500' : 'bg-white/20'}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
                        >
                            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                            {currentStep < steps.length - 1 && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
