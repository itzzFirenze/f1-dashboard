import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
   Trophy,
   Zap,
   Flame,
   CheckCircle2,
   XCircle,
   RotateCcw,
   Award,
   Timer,
   HelpCircle,
   Radio,
   Compass,
   Users,
   Wrench,
   Sparkles,
   Play,
   ArrowRight,
   AlertCircle,
   LogOut,
} from 'lucide-react';
import { triviaService } from '../services/triviaService';
import { TriviaQuestion, TriviaCategory, TriviaGameMode } from '../types';

const CATEGORIES: { id: TriviaCategory; label: string; icon: any; color: string }[] = [
   { id: 'all', label: 'All Topics', icon: Sparkles, color: 'from-f1-red to-orange-500' },
   { id: 'drivers', label: 'Drivers', icon: Users, color: 'from-blue-500 to-indigo-600' },
   { id: 'teams', label: 'Teams', icon: Wrench, color: 'from-amber-500 to-red-500' },
   { id: 'circuits', label: 'Circuits', icon: Compass, color: 'from-emerald-500 to-teal-600' },
   { id: 'team_radio', label: 'Team Radio', icon: Radio, color: 'from-purple-500 to-pink-500' },
   { id: 'championships', label: 'Championships', icon: Trophy, color: 'from-yellow-400 to-amber-600' },
   { id: 'pit_stops', label: 'Pit Stops', icon: Timer, color: 'from-cyan-500 to-blue-600' },
   { id: 'tyres', label: 'Tyres', icon: Zap, color: 'from-rose-500 to-red-600' },
   { id: 'race_results', label: 'Race Results', icon: Award, color: 'from-green-500 to-emerald-700' },
   { id: 'records', label: 'Records', icon: Flame, color: 'from-orange-500 to-amber-600' },
   { id: 'historical', label: 'Historical', icon: HelpCircle, color: 'from-slate-400 to-zinc-600' },
   { id: 'rules', label: 'Rules & Regs', icon: AlertCircle, color: 'from-sky-400 to-blue-700' },
];

const QUESTION_TIMER_SECONDS = 20;

// Fisher-Yates shuffle — returns a new shuffled copy
function shuffleArray<T>(arr: T[]): T[] {
   const shuffled = [...arr];
   for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
   }
   return shuffled;
}

const TriviaPage: React.FC = () => {
   // Game configuration state
   const [selectedCategory, setSelectedCategory] = useState<TriviaCategory>('all');
   const [gameMode, setGameMode] = useState<TriviaGameMode>('sprint');
   const [enableTimer, setEnableTimer] = useState<boolean>(true);
   const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

   // Active game state
   const [gameState, setGameState] = useState<'lobby' | 'starting' | 'playing' | 'finished'>('lobby');
   const [startLightCount, setStartLightCount] = useState<number>(0);
   const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
   const [currentIndex, setCurrentIndex] = useState<number>(0);
   const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
   const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
   const [score, setScore] = useState<number>(0);
   const [streak, setStreak] = useState<number>(0);
   const [bestStreak, setBestStreak] = useState<number>(0);
   const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIMER_SECONDS);
   const [loading, setLoading] = useState<boolean>(false);
   const [fetchError, setFetchError] = useState<string | null>(null);
   const [userAnswers, setUserAnswers] = useState<{ question: TriviaQuestion; selected: string; correct: boolean }[]>([]);

   // High score from local storage
   const [highScore, setHighScore] = useState<number>(() => {
      return Number(localStorage.getItem('f1_trivia_high_score') || 0);
   });

   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

   const currentQuestion = questions[currentIndex];

   // Shuffle options randomly per question so the correct answer isn't always the same letter
   const shuffledOptions = useMemo(() => {
      if (!currentQuestion) return [];
      return shuffleArray(currentQuestion.options);
   }, [currentQuestion?.id ?? currentIndex, currentIndex]);

   // Keyboard listeners
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (gameState !== 'playing') return;

         if (isAnswerSubmitted) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
               e.preventDefault();
               handleNextQuestion();
            }
         } else if (shuffledOptions.length > 0) {
            if (e.key === '1' || e.key.toLowerCase() === 'a') {
               if (shuffledOptions[0]) handleSelectOption(shuffledOptions[0]);
            } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
               if (shuffledOptions[1]) handleSelectOption(shuffledOptions[1]);
            } else if (e.key === '3' || e.key.toLowerCase() === 'c') {
               if (shuffledOptions[2]) handleSelectOption(shuffledOptions[2]);
            } else if (e.key === '4' || e.key.toLowerCase() === 'd') {
               if (shuffledOptions[3]) handleSelectOption(shuffledOptions[3]);
            }
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [gameState, isAnswerSubmitted, currentIndex, questions, shuffledOptions]);

   // Timer countdown during questions
   useEffect(() => {
      if (gameState === 'playing' && enableTimer && !isAnswerSubmitted) {
         setTimeLeft(QUESTION_TIMER_SECONDS);
         if (timerRef.current) clearInterval(timerRef.current);

         timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
               if (prev <= 1) {
                  clearInterval(timerRef.current!);
                  handleTimeOut();
                  return 0;
               }
               return prev - 1;
            });
         }, 1000);
      }

      return () => {
         if (timerRef.current) clearInterval(timerRef.current);
      };
   }, [currentIndex, gameState, isAnswerSubmitted, enableTimer]);

   // Start Game Flow with F1 Starting Lights Sequence
   const startQuiz = async () => {
      setLoading(true);
      setFetchError(null);

      try {
         let limit = 10;
         if (gameMode === 'gp') limit = 25;
         if (gameMode === 'survival') limit = 50;

         const fetched = await triviaService.getQuestions({
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter,
            limit,
         });

         if (!fetched || fetched.length === 0) {
            setFetchError('No questions found in Supabase for the selected filters. Please verify table seed data.');
            setLoading(false);
            return;
         }

         setQuestions(fetched);
         setCurrentIndex(0);
         setScore(0);
         setStreak(0);
         setBestStreak(0);
         setSelectedAnswer(null);
         setIsAnswerSubmitted(false);
         setUserAnswers([]);
         setLoading(false);

         // Launch Start Lights Animation
         setGameState('starting');
         setStartLightCount(0);

         let light = 1;
         const lightInterval = setInterval(() => {
            setStartLightCount(light);
            light++;
            if (light > 5) {
               clearInterval(lightInterval);
               setTimeout(() => {
                  setStartLightCount(0);
                  setGameState('playing');
               }, 600);
            }
         }, 350);
      } catch (err: any) {
         console.error('Error starting quiz:', err);
         const msg = err.message || '';
         if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('jwt') || msg.includes('401')) {
            setFetchError('Supabase Anon API Key required. Please check your frontend/.env or frontend/src/services/supabase.ts');
         } else {
            setFetchError(msg || 'Failed to connect to Supabase. Check network/config.');
         }
         setLoading(false);
      }
   };

   const handleSelectOption = (option: string) => {
      if (isAnswerSubmitted) return;
      setSelectedAnswer(option);
      submitAnswer(option);
   };

   const handleTimeOut = () => {
      if (isAnswerSubmitted) return;
      setSelectedAnswer('TIME_OUT');
      submitAnswer(null);
   };

   const submitAnswer = (chosen: string | null) => {
      if (isAnswerSubmitted) return;
      if (timerRef.current) clearInterval(timerRef.current);

      setIsAnswerSubmitted(true);
      const currentQ = questions[currentIndex];
      const isCorrect = chosen === currentQ.correct_answer;

      setUserAnswers((prev) => [
         ...prev,
         {
            question: currentQ,
            selected: chosen || 'Time Expired',
            correct: isCorrect,
         },
      ]);

      if (isCorrect) {
         const streakBonus = Math.min(streak * 25, 100);
         const speedBonus = enableTimer ? Math.round(timeLeft * 10) : 0;
         const pointsEarned = 100 + streakBonus + speedBonus;

         const newScore = score + pointsEarned;
         const newStreak = streak + 1;

         setScore(newScore);
         setStreak(newStreak);
         if (newStreak > bestStreak) setBestStreak(newStreak);

         if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('f1_trivia_high_score', String(newScore));
         }
      } else {
         setStreak(0);
      }
   };

   const handleNextQuestion = () => {
      if (gameMode === 'survival' && selectedAnswer !== questions[currentIndex].correct_answer) {
         setGameState('finished');
         return;
      }

      if (currentIndex + 1 < questions.length) {
         setCurrentIndex((prev) => prev + 1);
         setSelectedAnswer(null);
         setIsAnswerSubmitted(false);
      } else {
         setGameState('finished');
      }
   };

   // Driver Tier Assessment based on accuracy
   const getPerformanceRank = () => {
      const total = userAnswers.length;
      if (total === 0) return { title: 'Rookie Driver', badge: '🏎️', desc: 'Keep practicing your laps!' };
      const correctCount = userAnswers.filter((a) => a.correct).length;
      const accuracy = (correctCount / total) * 100;

      if (accuracy >= 90) return { title: '7-Time World Champion', badge: '👑', desc: 'Absolute Masterclass! True F1 Legend.' };
      if (accuracy >= 75) return { title: 'Grand Prix Winner', badge: '🏆', desc: 'Top step of the podium pace!' };
      if (accuracy >= 55) return { title: 'Podium Finisher', badge: '🥈', desc: 'Solid drive into the championship points!' };
      if (accuracy >= 35) return { title: 'Midfield Battler', badge: '🏁', desc: 'Fighting hard in the midfield DRS train.' };
      return { title: 'Test & Reserve Driver', badge: '🔧', desc: 'Back to the simulator for more prep!' };
   };

   return (
      <div className="w-full max-w-6xl mx-auto flex flex-col justify-start animate-fade-in">
         {/* ------------------------------------------------------------------- */}
         {/* 1. LOBBY VIEW                                                       */}
         {/* ------------------------------------------------------------------- */}
         {gameState === 'lobby' && (
            <div className="space-y-5">
               {/* Header Banner */}
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                     <span className="bg-f1-red/20 text-f1-red font-bold text-xs px-2.5 py-0.5 rounded-full border border-f1-red/30 uppercase tracking-widest inline-flex items-center gap-1.5 mb-1.5">
                        <Trophy className="w-3.5 h-3.5" /> F1 Pit Wall Challenge
                     </span>
                     <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white tracking-tight">
                        Formula 1 <span className="text-f1-red">Trivia & Quiz</span>
                     </h1>
                  </div>

                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
                     <Award className="w-5 h-5 text-amber-400" />
                     <div>
                        <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">All-Time High Score</div>
                        <div className="text-base md:text-lg font-bold text-white font-mono">{highScore.toLocaleString()} PTS</div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left: Mode & Categories */}
                  <div className="lg:col-span-2 space-y-4">
                     {/* Mode Selector */}
                     <div className="bg-[#1e1e2e]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                           <Zap className="w-4 h-4 text-amber-400" /> Choose Race Mode
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                           <button
                              onClick={() => setGameMode('sprint')}
                              className={`p-3.5 rounded-xl border text-left transition-all ${
                                 gameMode === 'sprint'
                                    ? 'bg-f1-red/20 border-f1-red shadow-lg shadow-f1-red/10 ring-1 ring-f1-red/50'
                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                              }`}
                           >
                              <div className="flex items-center justify-between mb-1.5">
                                 <Zap className={`w-4 h-4 ${gameMode === 'sprint' ? 'text-f1-red' : 'text-white/60'}`} />
                                 <span className="text-[11px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-white/90">10 Laps</span>
                              </div>
                              <h3 className="font-bold text-white text-sm">Sprint Shootout</h3>
                              <p className="text-xs text-white/50 mt-1 leading-snug">Quick 10-question sprint race.</p>
                           </button>

                           <button
                              onClick={() => setGameMode('gp')}
                              className={`p-3.5 rounded-xl border text-left transition-all ${
                                 gameMode === 'gp'
                                    ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                              }`}
                           >
                              <div className="flex items-center justify-between mb-1.5">
                                 <Trophy className={`w-4 h-4 ${gameMode === 'gp' ? 'text-amber-400' : 'text-white/60'}`} />
                                 <span className="text-[11px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-white/90">25 Laps</span>
                              </div>
                              <h3 className="font-bold text-white text-sm">Grand Prix</h3>
                              <p className="text-xs text-white/50 mt-1 leading-snug">Full 25-question endurance test.</p>
                           </button>

                           <button
                              onClick={() => setGameMode('survival')}
                              className={`p-3.5 rounded-xl border text-left transition-all ${
                                 gameMode === 'survival'
                                    ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/50'
                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                              }`}
                           >
                              <div className="flex items-center justify-between mb-1.5">
                                 <Flame className={`w-4 h-4 ${gameMode === 'survival' ? 'text-purple-400' : 'text-white/60'}`} />
                                 <span className="text-[11px] font-mono font-bold bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded">Sudden Death</span>
                              </div>
                              <h3 className="font-bold text-white text-sm">Survival</h3>
                              <p className="text-xs text-white/50 mt-1 leading-snug">1 mistake = Game Over!</p>
                           </button>
                        </div>
                     </div>

                     {/* Category Selector */}
                     <div className="bg-[#1e1e2e]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
                           <span className="flex items-center gap-2">
                              <Compass className="w-4 h-4 text-f1-red" /> Category Topic
                           </span>
                           <span className="text-xs text-white/40 font-normal">Choose topic or all</span>
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                           {CATEGORIES.map((cat) => {
                              const Icon = cat.icon;
                              const isSelected = selectedCategory === cat.id;
                              return (
                                 <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                                       isSelected
                                          ? 'bg-white/15 border-f1-red text-white shadow-md ring-1 ring-f1-red/40'
                                          : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                 >
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${cat.color} text-white shadow-inner flex-shrink-0`}>
                                       <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs font-semibold truncate">{cat.label}</span>
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  </div>

                  {/* Right: Regulations & Start */}
                  <div className="space-y-4">
                     <div className="bg-[#1e1e2e]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-sm space-y-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                           <Wrench className="w-4 h-4 text-cyan-400" /> Regulations
                        </h2>

                        {/* Difficulty */}
                        <div>
                           <label className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5 block">
                              Difficulty Level
                           </label>
                           <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                              {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                                 <button
                                    key={diff}
                                    onClick={() => setDifficultyFilter(diff)}
                                    className={`py-1.5 text-xs font-bold rounded-lg uppercase transition-all ${
                                       difficultyFilter === diff
                                          ? 'bg-f1-red text-white shadow-md'
                                          : 'text-white/60 hover:text-white'
                                    }`}
                                 >
                                    {diff}
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* Timer Toggle */}
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                           <div className="flex items-center gap-2.5">
                              <Timer className="w-4 h-4 text-amber-400" />
                              <div>
                                 <div className="text-xs font-bold text-white">20s Pit Wall Timer</div>
                                 <div className="text-[10px] text-white/40">Bonus points for speed</div>
                              </div>
                           </div>
                           <input
                              type="checkbox"
                              checked={enableTimer}
                              onChange={(e) => setEnableTimer(e.target.checked)}
                              className="w-5 h-5 accent-f1-red cursor-pointer rounded"
                           />
                        </div>

                        {fetchError && (
                           <div className="p-3 bg-red-950/50 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                              <span>{fetchError}</span>
                           </div>
                        )}

                        <button
                           onClick={startQuiz}
                           disabled={loading}
                           className="w-full py-4 bg-gradient-to-r from-f1-red to-red-700 hover:from-red-600 hover:to-f1-red text-white font-extrabold text-sm md:text-base rounded-xl shadow-xl shadow-f1-red/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
                        >
                           {loading ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           ) : (
                              <>
                                 <Play className="w-5 h-5 fill-current" /> Start Quiz
                              </>
                           )}
                        </button>
                     </div>

                     <div className="bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed flex items-center gap-3">
                        <Flame className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <span>Build your DRS streak with consecutive correct answers for up to +100 bonus points!</span>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ------------------------------------------------------------------- */}
         {/* 2. START LIGHTS COUNTDOWN                                           */}
         {/* ------------------------------------------------------------------- */}
         {gameState === 'starting' && (
            <div className="w-full min-h-[55vh] flex flex-col items-center justify-center p-8 bg-[#1e1e2e]/70 border border-white/10 rounded-3xl backdrop-blur-md">
               <span className="text-xs font-mono text-white/50 uppercase tracking-widest mb-1.5">Formation Lap Complete</span>
               <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-8">GRIDDING UP...</h2>

               <div className="flex items-center gap-3 sm:gap-6 bg-black/90 p-5 sm:p-7 rounded-3xl border border-white/20 shadow-2xl">
                  {[1, 2, 3, 4, 5].map((lightIndex) => {
                     const isLit = lightIndex <= startLightCount;
                     return (
                        <div
                           key={lightIndex}
                           className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full transition-all duration-150 ${
                              isLit
                                 ? 'bg-f1-red shadow-[0_0_30px_#e10600] border-2 border-white'
                                 : 'bg-zinc-900 border border-white/10'
                           }`}
                        />
                     );
                  })}
               </div>

               <p className="mt-8 text-white/50 text-sm animate-pulse">Lights out and away we go!</p>
            </div>
         )}

         {/* ------------------------------------------------------------------- */}
         {/* 3. ACTIVE QUIZ PLAYING VIEW (Generous, Proportional Cockpit)        */}
         {/* ------------------------------------------------------------------- */}
         {gameState === 'playing' && currentQuestion && (
            <div className="w-full flex flex-col gap-3.5">
               {/* Race HUD Header */}
               <div className="bg-[#1e1e2e]/95 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-xl flex items-center justify-between gap-4 shadow-xl">
                  {/* Left: Lap Progress & Category */}
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-xl bg-f1-red/20 border border-f1-red/40 flex items-center justify-center font-bold text-f1-red text-sm font-mono shadow-inner">
                        {currentIndex + 1}
                     </div>
                     <div>
                        <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Race Progress</div>
                        <div className="text-sm md:text-base font-bold text-white font-mono flex items-center gap-2">
                           Lap {currentIndex + 1} <span className="text-white/40 font-normal">/ {questions.length}</span>
                           <span className="hidden sm:inline-block text-[11px] bg-white/10 text-white/90 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {currentQuestion.category.replace('_', ' ')}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Center: DRS Streak Multiplier */}
                  {streak > 1 && (
                     <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 px-3.5 py-1 rounded-xl animate-pulse">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-xs md:text-sm font-extrabold text-orange-300 font-mono">{streak}x DRS STREAK</span>
                     </div>
                  )}

                  {/* Right: Timer, Score & Quit */}
                  <div className="flex items-center gap-3">
                     {enableTimer && !isAnswerSubmitted && (
                        <div className="flex items-center gap-1.5 font-mono text-xs md:text-sm font-bold bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl">
                           <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
                           <span className={timeLeft <= 5 ? 'text-red-400' : 'text-white'}>{timeLeft}s</span>
                        </div>
                     )}

                     <div className="text-right bg-white/5 border border-white/10 px-3.5 py-1 rounded-xl">
                        <div className="text-[9px] text-white/50 uppercase font-bold">Score</div>
                        <div className="text-sm md:text-base font-bold text-white font-mono">
                           {score.toLocaleString()} <span className="text-white/40 text-[10px]">PTS</span>
                        </div>
                     </div>

                     <button
                        onClick={() => setGameState('lobby')}
                        className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                        title="Quit Race"
                     >
                        <LogOut className="w-4 h-4" />
                     </button>
                  </div>
               </div>

               {/* Lap Progress Bar */}
               <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                     className="bg-gradient-to-r from-f1-red via-orange-500 to-amber-400 h-full transition-all duration-300 rounded-full shadow-lg shadow-f1-red/30"
                     style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
               </div>

               {/* Main Expansive Question Card */}
               <div className="bg-[#1e1e2e]/95 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  {/* Top Timer Bar */}
                  {enableTimer && !isAnswerSubmitted && (
                     <div
                        className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-green-500 via-amber-500 to-red-500 transition-all duration-1000 ease-linear shadow-md"
                        style={{ width: `${(timeLeft / QUESTION_TIMER_SECONDS) * 100}%` }}
                     />
                  )}

                  {/* Header row inside question card */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-f1-red bg-f1-red/15 px-3 py-0.5 rounded-full border border-f1-red/30">
                           Sector {((currentIndex % 3) + 1)} • Lap #{currentIndex + 1}
                        </span>
                        {currentQuestion.season && (
                           <span className="text-xs font-mono text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
                              {currentQuestion.season} Season
                           </span>
                        )}
                     </div>

                     <span className="text-xs text-white/40 font-mono">
                        Difficulty: <span className="text-white capitalize font-bold">{currentQuestion.difficulty}</span>
                     </span>
                  </div>

                  {/* Question Title */}
                  <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white leading-relaxed mb-6 min-h-[56px] flex items-center">
                     {currentQuestion.question}
                  </h2>

                  {/* 4 Large Option Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-2">
                     {shuffledOptions.map((opt, idx) => {
                        const letter = ['A', 'B', 'C', 'D'][idx] || `${idx + 1}`;
                        const isSelected = selectedAnswer === opt;
                        const isCorrect = opt === currentQuestion.correct_answer;

                        let cardStyle =
                           'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-black/20';

                        if (isAnswerSubmitted) {
                           if (isCorrect) {
                              cardStyle =
                                 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-xl shadow-emerald-500/10 font-bold ring-1 ring-emerald-500/50';
                           } else if (isSelected && !isCorrect) {
                              cardStyle =
                                 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-xl shadow-rose-500/10 ring-1 ring-rose-500/50';
                           } else {
                              cardStyle = 'bg-white/5 border-white/5 text-white/30 opacity-40';
                           }
                        }

                        return (
                           <button
                              key={idx}
                              onClick={() => handleSelectOption(opt)}
                              disabled={isAnswerSubmitted}
                              className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex items-center gap-4 transform active:scale-[0.99] group ${cardStyle}`}
                           >
                              <span
                                 className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs sm:text-sm flex-shrink-0 transition-transform group-hover:scale-105 ${
                                    isAnswerSubmitted && isCorrect
                                       ? 'bg-emerald-500 text-black shadow-md'
                                       : isAnswerSubmitted && isSelected && !isCorrect
                                       ? 'bg-rose-500 text-white shadow-md'
                                       : 'bg-white/10 text-white/90 border border-white/10'
                                 }`}
                              >
                                 {letter}
                              </span>
                              <span className="text-sm sm:text-base font-medium leading-snug">{opt}</span>
                           </button>
                        );
                     })}
                  </div>

                  {/* Inline Explanation & Next Button Bar */}
                  {isAnswerSubmitted && (
                     <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div
                           className={`p-3.5 rounded-2xl border flex items-center gap-3 flex-1 ${
                              selectedAnswer === currentQuestion.correct_answer
                                 ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-200'
                                 : 'bg-rose-950/60 border-rose-800/60 text-rose-200'
                           }`}
                        >
                           {selectedAnswer === currentQuestion.correct_answer ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                           ) : (
                              <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                           )}
                           <div className="leading-snug">
                              <span className="font-bold text-xs sm:text-sm mr-1">
                                 {selectedAnswer === currentQuestion.correct_answer
                                    ? '🏁 Purple Sector! Correct.'
                                    : `❌ Correct Answer: "${currentQuestion.correct_answer}".`}
                              </span>
                              <span className="text-white/80 text-xs leading-relaxed">{currentQuestion.explanation}</span>
                           </div>
                        </div>

                        <button
                           onClick={handleNextQuestion}
                           className="px-7 py-3.5 bg-gradient-to-r from-f1-red to-red-700 hover:from-red-600 hover:to-f1-red text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-f1-red/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2 uppercase tracking-wider flex-shrink-0"
                        >
                           {currentIndex + 1 < questions.length ? (
                              <>
                                 Next Lap <ArrowRight className="w-4 h-4" />
                              </>
                           ) : (
                              <>
                                 Finish Race <Trophy className="w-4 h-4" />
                              </>
                           )}
                           <span className="hidden sm:inline-block text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono ml-1">
                              [Enter]
                           </span>
                        </button>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* ------------------------------------------------------------------- */}
         {/* 4. RACE RESULTS & PODIUM SUMMARY VIEW                               */}
         {/* ------------------------------------------------------------------- */}
         {gameState === 'finished' && (
            <div className="w-full space-y-5 animate-slide-up">
               {/* Podium Trophy Banner */}
               <div className="bg-gradient-to-br from-[#1e1e2e] to-[#15151e] border border-white/10 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="text-4xl sm:text-5xl mb-2">{getPerformanceRank().badge}</div>
                  <span className="text-xs font-mono text-f1-red font-bold uppercase tracking-widest">
                     FIA Formula 1 Classification
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-1">
                     {getPerformanceRank().title}
                  </h2>
                  <p className="text-white/60 text-sm mt-1 max-w-md mx-auto">{getPerformanceRank().desc}</p>

                  {/* Summary Stat Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                     <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl">
                        <div className="text-[10px] text-white/50 uppercase font-bold">Total Score</div>
                        <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono mt-0.5">
                           {score.toLocaleString()}
                        </div>
                     </div>

                     <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl">
                        <div className="text-[10px] text-white/50 uppercase font-bold">Accuracy</div>
                        <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">
                           {Math.round((userAnswers.filter((a) => a.correct).length / (userAnswers.length || 1)) * 100)}%
                        </div>
                     </div>

                     <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl">
                        <div className="text-[10px] text-white/50 uppercase font-bold">Laps Completed</div>
                        <div className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-0.5">
                           {userAnswers.filter((a) => a.correct).length} / {userAnswers.length}
                        </div>
                     </div>

                     <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl">
                        <div className="text-[10px] text-white/50 uppercase font-bold">Max DRS Streak</div>
                        <div className="text-xl sm:text-2xl font-extrabold text-orange-400 font-mono mt-0.5">
                           {bestStreak}x
                        </div>
                     </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                     <button
                        onClick={startQuiz}
                        className="w-full sm:w-auto px-8 py-3.5 bg-f1-red hover:bg-red-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-f1-red/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                     >
                        <RotateCcw className="w-4 h-4" /> Race Again
                     </button>
                     <button
                        onClick={() => setGameState('lobby')}
                        className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                     >
                        Change Settings
                     </button>
                  </div>
               </div>

               {/* Question Review Section */}
               <div className="bg-[#1e1e2e]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-sm max-h-56 overflow-y-auto">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                     <HelpCircle className="w-4 h-4 text-f1-red" /> Lap Telemetry Review
                  </h3>

                  <div className="space-y-2.5">
                     {userAnswers.map((ans, idx) => (
                        <div
                           key={idx}
                           className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
                        >
                           <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xs font-mono font-bold text-white/40">#{idx + 1}</span>
                              <span className="text-xs md:text-sm text-white truncate">{ans.question.question}</span>
                           </div>
                           <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                              <span className={ans.correct ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                 {ans.selected}
                              </span>
                              {ans.correct ? (
                                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                 <XCircle className="w-4 h-4 text-rose-400" />
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default TriviaPage;
