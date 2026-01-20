
import React, { useState } from 'react';
import { InterviewQuestion } from '../types';
import { getGeminiClient } from '../services/geminiService';
import { Type } from '@google/genai';

interface EvaluationResult {
  score: number;
  feedback: string;
  improvements: string[];
  status: 'pass' | 'fail';
}

interface TrainingViewProps {
  question: InterviewQuestion;
  jobTitle: string;
  onBack: () => void;
  onComplete?: (status: 'pass' | 'fail') => void;
}

const TrainingView: React.FC<TrainingViewProps> = ({ question, jobTitle, onBack, onComplete }) => {
  const [userResponse, setUserResponse] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const ai = getGeminiClient();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Evaluate this interview response for the question: "${question.question}" for a ${jobTitle} role. 
        Response: "${userResponse}"
        
        Provide constructive feedback, a score out of 10, and 3 key improvements.
        CRITICAL: Also determine a 'status'. 
        - 'pass' if the answer is coherent, relevant, and demonstrates competence (status quo > 5/10).
        - 'fail' if the answer is irrelevant, too short, incorrect, or demonstrates lack of knowledge.`,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              feedback: { type: Type.STRING },
              score: { type: Type.INTEGER },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              status: { type: Type.STRING, enum: ["pass", "fail"] }
            },
            required: ["feedback", "score", "improvements", "status"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setEvaluation(result);

      if (result.status && onComplete) {
        onComplete(result.status as 'pass' | 'fail');
      }

    } catch (e) {
      console.error(e);
      setEvaluation({
        score: 0,
        feedback: 'Error analyzing response. Please check your connection and try again.',
        improvements: [],
        status: 'fail'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto glass p-10 rounded-[2.5rem] border border-white/10">
      <button onClick={onBack} className="text-indigo-400 font-medium mb-8 hover:underline">← Back</button>

      <div className="mb-8">
        <h3 className="text-indigo-400 font-black tracking-widest text-xs uppercase mb-2">PRACTICE QUESTION</h3>
        <p className="text-2xl font-bold">{question.question}</p>
      </div>

      {!evaluation ? (
        <div className="space-y-6">
          <textarea
            className="w-full h-64 bg-white/5 border border-white/10 rounded-3xl p-6 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
            placeholder="Type your elite response here..."
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || userResponse.length < 10}
            className="w-full py-4 accent-gradient rounded-2xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isAnalyzing ? 'Architecting Feedback...' : 'Analyze My Response'}
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black border-4 shadow-xl ${evaluation.score >= 5 ? 'border-green-500 text-green-400 bg-green-500/10 shadow-green-500/20' : 'border-red-500 text-red-400 bg-red-500/10 shadow-red-500/20'}`}>
              {evaluation.score}/10
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-1 ${evaluation.score >= 5 ? 'text-green-400' : 'text-red-400'}`}>
                {evaluation.score >= 8 ? 'Excellent Response' : evaluation.score >= 5 ? 'Good Effort' : 'Needs Improvement'}
              </h2>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${evaluation.score >= 5 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${evaluation.score * 10}%` }}></div>
              </div>
            </div>
          </div>

          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-gray-200 bg-white/5 p-8 rounded-3xl border border-white/5">
            <h3 className="text-indigo-400 font-bold text-sm uppercase tracking-widest mb-4">Analysis</h3>
            {evaluation.feedback}
          </div>

          {evaluation.improvements && evaluation.improvements.length > 0 && (
            <div className="bg-indigo-500/5 p-8 rounded-3xl border border-indigo-500/10">
              <h3 className="text-indigo-400 font-bold text-sm uppercase tracking-widest mb-4">Key Improvements</h3>
              <ul className="space-y-3">
                {evaluation.improvements.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-gray-300">
                    <span className="text-indigo-500 font-bold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => { setEvaluation(null); setUserResponse(''); }}
            className="w-full py-4 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/5 transition-all"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default TrainingView;
