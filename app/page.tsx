'use client';
import { useState } from 'react';
import { getQuizFromGemini } from './actions';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  reason: string;
}

export default function QuizKroApp() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Assembling 5 customized evaluation cards...');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number | null }>({});
  const [answeredStates, setAnsweredStates] = useState<{ [key: number]: boolean }>({});

  const triggerDualConfetti = async () => {
    try {
      if (!(window as any).confetti) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Confetti script load failed'));
          document.body.appendChild(script);
        });
      }

      const confetti = (window as any).confetti;
      if (confetti) {
        confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.9 } });
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.9 } });
      }
    } catch (err) {
      console.error("Confetti script inject failure:", err);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setLoadingStatus('Assembling 5 customized evaluation cards...');
    setQuestions([]); 
    setCurrentIndex(0);
    setSelectedAnswers({});
    setAnsweredStates({});

    // ⏳ Trigger an informative status update if the server hits a high-demand retry delay
    const statusTimer = setTimeout(() => {
      setLoadingStatus('AI is experiencing high traffic demand right now. Hanging tight and retrying for you...');
    }, 3500);

    try {
      const parsedData = await getQuizFromGemini(topic, askedQuestions);
      
      if (parsedData && parsedData.error) {
        alert(`Notice: ${parsedData.error}`);
        setLoading(false);
        clearTimeout(statusTimer);
        return;
      }

      if (parsedData && parsedData.quiz) {
        setQuestions(parsedData.quiz);
        const incomingTitles = parsedData.quiz.map((q: Question) => q.question);
        setAskedQuestions(prev => [...prev, ...incomingTitles]);
      }
    } catch (error) {
      console.error("Quiz Fetch Error:", error);
      alert("The system timed out. Please check your network and try again!");
    } finally {
      clearTimeout(statusTimer);
      setLoading(false);
    }
  };

  const handleOptionClick = (optionIdx: number) => {
    if (answeredStates[currentIndex]) return;

    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionIdx }));
    setAnsweredStates(prev => ({ ...prev, [currentIndex]: true }));

    const currentQuestion = questions[currentIndex];
    if (optionIdx === currentQuestion.correctIndex) {
      triggerDualConfetti();
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleClearTopic = () => {
    setTopic('');
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setAnsweredStates({});
    setAskedQuestions([]);
  };

  const currentQuestion = questions[currentIndex];
  const isCurrentAnswered = answeredStates[currentIndex] || false;
  const selectedOption = selectedAnswers[currentIndex] ?? null;

  return (
    <main className="min-h-screen bg-[#060913] text-slate-100 font-sans p-4 md:p-10 flex flex-col items-center justify-center">
      
      {/* Header Branding */}
      <div className="w-full max-w-xl text-center mb-8">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          QuizKro AI 🧠
        </h1>
        <p className="text-xs text-slate-400 mt-2 font-medium">
          Enter any topic to instantly generate an intelligent 5-question module.
        </p>
      </div>

      <div className="w-full max-w-xl flex flex-col gap-6">
        
        {/* Main Input Console */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">🎯 Target Subject Topic:</label>
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center">
              <input 
                type="text"
                placeholder="e.g., Sikh History, NextJS API routes, Java Streams"
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
              onClick={handleGenerateQuiz}
              disabled={loading || !topic.trim()}
              className="py-3 px-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-all active:scale-98 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-md min-w-[120px]"
            >
              {loading ? 'Compiling...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Dynamic Contextual Loader State */}
        {loading && (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-10 shadow-xl flex flex-col items-center justify-center text-center gap-4 animate-pulse">
            <div className="w-10 h-10 border-4 border-t-indigo-500 border-indigo-500/20 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed tracking-wide transition-all duration-300">
              {loadingStatus}
            </p>
          </div>
        )}

        {/* Premium Single-Card Presentation View */}
        {questions.length > 0 && !loading && currentQuestion && (
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-6 shadow-xl flex flex-col gap-4 transition-all duration-300">
            
            {/* Top Indicator Metrics */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-[11px] font-extrabold uppercase bg-slate-950 px-3 py-1 rounded-md text-indigo-400 border border-slate-800">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-slate-500 font-semibold italic">
                Active Topic: "{topic}"
              </span>
            </div>

            {/* Main Single Question Text */}
            <h3 className="text-base md:text-lg font-bold text-slate-100 leading-snug mt-1">
              ❓ {currentQuestion.question}
            </h3>

            {/* Option Mapping */}
            <div className="flex flex-col gap-2.5 mt-2">
              {currentQuestion.options.map((option, oIdx) => {
                let optionStyle = "bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700";

                if (isCurrentAnswered) {
                  if (oIdx === currentQuestion.correctIndex) {
                    optionStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-md shadow-emerald-500/5";
                  } else if (oIdx === selectedOption) {
                    optionStyle = "bg-rose-500/10 border-rose-500 text-rose-400 line-through";
                  } else {
                    optionStyle = "bg-slate-950/20 border-slate-900 text-slate-600 pointer-events-none";
                  }
                }

                return (
                  <button
                    key={oIdx}
                    disabled={isCurrentAnswered}
                    onClick={() => handleOptionClick(oIdx)}
                    className={`w-full text-left p-4 rounded-xl text-xs sm:text-sm border font-medium transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <span>{option}</span>
                    {isCurrentAnswered && oIdx === currentQuestion.correctIndex && <span className="text-emerald-400 text-sm">✅</span>}
                    {isCurrentAnswered && oIdx === selectedOption && oIdx !== currentQuestion.correctIndex && <span className="text-rose-400 text-sm">❌</span>}
                  </button>
                );
              })}
            </div>

            {/* Bottom Panel */}
            {isCurrentAnswered && (
              <div className="mt-2 p-4 rounded-2xl bg-slate-950 border border-slate-800/60 text-xs sm:text-sm flex flex-col gap-4 animate-fadeIn">
                <div>
                  <div className="font-bold mb-1">
                    {selectedOption === currentQuestion.correctIndex ? (
                      <span className="text-emerald-400">🎉 Brilliant! Correct Answer.</span>
                    ) : (
                      <span className="text-rose-400">😢 Oops! That's incorrect.</span>
                    )}
                  </div>
                  <p className="text-slate-400 leading-relaxed font-medium text-xs sm:text-sm">
                    <strong className="text-slate-300">Reason:</strong> {currentQuestion.reason}
                  </p>
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Next Question</span> 
                    <span>⏭️</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 mt-1 animate-fadeIn">
                    <div className="w-full text-center py-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs sm:text-sm">
                      🏁 Quiz Module Completed successfully!
                    </div>
                    
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/10 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>🔄 Generate More Questions on "{topic}"</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
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