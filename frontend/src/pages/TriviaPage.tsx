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
   Flag,
} from 'lucide-react';
import { triviaService } from '../services/triviaService';
import { TriviaQuestion, TriviaCategory, TriviaGameMode } from '../types';

const CATEGORIES: { id: TriviaCategory; label: string; icon: any; accent: string; tag: string }[] = [
   { id: 'all', label: 'All Topics', icon: Sparkles, accent: '#E10600', tag: 'ALL' },
   { id: 'drivers', label: 'Drivers', icon: Users, accent: '#38bdf8', tag: 'DRV' },
   { id: 'teams', label: 'Teams', icon: Wrench, accent: '#f59e0b', tag: 'TEA' },
   { id: 'circuits', label: 'Circuits', icon: Compass, accent: '#10b981', tag: 'CIR' },
   { id: 'team_radio', label: 'Team Radio', icon: Radio, accent: '#a855f7', tag: 'RAD' },
   { id: 'championships', label: 'Championships', icon: Trophy, accent: '#facc15', tag: 'WDC' },
   { id: 'pit_stops', label: 'Pit Stops', icon: Timer, accent: '#22d3ee', tag: 'PIT' },
   { id: 'tyres', label: 'Tyres', icon: Zap, accent: '#f43f5e', tag: 'TYR' },
   { id: 'race_results', label: 'Race Results', icon: Award, accent: '#34d399', tag: 'RES' },
   { id: 'records', label: 'Records', icon: Flame, accent: '#fb923c', tag: 'REC' },
   { id: 'historical', label: 'Historical', icon: HelpCircle, accent: '#94a3b8', tag: 'HIS' },
   { id: 'rules', label: 'Rules & Regs', icon: AlertCircle, accent: '#0ea5e9', tag: 'REG' },
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

interface ResultGaugeCardProps {
   title: string;
   value: number | string;
   unit: string;
   icon: React.ElementType;
   percent: number;
   colorHex: string;
   badgeText?: string;
}

const ResultGaugeCard: React.FC<ResultGaugeCardProps> = ({ title, value, unit, icon: Icon, percent, colorHex, badgeText }) => {
   const radius = 36;
   const circumference = 2 * Math.PI * radius;
   const strokeDashoffset = circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference;

   return (
      <div className="telemetry-card p-5 flex flex-col justify-between relative overflow-hidden">
         <div
            className="absolute top-0 inset-x-0 h-[2px] opacity-75"
            style={{ background: `linear-gradient(90deg, transparent, ${colorHex}, transparent)` }}
         />
         <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
               <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06]"
                  style={{ backgroundColor: `${colorHex}15` }}
               >
                  <Icon className="w-4 h-4" style={{ color: colorHex }} />
               </div>
               <span className="text-xs font-mono font-medium text-f1-silver/70 tracking-wider uppercase">{title}</span>
            </div>
            {badgeText && (
               <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-f1-silver/60 border border-white/[0.06]">
                  {badgeText}
               </span>
            )}
         </div>

         <div className="flex items-center justify-between mt-2">
            <div>
               <div className="text-3xl sm:text-4xl font-black font-display tracking-tight text-f1-white">{value}</div>
               <p className="text-[11px] font-mono text-f1-silver/50 tracking-widest uppercase mt-0.5">{unit}</p>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
               <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r={radius} className="gauge-track" />
                  <circle
                     cx="44"
                     cy="44"
                     r={radius}
                     className="gauge-fill"
                     style={{
                        stroke: colorHex,
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                        filter: `drop-shadow(0 0 6px ${colorHex}80)`,
                     }}
                  />
               </svg>
               <span className="absolute font-mono text-[11px] font-bold text-f1-white/90">{Math.round(percent)}%</span>
            </div>
         </div>
      </div>
   );
};

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

   const correctCount = userAnswers.filter((a) => a.correct).length;
   const accuracyPct = Math.round((correctCount / (userAnswers.length || 1)) * 100);
   const distancePct = Math.round((userAnswers.length / (questions.length || 1)) * 100);
   const streakPct = Math.round((bestStreak / (userAnswers.length || 1)) * 100);
   const scorePct = Math.min(100, Math.round((score / ((userAnswers.length || 1) * 300)) * 100));

   return (
      <div className="space-y-7 animate-fade-in">
         {/* 1. LOBBY VIEW  */}
         {gameState === 'lobby' && (
            <div className="space-y-5">
               {/* Hero: Mission Control HUD */}
               <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid">
                  <div className="scanline-overlay" />
                  <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                     <div className="space-y-2">
                        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                           <Trophy className="w-3.5 h-3.5 text-f1-red-light" />
                           <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                              FIA Pit Wall Challenge
                           </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-f1-white uppercase">
                           Trivia <span className="gradient-text">Circuit</span>
                        </h1>

                        <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                           Test your championship knowledge against the pit wall clock. Choose a mode, pick a topic, and take the lights.
                        </p>
                     </div>

                     <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 rounded-2xl backdrop-blur-md shrink-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-amber-400/20 bg-amber-400/10">
                           <Award className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                           <div className="text-[10px] font-mono text-f1-silver/50 uppercase font-bold tracking-wider">All-Time High Score</div>
                           <div className="text-base md:text-lg font-black font-display text-f1-white">{highScore.toLocaleString()} PTS</div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left: Mode & Categories */}
                  <div className="lg:col-span-2 space-y-5">
                     {/* Mode Selector */}
                     <div className="telemetry-card p-5">
                        <h2 className="text-xs font-mono font-bold text-f1-silver/70 uppercase tracking-widest mb-3.5 flex items-center gap-2">
                           <Zap className="w-4 h-4 text-amber-400" /> Choose Race Mode
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                           {[
                              { id: 'sprint' as TriviaGameMode, icon: Zap, title: 'Sprint Shootout', desc: 'Quick 10-question sprint race.', tag: '10 LAPS', color: '#E10600' },
                              { id: 'gp' as TriviaGameMode, icon: Trophy, title: 'Grand Prix', desc: 'Full 25-question endurance test.', tag: '25 LAPS', color: '#f59e0b' },
                              { id: 'survival' as TriviaGameMode, icon: Flame, title: 'Survival', desc: '1 mistake = Game Over!', tag: 'SUDDEN DEATH', color: '#a855f7' },
                           ].map((mode) => {
                              const Icon = mode.icon;
                              const isActive = gameMode === mode.id;
                              return (
                                 <button
                                    key={mode.id}
                                    onClick={() => setGameMode(mode.id)}
                                    className={`relative overflow-hidden p-3.5 rounded-xl border text-left transition-all ${isActive
                                       ? 'bg-white/[0.06] border-white/[0.14] shadow-lg'
                                       : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04]'
                                       }`}
                                    style={isActive ? { boxShadow: `0 0 0 1px ${mode.color}40, 0 10px 30px -10px ${mode.color}30` } : undefined}
                                 >
                                    {isActive && (
                                       <div
                                          className="absolute top-0 inset-x-0 h-[2px]"
                                          style={{ background: `linear-gradient(90deg, transparent, ${mode.color}, transparent)` }}
                                       />
                                    )}
                                    <div className="flex items-center justify-between mb-2">
                                       <Icon className="w-4 h-4" style={{ color: isActive ? mode.color : '#8b93a1' }} />
                                       <span className="text-[10px] font-mono font-bold bg-white/[0.06] px-2 py-0.5 rounded text-f1-silver/80">
                                          {mode.tag}
                                       </span>
                                    </div>
                                    <h3 className="font-display font-bold text-f1-white text-sm">{mode.title}</h3>
                                    <p className="text-xs text-f1-silver/50 mt-1 leading-snug">{mode.desc}</p>
                                 </button>
                              );
                           })}
                        </div>
                     </div>

                     {/* Category Selector */}
                     <div className="telemetry-card p-5">
                        <h2 className="text-xs font-mono font-bold text-f1-silver/70 uppercase tracking-widest mb-3.5 flex items-center justify-between">
                           <span className="flex items-center gap-2">
                              <Compass className="w-4 h-4 text-f1-red" /> Category Topic
                           </span>
                           <span className="text-[10px] text-f1-silver/40 font-mono normal-case tracking-normal">Choose topic or all</span>
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                           {CATEGORIES.map((cat) => {
                              const Icon = cat.icon;
                              const isSelected = selectedCategory === cat.id;
                              return (
                                 <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`pill-button justify-start py-2.5 transition-all ${isSelected ? 'border-white/[0.14] bg-white/[0.06]' : 'hover:border-white/[0.12]'
                                       }`}
                                    style={isSelected ? { boxShadow: `0 0 0 1px ${cat.accent}40` } : undefined}
                                 >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                       <div
                                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/[0.06]"
                                          style={{ backgroundColor: `${cat.accent}18` }}
                                       >
                                          <Icon className="w-3.5 h-3.5" style={{ color: cat.accent }} />
                                       </div>
                                       <div className="min-w-0 text-left">
                                          <span className="text-xs font-semibold text-f1-white truncate block">{cat.label}</span>
                                          <span className="text-[9px] font-mono text-f1-silver/40 uppercase">/{cat.tag}</span>
                                       </div>
                                    </div>
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  </div>

                  {/* Right: Regulations & Start */}
                  <div className="space-y-5">
                     <div className="telemetry-card p-5 space-y-4">
                        <h2 className="text-xs font-mono font-bold text-f1-silver/70 uppercase tracking-widest flex items-center gap-2">
                           <Wrench className="w-4 h-4 text-cyan-400" /> Regulations
                        </h2>

                        {/* Difficulty */}
                        <div>
                           <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-f1-silver/50 mb-1.5 block">
                              Difficulty Level
                           </label>
                           <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                              {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                                 <button
                                    key={diff}
                                    onClick={() => setDifficultyFilter(diff)}
                                    className={`py-1.5 text-[11px] font-mono font-bold rounded-lg uppercase tracking-wide transition-all ${difficultyFilter === diff
                                       ? 'bg-f1-red text-white shadow-md'
                                       : 'text-f1-silver/60 hover:text-f1-white'
                                       }`}
                                 >
                                    {diff}
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* Timer Toggle */}
                        <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                           <div className="flex items-center gap-2.5">
                              <Timer className="w-4 h-4 text-amber-400" />
                              <div>
                                 <div className="text-xs font-semibold text-f1-white">20s Pit Wall Timer</div>
                                 <div className="text-[10px] font-mono text-f1-silver/40">Bonus points for speed</div>
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
                           <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-xs flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                              <span>{fetchError}</span>
                           </div>
                        )}

                        <button
                           onClick={startQuiz}
                           disabled={loading}
                           className="w-full py-4 bg-gradient-to-r from-f1-red to-red-700 hover:from-red-600 hover:to-f1-red text-white font-mono font-extrabold text-sm rounded-xl shadow-xl shadow-f1-red/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 uppercase tracking-[0.15em] disabled:opacity-50"
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

                     <div className="telemetry-card p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-amber-400/20 bg-amber-400/10 shrink-0">
                           <Flame className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-xs text-f1-silver/70 leading-relaxed">
                           Build your DRS streak with consecutive correct answers for up to <span className="text-amber-300 font-semibold">+100 bonus points</span>!
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* 2. START LIGHTS COUNTDOWN */}
         {gameState === 'starting' && (
            <div className="relative overflow-hidden w-full min-h-[55vh] flex flex-col items-center justify-center p-8 rounded-3xl bg-f1-carbon/90 border border-white/[0.06] dot-grid shadow-2xl">
               <div className="scanline-overlay" />
               <div className="absolute -top-24 -right-24 w-96 h-96 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />

               <span className="relative z-10 text-xs font-mono text-f1-silver/50 uppercase tracking-[0.2em] mb-1.5">
                  Formation Lap Complete
               </span>
               <h2 className="relative z-10 text-3xl sm:text-4xl font-display font-black text-f1-white mb-8 uppercase tracking-tight">
                  Gridding Up...
               </h2>

               <div className="relative z-10 flex items-center gap-3 sm:gap-6 bg-black/80 p-5 sm:p-7 rounded-3xl border border-white/[0.1] shadow-2xl">
                  {[1, 2, 3, 4, 5].map((lightIndex) => {
                     const isLit = lightIndex <= startLightCount;
                     return (
                        <div
                           key={lightIndex}
                           className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full transition-all duration-150 ${isLit
                              ? 'bg-f1-red shadow-[0_0_30px_#e10600] border-2 border-white'
                              : 'bg-zinc-900 border border-white/10'
                              }`}
                        />
                     );
                  })}
               </div>

               <p className="relative z-10 mt-8 text-f1-silver/50 text-sm font-mono animate-pulse uppercase tracking-widest">
                  Lights out and away we go!
               </p>
            </div>
         )}

         {/* 3. ACTIVE QUIZ PLAYING VIEW */}
         {gameState === 'playing' && currentQuestion && (
            <div className="w-full flex flex-col gap-3.5">
               {/* Race HUD Header */}
               <div className="telemetry-card px-5 py-3.5 flex items-center justify-between gap-4">
                  {/* Left: Lap Progress & Category */}
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-xl bg-f1-red/15 border border-f1-red/30 flex items-center justify-center font-bold text-f1-red-light text-sm font-mono shadow-inner">
                        {currentIndex + 1}
                     </div>
                     <div>
                        <div className="text-[10px] font-mono text-f1-silver/50 uppercase font-bold tracking-wider">Race Progress</div>
                        <div className="text-sm md:text-base font-bold text-f1-white font-mono flex items-center gap-2">
                           Lap {currentIndex + 1} <span className="text-f1-silver/40 font-normal">/ {questions.length}</span>
                           <span className="hidden sm:inline-block text-[11px] bg-white/[0.06] text-f1-silver/80 font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/[0.06]">
                              {currentQuestion.category.replace('_', ' ')}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Center: DRS Streak Multiplier */}
                  {streak > 1 && (
                     <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/30 px-3.5 py-1 rounded-xl animate-pulse">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-xs md:text-sm font-extrabold text-orange-300 font-mono">{streak}x DRS STREAK</span>
                     </div>
                  )}

                  {/* Right: Timer, Score & Quit */}
                  <div className="flex items-center gap-3">
                     {enableTimer && !isAnswerSubmitted && (
                        <div className="flex items-center gap-1.5 font-mono text-xs md:text-sm font-bold bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-xl">
                           <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
                           <span className={timeLeft <= 5 ? 'text-red-400' : 'text-f1-white'}>{timeLeft}s</span>
                        </div>
                     )}

                     <div className="text-right bg-white/[0.03] border border-white/[0.06] px-3.5 py-1 rounded-xl">
                        <div className="text-[9px] font-mono text-f1-silver/50 uppercase font-bold">Score</div>
                        <div className="text-sm md:text-base font-bold text-f1-white font-mono">
                           {score.toLocaleString()} <span className="text-f1-silver/40 text-[10px]">PTS</span>
                        </div>
                     </div>

                     <button
                        onClick={() => setGameState('lobby')}
                        className="text-f1-silver/40 hover:text-f1-white p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
                        title="Quit Race"
                     >
                        <LogOut className="w-4 h-4" />
                     </button>
                  </div>
               </div>

               {/* Lap Progress Bar */}
               <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                     className="bg-gradient-to-r from-f1-red via-orange-500 to-amber-400 h-full transition-all duration-300 rounded-full shadow-lg shadow-f1-red/30"
                     style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
               </div>

               {/* Main Question Card */}
               <div className="telemetry-card p-6 md:p-8 relative overflow-hidden flex flex-col justify-between">
                  {enableTimer && !isAnswerSubmitted && (
                     <div
                        className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-green-500 via-amber-500 to-red-500 transition-all duration-1000 ease-linear shadow-md"
                        style={{ width: `${(timeLeft / QUESTION_TIMER_SECONDS) * 100}%` }}
                     />
                  )}

                  {/* Header row inside question card */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                     <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-f1-red-light bg-f1-red/10 px-3 py-0.5 rounded-full border border-f1-red/25">
                           Sector {((currentIndex % 3) + 1)} • Lap #{currentIndex + 1}
                        </span>
                        {currentQuestion.season && (
                           <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/20">
                              {currentQuestion.season} Season
                           </span>
                        )}
                     </div>

                     <span className="text-[11px] text-f1-silver/40 font-mono">
                        Difficulty: <span className="text-f1-white capitalize font-bold">{currentQuestion.difficulty}</span>
                     </span>
                  </div>

                  {/* Question Title */}
                  <h2 className="text-lg sm:text-xl md:text-2xl font-display font-extrabold text-f1-white leading-relaxed mb-6 min-h-[56px] flex items-center">
                     {currentQuestion.question}
                  </h2>

                  {/* 4 Option Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-2">
                     {shuffledOptions.map((opt, idx) => {
                        const letter = ['A', 'B', 'C', 'D'][idx] || `${idx + 1}`;
                        const isSelected = selectedAnswer === opt;
                        const isCorrect = opt === currentQuestion.correct_answer;

                        let cardStyle =
                           'bg-white/[0.03] border-white/[0.06] text-f1-white hover:bg-white/[0.06] hover:border-white/[0.14] hover:shadow-lg hover:shadow-black/20';

                        if (isAnswerSubmitted) {
                           if (isCorrect) {
                              cardStyle =
                                 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 shadow-xl shadow-emerald-500/10 font-bold ring-1 ring-emerald-500/40';
                           } else if (isSelected && !isCorrect) {
                              cardStyle =
                                 'bg-rose-500/15 border-rose-500/60 text-rose-200 shadow-xl shadow-rose-500/10 ring-1 ring-rose-500/40';
                           } else {
                              cardStyle = 'bg-white/[0.02] border-white/[0.04] text-f1-silver/30 opacity-40';
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
                                 className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs sm:text-sm flex-shrink-0 transition-transform group-hover:scale-105 ${isAnswerSubmitted && isCorrect
                                    ? 'bg-emerald-500 text-black shadow-md'
                                    : isAnswerSubmitted && isSelected && !isCorrect
                                       ? 'bg-rose-500 text-white shadow-md'
                                       : 'bg-white/[0.06] text-f1-white/90 border border-white/[0.06]'
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
                     <div className="mt-4 pt-4 border-t border-white/[0.06] animate-fade-in flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div
                           className={`p-3.5 rounded-2xl border flex items-center gap-3 flex-1 ${selectedAnswer === currentQuestion.correct_answer
                              ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200'
                              : 'bg-rose-950/40 border-rose-800/40 text-rose-200'
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
                              <span className="text-f1-silver/70 text-xs leading-relaxed">{currentQuestion.explanation}</span>
                           </div>
                        </div>

                        <button
                           onClick={handleNextQuestion}
                           className="px-7 py-3.5 bg-gradient-to-r from-f1-red to-red-700 hover:from-red-600 hover:to-f1-red text-white font-mono font-extrabold text-sm rounded-2xl shadow-xl shadow-f1-red/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2 uppercase tracking-wider flex-shrink-0"
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
                           <span className="hidden sm:inline-block text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono ml-1">[Enter]</span>
                        </button>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* 4. RACE RESULTS & PODIUM SUMMARY VIEW */}
         {gameState === 'finished' && (
            <div className="w-full space-y-5 animate-slide-up">
               {/* Podium Banner — Mission Control HUD style */}
               <div className="relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-7 sm:p-9 text-center shadow-2xl dot-grid">
                  <div className="scanline-overlay" />
                  <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-f1-red/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10">
                     <div className="text-4xl sm:text-5xl mb-2">{getPerformanceRank().badge}</div>
                     <span className="text-xs font-mono text-f1-red-light font-bold uppercase tracking-[0.2em]">
                        FIA Formula 1 Classification
                     </span>
                     <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-f1-white mt-1 uppercase tracking-tight">
                        {getPerformanceRank().title}
                     </h2>
                     <p className="text-f1-silver/70 text-sm mt-1 max-w-md mx-auto">{getPerformanceRank().desc}</p>

                     {/* Telemetry gauge grid */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7 text-left">
                        <ResultGaugeCard
                           title="Total Score"
                           value={score.toLocaleString()}
                           unit="Championship Points"
                           icon={Award}
                           percent={scorePct}
                           colorHex="#f59e0b"
                           badgeText="FINAL"
                        />
                        <ResultGaugeCard
                           title="Accuracy"
                           value={`${accuracyPct}%`}
                           unit="Correct Call Rate"
                           icon={CheckCircle2}
                           percent={accuracyPct}
                           colorHex="#10b981"
                           badgeText="HIT RATE"
                        />
                        <ResultGaugeCard
                           title="Laps Completed"
                           value={`${correctCount} / ${userAnswers.length}`}
                           unit="Race Distance"
                           icon={Flag}
                           percent={distancePct}
                           colorHex="#38bdf8"
                           badgeText="DISTANCE"
                        />
                        <ResultGaugeCard
                           title="Max DRS Streak"
                           value={`${bestStreak}x`}
                           unit="Consecutive Correct"
                           icon={Flame}
                           percent={streakPct}
                           colorHex="#fb923c"
                           badgeText="PEAK"
                        />
                     </div>

                     {/* Action Buttons */}
                     <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
                        <button
                           onClick={startQuiz}
                           className="w-full sm:w-auto px-8 py-3.5 bg-f1-red hover:bg-red-600 text-white font-mono font-extrabold text-sm rounded-xl shadow-lg shadow-f1-red/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                           <RotateCcw className="w-4 h-4" /> Race Again
                        </button>
                        <button
                           onClick={() => setGameState('lobby')}
                           className="w-full sm:w-auto px-8 py-3.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] text-f1-white font-mono font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                           Change Settings
                        </button>
                     </div>
                  </div>
               </div>

               {/* Question Review Section */}
               <div className="telemetry-card p-5 max-h-56 overflow-y-auto">
                  <h3 className="text-xs font-mono font-bold text-f1-silver/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <HelpCircle className="w-4 h-4 text-f1-red" /> Lap Telemetry Review
                  </h3>

                  <div className="space-y-2.5">
                     {userAnswers.map((ans, idx) => (
                        <div
                           key={idx}
                           className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between gap-3 hover:border-white/[0.1] transition-colors"
                        >
                           <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xs font-mono font-bold text-f1-silver/40">#{idx + 1}</span>
                              <span className="text-xs md:text-sm text-f1-white truncate">{ans.question.question}</span>
                           </div>
                           <div className="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
                              <span className={ans.correct ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{ans.selected}</span>
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