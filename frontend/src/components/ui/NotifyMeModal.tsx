import React, { useState, useEffect, useCallback } from 'react';
import {
   Bell, X, Check, Mail, Calendar, Flag, Clock, ShieldCheck,
   AlertCircle, Loader2, Trash2, CheckCircle2, Trophy, Sparkles
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import type { SubscriptionRequest, SubscriptionResponse } from '../../types';

interface NotifyMeModalProps {
   isOpen: boolean;
   onClose: () => void;
   raceId: number;
   raceName: string;
   circuitName?: string | null;
   country?: string | null;
   sessionName?: string | null;
}

const LOCAL_STORAGE_EMAIL_KEY = 'f1_alert_email_pref';

export const NotifyMeModal: React.FC<NotifyMeModalProps> = ({
   isOpen,
   onClose,
   raceId,
   raceName,
   circuitName,
   country,
   sessionName,
}) => {
   const [email, setEmail] = useState<string>(() => {
      return localStorage.getItem(LOCAL_STORAGE_EMAIL_KEY) || '';
   });
   const [scope, setScope] = useState<'all' | 'single'>('all');
   const [notifyRaceWeek, setNotifyRaceWeek] = useState<boolean>(true);
   const [notifyDayBefore, setNotifyDayBefore] = useState<boolean>(true);
   const [notifyBeforeSession, setNotifyBeforeSession] = useState<boolean>(true);

   const [loading, setLoading] = useState<boolean>(false);
   const [statusLoading, setStatusLoading] = useState<boolean>(false);
   const [error, setError] = useState<string | null>(null);
   const [successData, setSuccessData] = useState<SubscriptionResponse | null>(null);
   const [existingSub, setExistingSub] = useState<SubscriptionResponse | null>(null);
   const [isUnsubscribing, setIsUnsubscribing] = useState<boolean>(false);

   // Check if existing subscription exists for entered email
   const checkExistingStatus = useCallback(async (emailToCheck: string) => {
      if (!emailToCheck || !emailToCheck.includes('@') || !emailToCheck.includes('.')) {
         setExistingSub(null);
         return;
      }
      try {
         setStatusLoading(true);
         const res = await notificationService.getStatus(emailToCheck.trim(), raceId);
         if (res && res.subscribed) {
            setExistingSub(res);
            setNotifyRaceWeek(res.notifyRaceWeek);
            setNotifyDayBefore(res.notifyDayBefore);
            setNotifyBeforeSession(res.notifyBeforeSession);
            if (res.allUpcoming) {
               setScope('all');
            }
         } else {
            setExistingSub(null);
         }
      } catch (err) {
         // Silently ignore status lookup errors on typing
         setExistingSub(null);
      } finally {
         setStatusLoading(false);
      }
   }, [raceId]);

   // Check status on modal open if email is saved
   useEffect(() => {
      if (isOpen) {
         setError(null);
         setSuccessData(null);
         if (email) {
            checkExistingStatus(email);
         }
      }
   }, [isOpen, email, checkExistingStatus]);

   // Handle escape key
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && isOpen) {
            onClose();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, onClose]);

   if (!isOpen) return null;

   const validateEmail = (val: string): boolean => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedEmail = email.trim();
      if (!validateEmail(trimmedEmail)) {
         setError('Please enter a valid email address.');
         return;
      }

      if (!notifyRaceWeek && !notifyDayBefore && !notifyBeforeSession) {
         setError('Please select at least one notification alert type.');
         return;
      }

      try {
         setLoading(true);
         const payload: SubscriptionRequest = {
            email: trimmedEmail,
            raceId: scope === 'single' ? raceId : null,
            notifyRaceWeek,
            notifyDayBefore,
            notifyBeforeSession,
            allUpcoming: scope === 'all',
         };

         const response = await notificationService.subscribe(payload);
         localStorage.setItem(LOCAL_STORAGE_EMAIL_KEY, trimmedEmail);
         setSuccessData(response);
         setExistingSub(response);
      } catch (err: any) {
         const msg = err?.response?.data?.message || err?.message || 'Failed to set up alerts. Please try again.';
         setError(msg);
      } finally {
         setLoading(false);
      }
   };

   const handleUnsubscribe = async (all: boolean = false) => {
      if (!existingSub?.unsubscribeToken) return;
      try {
         setIsUnsubscribing(true);
         setError(null);
         await notificationService.unsubscribe(existingSub.unsubscribeToken, all || existingSub.allUpcoming);
         setExistingSub(null);
         setSuccessData(null);
      } catch (err: any) {
         const msg = err?.response?.data?.message || err?.message || 'Failed to unsubscribe.';
         setError(msg);
      } finally {
         setIsUnsubscribing(false);
      }
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
         {/* Dialog Card */}
         <div
            className="relative w-full max-w-lg bg-[#12121c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-f1-white max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
         >
            {/* Top Red Racing Stripe */}
            <div className="h-1 bg-gradient-to-r from-f1-red via-f1-red-light to-amber-500 shrink-0" />

            {/* Modal Header */}
            <div className="p-6 pb-4 flex items-start justify-between border-b border-white/[0.06] shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-f1-red/15 border border-f1-red/30 flex items-center justify-center text-f1-red shadow-[0_0_15px_rgba(225,6,0,0.3)] shrink-0">
                     <Bell className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-f1-red-light uppercase">
                           Telemetry Alerts
                        </span>
                        {existingSub && (
                           <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              {existingSub.allUpcoming
                                 ? `Season Pass (${existingSub.totalSubscribedRaces || 'All'} GPs)`
                                 : 'Active Sub'}
                           </span>
                        )}
                     </div>
                     <h3 className="text-xl font-black font-display tracking-tight text-f1-white uppercase mt-0.5">
                        Race Weekend Alerts
                     </h3>
                  </div>
               </div>

               <button
                  type="button"
                  onClick={onClose}
                  className="text-f1-silver/50 hover:text-f1-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                  aria-label="Close modal"
               >
                  <X className="w-5 h-5" />
               </button>
            </div>

            {/* Race Summary Strip */}
            <div className="px-6 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono shrink-0">
               <div className="min-w-0 pr-3">
                  <div className="font-bold text-f1-white truncate">{raceName}</div>
                  {(circuitName || country) && (
                     <div className="text-f1-silver/60 text-[11px] truncate">
                        {circuitName}{circuitName && country ? ' · ' : ''}{country}
                     </div>
                  )}
               </div>
               {sessionName && (
                  <div className="px-2.5 py-1 rounded bg-f1-red/10 border border-f1-red/20 text-f1-red-light text-[10px] font-semibold shrink-0 uppercase tracking-wider">
                     Next: {sessionName}
                  </div>
               )}
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto flex-1">
               {successData ? (
                  <div className="p-6 space-y-5">
                     <div className="flex flex-col items-center text-center p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                           <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h4 className="text-lg font-bold font-display uppercase tracking-wide text-white">
                           {successData.allUpcoming ? 'Season Pass Activated!' : (successData.message || 'Alerts Activated!')}
                        </h4>
                        <p className="text-xs text-f1-silver/80 mt-1 max-w-sm">
                           {successData.allUpcoming
                              ? `You're locked in for all ${successData.totalSubscribedRaces || ''} upcoming Grands Prix on the calendar! Alerts will be delivered directly to `
                              : `You're locked in for ${successData.raceName || raceName}. Alerts will be delivered directly to `}
                           <span className="text-white font-mono font-semibold">{successData.email}</span>.
                        </p>
                     </div>

                     <div className="space-y-2 text-xs font-mono text-f1-silver/70 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
                        <div className="text-[11px] uppercase tracking-wider text-f1-silver/50 font-bold mb-1">Configured Triggers:</div>
                        {successData.notifyRaceWeek && (
                           <div className="flex items-center gap-2 text-f1-white">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Race week kickoff (Monday 08:00 UTC)</span>
                           </div>
                        )}
                        {successData.notifyDayBefore && (
                           <div className="flex items-center gap-2 text-f1-white">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>24-hour race day countdown alert</span>
                           </div>
                        )}
                        {successData.notifyBeforeSession && (
                           <div className="flex items-center gap-2 text-f1-white">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>5-minute warning before every practice, qualifying & race</span>
                           </div>
                        )}
                     </div>

                     <div className="flex gap-3">
                        <button
                           type="button"
                           onClick={() => setSuccessData(null)}
                           className="flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-f1-silver hover:text-white transition-colors border border-white/[0.08]"
                        >
                           Edit Preferences
                        </button>
                        <button
                           type="button"
                           onClick={onClose}
                           className="flex-1 py-2.5 px-4 rounded-xl text-xs font-mono font-bold bg-f1-red hover:bg-f1-red-dark text-white transition-all shadow-[0_0_20px_rgba(225,6,0,0.4)]"
                        >
                           Done
                        </button>
                     </div>
                  </div>
               ) : (
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                     {error && (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-red-400 text-xs">
                           <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                           <span>{error}</span>
                        </div>
                     )}

                     {/* Coverage Scope Selection */}
                     <div>
                        <div className="flex items-center justify-between mb-2">
                           <label className="text-xs font-mono font-semibold text-f1-silver/80 uppercase tracking-wider">
                              Coverage Scope
                           </label>
                           <span className="text-[10px] font-mono text-f1-red-light uppercase tracking-wider font-semibold">
                              {scope === 'all' ? '🏁 Recommended' : '🎯 Single GP'}
                           </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           {/* Option 1: Season Pass (All Upcoming Races) */}
                           <button
                              type="button"
                              onClick={() => setScope('all')}
                              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                                 scope === 'all'
                                    ? 'bg-f1-red/15 border-f1-red text-white shadow-[0_0_15px_rgba(225,6,0,0.25)]'
                                    : 'bg-white/[0.03] border-white/[0.08] text-f1-silver/70 hover:bg-white/[0.06]'
                              }`}
                           >
                              <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-white">
                                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="uppercase">Season Pass</span>
                                 </div>
                                 {scope === 'all' && (
                                    <span className="w-2 h-2 rounded-full bg-f1-red animate-pulse" />
                                 )}
                              </div>
                              <p className="text-[11px] text-f1-silver/70 leading-snug">
                                 All upcoming races on the 2026 calendar
                              </p>
                           </button>

                           {/* Option 2: This Grand Prix Only */}
                           <button
                              type="button"
                              onClick={() => setScope('single')}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                 scope === 'single'
                                    ? 'bg-f1-red/15 border-f1-red text-white shadow-[0_0_15px_rgba(225,6,0,0.25)]'
                                    : 'bg-white/[0.03] border-white/[0.08] text-f1-silver/70 hover:bg-white/[0.06]'
                              }`}
                           >
                              <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-white">
                                    <Flag className="w-3.5 h-3.5 text-f1-red-light" />
                                    <span className="uppercase">This GP Only</span>
                                 </div>
                                 {scope === 'single' && (
                                    <span className="w-2 h-2 rounded-full bg-f1-red animate-pulse" />
                                 )}
                              </div>
                              <p className="text-[11px] text-f1-silver/70 leading-snug truncate">
                                 {raceName} only
                              </p>
                           </button>
                        </div>
                     </div>

                     {/* Email Input */}
                     <div>
                        <label className="block text-xs font-mono font-semibold text-f1-silver/80 uppercase tracking-wider mb-2">
                           Recipient Email Address
                        </label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-f1-silver/50">
                              <Mail className="w-4 h-4" />
                           </div>
                           <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onBlur={() => checkExistingStatus(email)}
                              placeholder="driver@formula1.com"
                              required
                              className="w-full pl-10 pr-10 py-3 bg-[#171724] border border-white/10 focus:border-f1-red focus:ring-1 focus:ring-f1-red rounded-xl text-sm text-f1-white placeholder-f1-silver/30 transition-all font-mono outline-none"
                           />
                           {statusLoading && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                 <Loader2 className="w-4 h-4 text-f1-silver/40 animate-spin" />
                              </div>
                           )}
                        </div>
                        <p className="text-[11px] text-f1-silver/50 font-mono mt-1.5">
                           No spam. Only telemetry alerts and instant session reminders.
                        </p>
                     </div>

                     {/* Notification Triggers Selection */}
                     <div className="space-y-2">
                        <label className="block text-xs font-mono font-semibold text-f1-silver/80 uppercase tracking-wider">
                           Alert Frequencies
                        </label>

                        {/* 1. Race Week */}
                        <label className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] cursor-pointer transition-all">
                           <input
                              type="checkbox"
                              checked={notifyRaceWeek}
                              onChange={(e) => setNotifyRaceWeek(e.target.checked)}
                              className="mt-1 w-4 h-4 rounded border-white/20 bg-black/40 text-f1-red focus:ring-f1-red focus:ring-offset-0 transition-colors accent-f1-red cursor-pointer"
                           />
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                 <Flag className="w-3.5 h-3.5 text-f1-red-light" />
                                 <span className="text-xs font-bold text-f1-white font-mono">Race Week Kickoff</span>
                              </div>
                              <p className="text-[11px] text-f1-silver/60 mt-0.5">
                                 Alert sent on Monday morning when the Grand Prix week commences.
                              </p>
                           </div>
                        </label>

                        {/* 2. Day Before Race */}
                        <label className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] cursor-pointer transition-all">
                           <input
                              type="checkbox"
                              checked={notifyDayBefore}
                              onChange={(e) => setNotifyDayBefore(e.target.checked)}
                              className="mt-1 w-4 h-4 rounded border-white/20 bg-black/40 text-f1-red focus:ring-f1-red focus:ring-offset-0 transition-colors accent-f1-red cursor-pointer"
                           />
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                 <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                 <span className="text-xs font-bold text-f1-white font-mono">24 Hours Before Lights Out</span>
                              </div>
                              <p className="text-[11px] text-f1-silver/60 mt-0.5">
                                 Summary briefing sent the day prior to the Sunday Grand Prix.
                              </p>
                           </div>
                        </label>

                        {/* 3. 5 min before sessions */}
                        <label className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] cursor-pointer transition-all">
                           <input
                              type="checkbox"
                              checked={notifyBeforeSession}
                              onChange={(e) => setNotifyBeforeSession(e.target.checked)}
                              className="mt-1 w-4 h-4 rounded border-white/20 bg-black/40 text-f1-red focus:ring-f1-red focus:ring-offset-0 transition-colors accent-f1-red cursor-pointer"
                           />
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                 <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                 <span className="text-xs font-bold text-f1-white font-mono">5 Minutes Before Each Session</span>
                              </div>
                              <p className="text-[11px] text-f1-silver/60 mt-0.5">
                                 Instant green-flag warning before FP1, FP2, FP3, Qualifying, Sprint, and Race.
                              </p>
                           </div>
                        </label>
                     </div>

                     {/* Actions */}
                     <div className="pt-2 flex flex-col gap-2">
                        <button
                           type="submit"
                           disabled={loading}
                           className="w-full py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-f1-red hover:bg-f1-red-dark active:scale-[0.99] disabled:opacity-50 text-white transition-all shadow-[0_0_20px_rgba(225,6,0,0.35)] flex items-center justify-center gap-2"
                        >
                           {loading ? (
                              <>
                                 <Loader2 className="w-4 h-4 animate-spin" />
                                 <span>Activating Telemetry Alerts...</span>
                              </>
                           ) : existingSub ? (
                              <>
                                 <Check className="w-4 h-4" />
                                 <span>Update {scope === 'all' ? 'Season Pass' : 'Grand Prix'} Preferences</span>
                              </>
                           ) : (
                              <>
                                 <Bell className="w-4 h-4" />
                                 <span>{scope === 'all' ? 'Notify Me For All Upcoming Races' : 'Notify Me For This Grand Prix'}</span>
                              </>
                           )}
                        </button>

                        {existingSub && (
                           <button
                              type="button"
                              onClick={() => handleUnsubscribe(existingSub.allUpcoming)}
                              disabled={isUnsubscribing}
                              className="w-full py-2 px-3 rounded-lg text-[11px] font-mono text-f1-silver/50 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
                           >
                              {isUnsubscribing ? (
                                 <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                 <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>
                                 {existingSub.allUpcoming
                                    ? 'Unsubscribe from all race alerts'
                                    : `Unsubscribe from ${raceName} alerts`}
                              </span>
                           </button>
                        )}
                     </div>
                  </form>
               )}
            </div>
         </div>
      </div>
   );
};

export default NotifyMeModal;
