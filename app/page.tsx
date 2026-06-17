'use client';
import { useState } from 'react';
// Importing our secure server action
import { getQuizFromGemini } from './actions';

export default function QuizKroApp() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  const handleGenerateQuestion = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setCurrentQuestion(null); 
    setSelectedOption(null);
    setIsAnswered(false);

    try {
      // Calling the imported secure server side logic
      const parsedQuiz = await getQuizFromGemini(topic, askedQuestions);
      setCurrentQuestion(parsedQuiz);
      setAskedQuestions(prev => [...prev, parsedQuiz.question]);
    } catch (error) {
      console.error("Quiz Component Error:", error);
      alert("Failed to generate question. Please try clicking generate again!");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const handleClearTopic = () => {
    setTopic('');
    setCurrentQuestion(null);
    setSelectedOption(null);
    setIsAnswered(false);
    setAskedQuestions([]);
  };

  return (
    <main className="min-h-screen bg-[#060913] text-slate-100 font-sans p-4 sm:p-8 flex flex-col items-center justify-center">
      
      {/* Branding Header Area */}
      <div className="w-full max-w-xl text-center mb-8">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          QuizKro AI 🧠
        </h1>
        <p className="text-xs text-slate-400 mt-2 font-medium">
          Enter any topic and generate infinite customized questions instantly!
        </p>
      </div>

      <div className="w-full max-w-xl flex flex-col gap-5">
        
        {/* Topic Input Component */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">🎯 Target Topic:</label>
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center">
              <input 
                type="text"
                placeholder="e.g., Sikh History, DSA Trees, React Hooks, UPSC"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 px-4 pr-14 text-sm text-slate-200 focus:outline-none transition-colors"
              />
              {topic && (
                <button 
                  onClick={handleClearTopic}
                  className="absolute right-3 text-slate-400 hover:text-slate-200 font-bold text-[11px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            
            <button
              onClick={handleGenerateQuestion}
              disabled={loading || !topic.trim()}
              className="py-3 px-5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-all active:scale-98 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-md"
            >
              {loading ? 'Thinking...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Smooth Pulse Loader Component */}
        {loading && (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="w-10 h-10 border-4 border-t-indigo-500 border-indigo-500/20 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-400">Crafting your unique question...</p>
          </div>
        )}

        {/* Dynamic Quiz Card */}
        {currentQuestion && !loading && (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl flex flex-col gap-4 transition-all">
            
            {/* Question Text */}
            <div className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
              ❓ {currentQuestion.question}
            </div>

            {/* Interactive Options list */}
            <div className="grid grid-cols-1 gap-2.5 mt-1">
              {currentQuestion.options.map((option: string, idx: number) => {
                let btnStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";
                
                if (isAnswered) {
                  if (idx === currentQuestion.correctIndex) {
                    btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold";
                  } else if (idx === selectedOption) {
                    btnStyle = "bg-rose-500/10 border-rose-500 text-rose-400 line-through";
                  } else {
                    btnStyle = "bg-slate-950/20 border-slate-900 text-slate-600 pointer-events-none";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 rounded-xl text-sm border font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswered && idx === currentQuestion.correctIndex && <span className="text-emerald-400">✅</span>}
                    {isAnswered && idx === selectedOption && idx !== currentQuestion.correctIndex && <span className="text-rose-400">❌</span>}
                  </button>
                );
              })}
            </div>

            {/* Evaluation and Reason Segment */}
            {isAnswered && (
              <div className="mt-2 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs sm:text-sm">
                <div className="font-bold text-sm mb-1.5">
                  {selectedOption === currentQuestion.correctIndex ? (
                    <span className="text-emerald-400">🎉 Excellent! Correct Answer.</span>
                  ) : (
                    <span className="text-rose-400">😢 Oops! That's incorrect.</span>
                  )}
                </div>
                <p className="text-slate-400 leading-relaxed font-medium">
                  <strong className="text-slate-300">Reason:</strong> {currentQuestion.reason}
                </p>

                <button
                  onClick={handleGenerateQuestion}
                  disabled={loading}
                  className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer"
                >
                  {loading ? 'Generating next...' : `⏭️ Next Question on "${topic}"`}
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Brand Customized Footer */}
      <footer className="mt-12 text-[12px] text-slate-500 font-medium tracking-wide flex items-center gap-1">
        <span>Product built by</span>
        <a 
          href="https://instagram.com/techxpanjab" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline decoration-indigo-500/30 underline-offset-4"
        >
          @techxpanjab
        </a>
      </footer>

    </main>
  );
}