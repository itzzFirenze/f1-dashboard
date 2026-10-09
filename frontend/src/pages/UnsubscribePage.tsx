import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
   BellOff,
   CheckCircle2,
   AlertTriangle,
   ArrowLeft,
   Home,
   Calendar,
   Mail,
   Radio,
   Loader2,
   Flag,
   ShieldCheck,
   Check,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import type { SubscriptionResponse } from '../types';

type PageStatus = 'loading' | 'confirm' | 'success' | 'already_unsubscribed' | 'no_token';

const UnsubscribePage: React.FC = () => {
   const { token } = useParams<{ token?: string }>();
   const navigate = useNavigate();

   const [status, setStatus] = useState<PageStatus>(token ? 'loading' : 'no_token');
   const [subData, setSubData] = useState<SubscriptionResponse | null>(null);
   const [unsubscribeAll, setUnsubscribeAll] = useState<boolean>(false);
   const [emailInput, setEmailInput] = useState<string>('');
   const [actionLoading, setActionLoading] = useState<boolean>(false);
   const [errorMsg, setErrorMsg] = useState<string | null>(null);
   const [unsubscribedScope, setUnsubscribedScope] = useState<'single' | 'all'>('single');

   useEffect(() => {
      let isMounted = true;

      if (!token) {
         setStatus('no_token');
         return;
      }

      const verifyToken = async () => {
         try {
            const data = await notificationService.getSubscriptionByToken(token);
            if (isMounted) {
               setSubData(data);
               setUnsubscribeAll(Boolean(data.allUpcoming));
               setStatus('confirm');
            }
         } catch (err: any) {
            if (isMounted) {
               const httpStatus = err?.response?.status;
               if (httpStatus === 404 && err?.response?.data?.message?.includes('already unsubscribed')) {
                  setStatus('already_unsubscribed');
               } else {
                  // Fallback: If GET endpoint is 404/not implemented or token cannot be previewed,
                  // allow direct unsubscription using the token
                  setStatus('confirm');
               }
            }
         }
      };

      verifyToken();

      return () => {
         isMounted = false;
      };
   }, [token]);

   const handleUnsubscribeWithToken = async (allScope: boolean) => {
      if (!token) return;
      try {
         setActionLoading(true);
         setErrorMsg(null);
         await notificationService.unsubscribe(token, allScope);
         setUnsubscribedScope(allScope ? 'all' : 'single');
         setStatus('success');
      } catch (err: any) {
         const httpStatus = err?.response?.status;
         if (httpStatus === 404) {
            setStatus('already_unsubscribed');
         } else {
            const msg = err?.response?.data?.message || err?.message || 'Failed to unsubscribe. Please try again.';
            setErrorMsg(msg);
         }
      } finally {
         setActionLoading(false);
      }
   };

   const handleUnsubscribeWithEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = emailInput.trim();
      if (!trimmed || !trimmed.includes('@')) {
         setErrorMsg('Please enter a valid email address.');
         return;
      }

      try {
         setActionLoading(true);
         setErrorMsg(null);
         await notificationService.unsubscribeAll(trimmed);
         setUnsubscribedScope('all');
         setStatus('success');
      } catch (err: any) {
         const msg = err?.response?.data?.message || err?.message || 'Failed to unsubscribe. Please try again.';
         setErrorMsg(msg);
      } finally {
         setActionLoading(false);
      }
   };

   return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 animate-fade-in">
         <div className="telemetry-card max-w-xl w-full p-6 sm:p-10 relative overflow-hidden text-left border border-white/[0.08] shadow-2xl bg-f1-carbon/90 backdrop-blur-xl">
            {/* Top glowing accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-f1-red to-transparent" />
            <div className="scanline-overlay pointer-events-none" />

            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-f1-red/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
               {/* Telemetry Header Badge */}
               <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-f1-graphite/60 border border-white/10">
                     <Radio className="w-3.5 h-3.5 text-f1-red animate-pulse" />
                     <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-f1-silver/90">
                        Race Alert Telemetry
                     </span>
                  </div>

                  <span className="text-[11px] font-mono text-f1-silver/50 uppercase tracking-wider">
                     F1 Dashboard Notification Control
                  </span>
               </div>

               {/* ─── State: Loading ─── */}
               {status === 'loading' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                     <div className="relative w-14 h-14 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-f1-red/20 border-t-f1-red animate-spin" />
                        <BellOff className="w-6 h-6 text-f1-silver/60" />
                     </div>
                     <div>
                        <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white">
                           Fetching Subscription Details
                        </h2>
                        <p className="text-sm font-sans text-f1-silver/60 mt-1">
                           Verifying your notification telemetry key...
                        </p>
                     </div>
                  </div>
               )}

               {/* ─── State: Confirm Unsubscribe ─── */}
               {status === 'confirm' && (
                  <div>
                     <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-f1-red/15 border border-f1-red/30 flex items-center justify-center shrink-0 shadow-lg shadow-f1-red/10">
                           <BellOff className="w-6 h-6 text-f1-red" />
                        </div>
                        <div>
                           <h1 className="text-xl sm:text-2xl font-display font-black uppercase text-white tracking-wide">
                              Unsubscribe from Alerts
                           </h1>
                           <p className="text-sm text-f1-silver/80 mt-1 font-sans">
                              Manage or disable race weekend notifications sent to your email.
                           </p>
                        </div>
                     </div>

                     {/* Subscription Summary Box */}
                     <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.08] mb-6 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono text-f1-silver/60 border-b border-white/[0.05] pb-2">
                           <span className="uppercase tracking-wider">Target Event</span>
                           <span className="text-white font-medium flex items-center gap-1.5">
                              <Flag className="w-3.5 h-3.5 text-f1-red" />
                              {subData?.raceName || 'Formula 1 Race Alerts'}
                           </span>
                        </div>

                        {subData?.email && (
                           <div className="flex items-center justify-between text-xs font-mono text-f1-silver/60 border-b border-white/[0.05] pb-2">
                              <span className="uppercase tracking-wider">Recipient</span>
                              <span className="text-f1-silver font-medium flex items-center gap-1.5">
                                 <Mail className="w-3.5 h-3.5 text-f1-silver/50" />
                                 {subData.email}
                              </span>
                           </div>
                        )}

                        <div className="flex items-center justify-between text-xs font-mono text-f1-silver/60">
                           <span className="uppercase tracking-wider">Alert Scope</span>
                           <span className="text-amber-400 font-medium">
                              {subData?.allUpcoming
                                 ? `All Upcoming Races (${subData.totalSubscribedRaces || 'Season'} GPs)`
                                 : 'This Grand Prix Only'}
                           </span>
                        </div>
                     </div>

                     {/* Scope Checkbox if single race */}
                     {(!subData || !subData.allUpcoming) && (
                        <label className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors mb-6 group">
                           <input
                              type="checkbox"
                              checked={unsubscribeAll}
                              onChange={(e) => setUnsubscribeAll(e.target.checked)}
                              className="mt-1 w-4 h-4 rounded border-white/20 bg-f1-graphite text-f1-red focus:ring-f1-red focus:ring-offset-0 cursor-pointer"
                           />
                           <div className="text-xs">
                              <span className="font-medium text-white group-hover:text-f1-red transition-colors">
                                 Unsubscribe from ALL upcoming races
                              </span>
                              <p className="text-f1-silver/60 mt-0.5">
                                 Check this box to remove your email from all future Grand Prix alerts across the season.
                              </p>
                           </div>
                        </label>
                     )}

                     {errorMsg && (
                        <div className="mb-6 p-3 rounded-lg bg-f1-red/10 border border-f1-red/30 flex items-center gap-2.5 text-xs text-f1-red-light font-mono">
                           <AlertTriangle className="w-4 h-4 shrink-0" />
                           <span>{errorMsg}</span>
                        </div>
                     )}

                     {/* Action Buttons */}
                     <div className="flex flex-col sm:flex-row gap-3">
                        <button
                           type="button"
                           disabled={actionLoading}
                           onClick={() => handleUnsubscribeWithToken(unsubscribeAll)}
                           className="flex-1 py-3 px-5 rounded-lg bg-f1-red hover:bg-f1-red-dark text-white font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-f1-red/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                        >
                           {actionLoading ? (
                              <>
                                 <Loader2 className="w-4 h-4 animate-spin" />
                                 <span>Processing...</span>
                              </>
                           ) : (
                              <>
                                 <BellOff className="w-4 h-4" />
                                 <span>
                                    {unsubscribeAll ? 'Unsubscribe From All Races' : 'Confirm Unsubscribe'}
                                 </span>
                              </>
                           )}
                        </button>

                        <button
                           type="button"
                           onClick={() => navigate('/')}
                           className="py-3 px-4 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-f1-silver hover:text-white font-sans text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-white/[0.08]"
                        >
                           <ArrowLeft className="w-4 h-4" />
                           <span>Keep Alerts & Return</span>
                        </button>
                     </div>
                  </div>
               )}

               {/* ─── State: Success ─── */}
               {status === 'success' && (
                  <div className="py-6 text-center space-y-5 animate-fade-in">
                     <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-9 h-9" />
                     </div>

                     <div className="space-y-2">
                        <h2 className="text-2xl font-display font-black uppercase tracking-wide text-white">
                           Successfully Unsubscribed
                        </h2>
                        <p className="text-sm font-sans text-f1-silver/80 max-w-md mx-auto leading-relaxed">
                           {unsubscribedScope === 'all'
                              ? 'You have been unsubscribed from all Formula 1 race alerts. You will not receive any further emails.'
                              : `You have been unsubscribed from alerts for ${subData?.raceName || 'this Grand Prix'}. You will receive no further emails for this event.`}
                        </p>
                     </div>

                     <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-f1-silver/70 max-w-sm mx-auto">
                        <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1.5 mb-1">
                           <Check className="w-3.5 h-3.5" /> Telemetry Status Updated
                        </span>
                        <span>Changed your mind? You can re-enable alerts anytime from any race schedule card.</span>
                     </div>

                     <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                           to="/"
                           className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-f1-red hover:bg-f1-red-dark text-white font-display font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                        >
                           <Home className="w-4 h-4" />
                           <span>Return to Dashboard</span>
                        </Link>
                        <Link
                           to="/races"
                           className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-f1-silver hover:text-white font-sans text-xs font-semibold flex items-center justify-center gap-2 border border-white/[0.08] transition-all"
                        >
                           <Calendar className="w-4 h-4" />
                           <span>View Race Calendar</span>
                        </Link>
                     </div>
                  </div>
               )}

               {/* ─── State: Already Unsubscribed / Token Expired ─── */}
               {status === 'already_unsubscribed' && (
                  <div className="py-6 text-center space-y-5 animate-fade-in">
                     <div className="w-16 h-16 rounded-full bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
                        <ShieldCheck className="w-9 h-9" />
                     </div>

                     <div className="space-y-2">
                        <h2 className="text-2xl font-display font-black uppercase tracking-wide text-white">
                           Already Unsubscribed
                        </h2>
                        <p className="text-sm font-sans text-f1-silver/80 max-w-md mx-auto leading-relaxed">
                           This unsubscribe link has already been processed or is no longer active. You are not currently subscribed to notifications from this token.
                        </p>
                     </div>

                     <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                           to="/"
                           className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-f1-red hover:bg-f1-red-dark text-white font-display font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                        >
                           <Home className="w-4 h-4" />
                           <span>Go to Dashboard</span>
                        </Link>
                        <Link
                           to="/races"
                           className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-f1-silver hover:text-white font-sans text-xs font-semibold flex items-center justify-center gap-2 border border-white/[0.08] transition-all"
                        >
                           <Calendar className="w-4 h-4" />
                           <span>Race Schedule</span>
                        </Link>
                     </div>
                  </div>
               )}

               {/* ─── State: No Token Provided (Manual Email Input) ─── */}
               {status === 'no_token' && (
                  <div>
                     <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-f1-red/15 border border-f1-red/30 flex items-center justify-center shrink-0">
                           <Mail className="w-6 h-6 text-f1-red" />
                        </div>
                        <div>
                           <h1 className="text-xl sm:text-2xl font-display font-black uppercase text-white tracking-wide">
                              Unsubscribe by Email
                           </h1>
                           <p className="text-sm text-f1-silver/80 mt-1 font-sans">
                              Enter your email address to remove all active F1 race weekend alert subscriptions.
                           </p>
                        </div>
                     </div>

                     <form onSubmit={handleUnsubscribeWithEmail} className="space-y-4">
                        <div>
                           <label className="block text-xs font-mono uppercase tracking-wider text-f1-silver/70 mb-2">
                              Your Email Address
                           </label>
                           <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-f1-silver/40" />
                              <input
                                 type="email"
                                 required
                                 placeholder="driver@formula1.com"
                                 value={emailInput}
                                 onChange={(e) => setEmailInput(e.target.value)}
                                 className="w-full pl-10 pr-4 py-3 rounded-lg bg-f1-abyss border border-white/10 text-white placeholder-f1-silver/30 font-sans text-sm focus:outline-none focus:border-f1-red focus:ring-1 focus:ring-f1-red transition-all"
                              />
                           </div>
                        </div>

                        {errorMsg && (
                           <div className="p-3 rounded-lg bg-f1-red/10 border border-f1-red/30 flex items-center gap-2.5 text-xs text-f1-red-light font-mono">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>{errorMsg}</span>
                           </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                           <button
                              type="submit"
                              disabled={actionLoading}
                              className="flex-1 py-3 px-5 rounded-lg bg-f1-red hover:bg-f1-red-dark text-white font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-f1-red/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                           >
                              {actionLoading ? (
                                 <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Unsubscribing...</span>
                                 </>
                              ) : (
                                 <>
                                    <BellOff className="w-4 h-4" />
                                    <span>Unsubscribe All Alerts</span>
                                 </>
                              )}
                           </button>

                           <button
                              type="button"
                              onClick={() => navigate('/')}
                              className="py-3 px-4 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-f1-silver hover:text-white font-sans text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-white/[0.08]"
                           >
                              <ArrowLeft className="w-4 h-4" />
                              <span>Dashboard</span>
                           </button>
                        </div>
                     </form>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default UnsubscribePage;
