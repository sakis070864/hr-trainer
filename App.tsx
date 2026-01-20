import React, { useState, useMemo, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { AppState, ViewMode, InterviewQuestion } from './types';
import { searchInterviewQuestions, getCareerPathIntelligence, getSalaryIntelligence, getNetworkingIntelligence, batchFetchMasterclasses } from './services/geminiService';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import MasterclassView from './components/MasterclassView';
import SimulationView from './components/SimulationView';
import TrainingView from './components/TrainingView';
import CareerPathView from './components/intelligence/CareerPathView';
import SalaryInsightsView from './components/intelligence/SalaryInsightsView';
import NetworkingView from './components/intelligence/NetworkingView';
import Footer from './components/Footer';
import HelpModal from './components/HelpModal';
import WelcomeModal from './components/WelcomeModal';

const NUM_INITIAL_QUESTIONS = 20;
const LOAD_MORE_STATUSES = ['Fetching Data...', 'Grounding Results...', 'Mapping Library...', 'Syncing Analysis...', 'Indexing Insights...'];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    jobTitle: '',
    location: '',
    questions: [],
    isSearching: false,
    isLoadingMore: false,
    searchProgress: 0,
    progressStatus: 'INITIALIZING',
    error: null,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('SEARCH');
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // States for Load More dynamic feedback
  const [loadMoreStatusIndex, setLoadMoreStatusIndex] = useState(0);
  const [loadMoreProgress, setLoadMoreProgress] = useState(0);

  // Neural status cycle for Load More button
  useEffect(() => {
    if (!state.isLoadingMore) {
      const timeout = setTimeout(() => {
        setLoadMoreStatusIndex(0);
        setLoadMoreProgress(0);
      }, 800);
      return () => clearTimeout(timeout);
    }

    const statusInterval = setInterval(() => {
      setLoadMoreStatusIndex(prev => (prev + 1) % LOAD_MORE_STATUSES.length);
    }, 450);

    const progressInterval = setInterval(() => {
      setLoadMoreProgress(prev => {
        if (prev >= 90) return prev + (Math.random() * 0.02);
        const remaining = 90 - prev;
        const inc = Math.max(0.1, Math.random() * (remaining * 0.08));
        return prev + inc;
      });
    }, 150);

    return () => {
      clearInterval(statusInterval);
      clearInterval(progressInterval);
    };
  }, [state.isLoadingMore]);

  // Restored Filter & Search logic
  const filteredQuestions = useMemo(() => {
    return state.questions.filter(q => {
      const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterCategory === 'All' || q.category === filterCategory;
      return matchesSearch && matchesFilter;
    });
  }, [state.questions, searchQuery, filterCategory]);

  const handleKeySelection = async () => {
    try {
      // @ts-ignore
      if (window.aistudio?.openSelectKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setState(prev => ({ ...prev, error: null }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (jobTitle: string, location: string) => {
    setState(prev => ({
      ...prev,
      jobTitle,
      location,
      isSearching: true,
      isLoadingMore: false,
      searchProgress: 10,
      progressStatus: 'ESTABLISHING NEURAL LINK WITH GEMINI 3 FLASH...',
      scanningSource: 'ESTABLISHING_SECURE_HANDSHAKE...',
      error: null,
      careerPathData: undefined,
      salaryData: undefined,
      networkingData: undefined,
      masterclassCache: undefined
    }));

    try {
      // Step 1: Get Questions first
      const questions = await searchInterviewQuestions(jobTitle, location, NUM_INITIAL_QUESTIONS, 0);

      setState(prev => ({
        ...prev,
        searchProgress: 30,
        progressStatus: 'AUTHENTICATING WITH GLOBAL HR-GRID...',
        scanningSource: 'TARGETING: reddit.com, teamblind.com, wallstreetoasis.com'
      }));

      // Step 2: Parallel Execution
      let completedSteps = 0;
      const totalSteps = 4; // Career, Salary, Networking, Masterclasses

      const updateProgress = (label: string, source: string) => {
        completedSteps++;
        const baseProgress = 30;
        const remainingScope = 70;
        const newProgress = baseProgress + ((completedSteps / totalSteps) * remainingScope);

        setState(prev => ({
          ...prev,
          searchProgress: Math.min(newProgress, 95),
          progressStatus: label,
          scanningSource: source
        }));
      };

      const [intelligence, masterclassCache] = await Promise.all([
        Promise.all([
          getCareerPathIntelligence(jobTitle, location).then(data => {
            updateProgress('DOWNLOADING REAL-TIME HR MARKET INTELLIGENCE...', 'PARSING: Bureau of Labor Statistics, LinkedIn Trends');
            return data;
          }),
          getSalaryIntelligence(jobTitle, location).then(data => {
            updateProgress('PARSING REDDIT & BLIND FOR INSIDER LEAKS...', 'ACCESSING: levels.fyi API, Glassdoor, Pave');
            return data;
          }),
          getNetworkingIntelligence(jobTitle, location).then(data => {
            updateProgress('INITIATING DEEP-WEB RECONNAISSANCE...', 'SCANNING: Meetup.com, Eventbrite, Local Chambers');
            return data;
          })
        ]).then(([careerPath, salary, networking]) => ({ careerPath, salary, networking })),

        batchFetchMasterclasses(questions, jobTitle, location).then(data => {
          updateProgress('COMPILING EXECUTIVE BRIEFING...', 'COMPILING: Executive Coaching Protocols, HBR Case Studies');
          return data;
        })
      ]);

      setState(prev => ({
        ...prev,
        questions,
        isSearching: false,
        searchProgress: 100,
        progressStatus: 'COMPLETE',
        careerPathData: intelligence.careerPath,
        salaryData: intelligence.salary,
        networkingData: intelligence.networking,
        masterclassCache
      }));

      setTimeout(() => setViewMode('RESULTS'), 500);
    } catch (err: any) {
      let msg = 'Grounding collision. Please retry.';
      if (err.message === 'RATE_LIMIT_EXCEEDED') msg = 'Quota exhausted. Use a personal key.';
      setState(prev => ({ ...prev, isSearching: false, error: msg }));
      setViewMode(state.questions.length > 0 ? 'RESULTS' : 'SEARCH');
    }
  };

  const handleLoadMore = async () => {
    if (state.isLoadingMore) return;

    setState(prev => ({ ...prev, isLoadingMore: true, error: null }));
    setLoadMoreProgress(10);

    try {
      const existingTexts = state.questions.map(q => q.question);
      const moreResults = await searchInterviewQuestions(
        state.jobTitle,
        state.location,
        20,
        state.questions.length,
        existingTexts
      );

      setLoadMoreProgress(100);

      setTimeout(() => {
        setState(prev => {
          const currentSet = new Set(prev.questions.map(q => q.question.trim().toLowerCase()));
          const uniqueMoreResults = moreResults.filter(q => !currentSet.has(q.question.trim().toLowerCase()));

          // SHADOW SYNC: Trigger background fetch for the new unique questions
          if (uniqueMoreResults.length > 0) {
            batchFetchMasterclasses(uniqueMoreResults, state.jobTitle, state.location).then(newCache => {
              setState(currentState => ({
                ...currentState,
                masterclassCache: { ...currentState.masterclassCache, ...newCache }
              }));
            });
          }

          return {
            ...prev,
            questions: [...prev.questions, ...uniqueMoreResults],
            isLoadingMore: false
          };
        });
      }, 500);
    } catch (err: any) {
      let msg = 'Failed to load more questions.';
      if (err.message === 'RATE_LIMIT_EXCEEDED') msg = 'Quota exhausted. Use a personal key.';
      setState(prev => ({ ...prev, isLoadingMore: false, error: msg }));
    }
  };

  const handleUpdateQuestionStatus = (id: string, status: 'pass' | 'fail') => {
    setState(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, status } : q)
    }));
  };

  const reset = () => {
    setViewMode('SEARCH');
    setState(prev => ({ ...prev, questions: [], searchProgress: 0, error: null, isLoadingMore: false }));
    setFilterCategory('All');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505]">
      <Header
        onReset={reset}
        onViewChange={(mode) => setViewMode(mode)}
        onHelp={() => setShowHelp(true)}
        currentView={viewMode}
        locationActive={!!state.location}
      />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 mt-12">
        {viewMode === 'SEARCH' && !state.isSearching && (
          <div className="flex flex-col items-center justify-center min-h-[65vh] text-center">
            <h1 className="text-7xl font-black mb-6 tracking-tight">
              <span className="text-gradient">HR Trainer</span>
            </h1>
            <p className="text-gray-500 max-w-xl mb-12 text-xl leading-relaxed">
              Localized Grounding across 52 territories. Neural intelligence for the competitive 2026 economy.
            </p>
            <SearchForm onSearch={handleSearch} disabled={state.isSearching} />
          </div>
        )}

        {state.isSearching && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <ProgressBar progress={state.searchProgress} statusLabel={state.progressStatus} scanningSource={state.scanningSource} />
          </div>
        )}

        {viewMode === 'RESULTS' && (
          <div className="space-y-12 pb-20">
            {/* Control Center */}
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-5xl font-black text-white">{state.jobTitle}</h2>
                  <p className="text-gray-500 text-lg uppercase tracking-widest font-bold flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    {state.location}
                  </p>
                </div>

                <button onClick={reset} className="px-10 py-4 bg-white rounded-2xl text-black font-black text-sm hover:bg-gray-200 transition-all whitespace-nowrap shadow-xl hover:scale-105 active:scale-95">
                  New Analysis
                </button>
              </div>

              {/* Filtering Bar */}
              <div className="glass p-4 rounded-[2rem] flex flex-col lg:flex-row gap-4 items-center border border-white/5">
                <div className="relative flex-grow w-full">
                  <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder="Search library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all text-white"
                  />
                </div>

                <div className="flex gap-4 w-full lg:w-auto shrink-0">
                  <div className="relative flex-grow">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="appearance-none w-full lg:w-64 px-8 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-gray-300 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer hover:bg-white/10 uppercase tracking-widest"
                    >
                      <option value="All" className="bg-[#0a0a0a]">All Intelligence</option>
                      <option value="Technical" className="bg-[#0a0a0a]">Technical Focus</option>
                      <option value="Behavioral" className="bg-[#0a0a0a]">Behavioral Skills</option>
                      <option value="Case Study" className="bg-[#0a0a0a]">Case Analysis</option>
                      <option value="Cultural" className="bg-[#0a0a0a]">Cultural Quotient</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 px-6 py-3.5 rounded-2xl flex items-center justify-center min-w-[120px]">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      {filteredQuestions.length} Matches
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredQuestions.map(q => (
                <QuestionCard
                  key={q.id}
                  data={q}
                  onMasterclass={() => { setSelectedQuestion(q); setViewMode('MASTERCLASS'); }}
                  onTraining={() => { setSelectedQuestion(q); setViewMode('TRAINING'); }}
                  onSimulation={() => { setSelectedQuestion(q); setViewMode('SIMULATION'); }}
                />
              ))}
              {filteredQuestions.length === 0 && (
                <div className="col-span-full py-24 text-center border border-dashed border-white/5 rounded-[3rem]">
                  <p className="text-gray-600 font-bold text-xl mb-2">No matching intelligence found.</p>
                  <p className="text-gray-800 text-sm uppercase font-black tracking-widest">Adjust filters or search criteria</p>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-24 pb-12">
              <button
                onClick={handleLoadMore}
                disabled={state.isLoadingMore}
                className={`group flex flex-col items-center gap-4 transition-all ${state.isLoadingMore ? 'cursor-wait opacity-100' : 'active:scale-95'}`}
              >
                <div className={`text-sm font-bold transition-all duration-300 ${state.isLoadingMore ? 'text-indigo-400 animate-pulse' : 'text-indigo-500/60 group-hover:text-indigo-400'}`}>
                  {state.isLoadingMore ? LOAD_MORE_STATUSES[loadMoreStatusIndex] : 'Open 20 More Questions'}
                </div>

                <div className="relative w-56 h-px bg-white/5 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-400 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    style={{
                      width: `${loadMoreProgress}%`,
                      opacity: state.isLoadingMore || loadMoreProgress > 0 ? 1 : 0
                    }}
                  ></div>

                  {state.isLoadingMore && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                      <div className="absolute top-0 h-full w-24 bg-gradient-to-r from-transparent via-indigo-300/30 to-transparent animate-velocity" />
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {viewMode === 'CAREER_PATH' && <CareerPathView jobTitle={state.jobTitle} location={state.location} onBack={() => setViewMode('RESULTS')} cachedData={state.careerPathData} />}
        {viewMode === 'SALARY_INSIGHTS' && <SalaryInsightsView jobTitle={state.jobTitle} location={state.location} onBack={() => setViewMode('RESULTS')} cachedData={state.salaryData} />}
        {viewMode === 'NETWORKING' && <NetworkingView jobTitle={state.jobTitle} location={state.location} onBack={() => setViewMode('RESULTS')} cachedData={state.networkingData} />}

        {viewMode === 'MASTERCLASS' && selectedQuestion && <MasterclassView question={selectedQuestion} jobTitle={state.jobTitle} location={state.location} onBack={() => setViewMode('RESULTS')} cachedData={state.masterclassCache?.[selectedQuestion.id]} />}
        {viewMode === 'TRAINING' && selectedQuestion && <TrainingView question={selectedQuestion} jobTitle={state.jobTitle} onBack={() => setViewMode('RESULTS')} onComplete={(status) => handleUpdateQuestionStatus(selectedQuestion.id, status)} />}
        {viewMode === 'SIMULATION' && selectedQuestion && <SimulationView question={selectedQuestion} jobTitle={state.jobTitle} onBack={() => setViewMode('RESULTS')} />}
      </main>

      <Footer />

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showWelcome && <WelcomeModal onStart={() => setShowWelcome(false)} />}

      {(state.error || (state.isLoadingMore && state.error)) && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-5 bg-red-950/80 border border-red-500/30 rounded-3xl text-white backdrop-blur-2xl flex items-center gap-6 z-[100] animate-in slide-in-from-bottom-4 shadow-2xl">
          <span className="font-bold text-sm italic">{state.error}</span>
          <button onClick={handleKeySelection} className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase">Link Project</button>
        </div>
      )}
      <Analytics />
    </div>
  );
};

export default App;
