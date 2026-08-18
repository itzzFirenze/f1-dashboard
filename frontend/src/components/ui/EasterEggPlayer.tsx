import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';
import { EASTER_EGGS, EasterEggTrack } from '../../config/easterEggs';

const EasterEggPlayer: React.FC = () => {
   const [activeTrack, setActiveTrack] = useState<EasterEggTrack | null>(null);
   const [isPlaying, setIsPlaying] = useState<boolean>(false);
   const [isMuted, setIsMuted] = useState<boolean>(false);
   const [progress, setProgress] = useState<number>(0);
   const [errorMsg, setErrorMsg] = useState<string | null>(null);
   const [notification, setNotification] = useState<string | null>(null);

   const audioRef = useRef<HTMLAudioElement | null>(null);
   const keyBufferRef = useRef<string>('');
   const bufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const listenersRef = useRef<{
      timeupdate?: () => void;
      ended?: () => void;
      error?: () => void;
   }>({});

   const cleanupAudio = () => {
      if (audioRef.current) {
         audioRef.current.pause();
         if (listenersRef.current.timeupdate) {
            audioRef.current.removeEventListener('timeupdate', listenersRef.current.timeupdate);
         }
         if (listenersRef.current.ended) {
            audioRef.current.removeEventListener('ended', listenersRef.current.ended);
         }
         if (listenersRef.current.error) {
            audioRef.current.removeEventListener('error', listenersRef.current.error);
         }
         audioRef.current.src = '';
         audioRef.current = null;
         listenersRef.current = {};
      }
   };

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         // Don't intercept if user is typing in an input, textarea, or contentEditable
         const target = e.target as HTMLElement | null;
         if (
            target &&
            (target.tagName === 'INPUT' ||
               target.tagName === 'TEXTAREA' ||
               target.isContentEditable ||
               target.tagName === 'SELECT')
         ) {
            return;
         }

         // Only accept letters
         if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
            keyBufferRef.current += e.key.toLowerCase();

            // Clear after 2.5 seconds of inactivity
            if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
            bufferTimerRef.current = setTimeout(() => {
               keyBufferRef.current = '';
            }, 2500);

            // Check if buffer ends with any easter egg trigger
            for (const [key, track] of Object.entries(EASTER_EGGS)) {
               if (keyBufferRef.current.endsWith(key)) {
                  keyBufferRef.current = '';
                  playEasterEgg(track);
                  break;
               }
            }
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
         window.removeEventListener('keydown', handleKeyDown);
         if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
         if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
         cleanupAudio();
      };
   }, []);

   const playEasterEgg = (track: EasterEggTrack) => {
      cleanupAudio();

      setErrorMsg(null);
      setActiveTrack(track);
      setNotification(`🎉 Easter Egg Unlocked: ${track.title}!`);
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = setTimeout(() => setNotification(null), 4000);

      try {
         const audio = new Audio(track.audioUrl);
         audioRef.current = audio;
         audio.muted = isMuted;

         const onTimeUpdate = () => {
            if (audio.duration) {
               setProgress((audio.currentTime / audio.duration) * 100);
            }
         };

         const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setActiveTrack(null);
            cleanupAudio();
         };

         const onError = () => {
            setErrorMsg(`Audio file couldn't be loaded from Supabase (${track.audioUrl}). Check URL.`);
            setIsPlaying(false);
         };

         listenersRef.current = {
            timeupdate: onTimeUpdate,
            ended: onEnded,
            error: onError,
         };

         audio.addEventListener('timeupdate', onTimeUpdate);
         audio.addEventListener('ended', onEnded);
         audio.addEventListener('error', onError);

         audio
            .play()
            .then(() => {
               setIsPlaying(true);
            })
            .catch((err) => {
               console.warn('Easter egg audio play error:', err);
               setErrorMsg('Click play below to start audio (Browser autoplay restricted)');
               setIsPlaying(false);
            });
      } catch (err) {
         console.error('Audio initialization error:', err);
         setErrorMsg('Unable to initialize audio stream.');
      }
   };

   const togglePlay = () => {
      if (!audioRef.current) return;
      if (isPlaying) {
         audioRef.current.pause();
         setIsPlaying(false);
      } else {
         audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => console.error(err));
      }
   };

   const toggleMute = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
   };

   const closePlayer = () => {
      cleanupAudio();
      setActiveTrack(null);
      setIsPlaying(false);
      setProgress(0);
      setErrorMsg(null);
   };

   if (!activeTrack && !notification) return null;

   return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end max-w-sm w-full animate-slide-up pointer-events-auto">
         {/* Toast notification banner */}
         {notification && (
            <div className="bg-gradient-to-r from-amber-500/90 to-red-600/90 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border border-white/20 flex items-center gap-2 animate-bounce">
               <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
               <span>{notification}</span>
            </div>
         )}

         {/* Audio Player Widget */}
         {activeTrack && (
            <div
               className="w-full bg-[#15151e]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl transition-all duration-300 overflow-hidden relative"
               style={{
                  boxShadow: `0 10px 30px -10px ${activeTrack.primaryColor}40`,
                  borderLeft: `4px solid ${activeTrack.primaryColor}`,
               }}
            >
               {/* Progress bar background */}
               <div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/20 to-white/50 transition-all duration-200"
                  style={{
                     width: `${progress}%`,
                     backgroundColor: activeTrack.primaryColor,
                  }}
               />

               <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                     <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden shadow-inner"
                        style={{
                           background: `linear-gradient(135deg, ${activeTrack.primaryColor}30, ${activeTrack.accentColor}50)`,
                           border: `1px solid ${activeTrack.primaryColor}60`,
                        }}
                     >
                        <span>{activeTrack.emoji}</span>
                        {isPlaying && (
                           <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                        )}
                     </div>

                     <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 flex items-center gap-1">
                              <Radio className="w-3 h-3 text-red-500 animate-pulse" /> Radio Easter Egg
                           </span>
                        </div>
                        <h4 className="text-white font-bold text-sm truncate leading-tight mt-0.5">
                           {activeTrack.title}
                        </h4>
                        <p className="text-xs text-white/50 truncate mt-0.5">
                           {activeTrack.badge}
                        </p>
                     </div>
                  </div>

                  {/* Close button */}
                  <button
                     onClick={closePlayer}
                     className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                     title="Close"
                  >
                     <X className="w-4 h-4" />
                  </button>
               </div>

               {errorMsg ? (
                  <div className="mt-3 text-[11px] text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg p-2 leading-snug">
                     {errorMsg}
                  </div>
               ) : (
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                     {/* Visualizer bars */}
                     <div className="flex items-end gap-1 h-4">
                        <span
                           className={`w-1 bg-white/70 rounded-full transition-all duration-150 ${
                              isPlaying ? 'h-3 animate-pulse' : 'h-1'
                           }`}
                           style={{ backgroundColor: activeTrack.primaryColor }}
                        />
                        <span
                           className={`w-1 bg-white/70 rounded-full transition-all duration-300 ${
                              isPlaying ? 'h-4 animate-bounce' : 'h-1'
                           }`}
                           style={{ backgroundColor: activeTrack.accentColor }}
                        />
                        <span
                           className={`w-1 bg-white/70 rounded-full transition-all duration-200 ${
                              isPlaying ? 'h-2 animate-pulse' : 'h-1'
                           }`}
                           style={{ backgroundColor: activeTrack.primaryColor }}
                        />
                     </div>

                     {/* Audio Controls */}
                     <div className="flex items-center gap-2">
                        <button
                           onClick={toggleMute}
                           className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                           title={isMuted ? 'Unmute' : 'Mute'}
                        >
                           {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <button
                           onClick={togglePlay}
                           className="p-2 text-white rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                           style={{
                              backgroundColor: activeTrack.primaryColor,
                           }}
                           title={isPlaying ? 'Pause' : 'Play'}
                        >
                           {isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                           ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                           )}
                        </button>
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export default EasterEggPlayer;
