import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Medal, Zap, Flag, Timer } from 'lucide-react';
import { resolveTheme, getDriverImage } from '../../config/teamThemes';
import type { RaceResult, SessionResultType } from '../../types';

/* ─── FitText: shrinks text to fit its container width ─── */
interface FitTextProps {
   text: string;
   maxPx: number;
   minPx: number;
   className?: string;
}

const FitText: React.FC<FitTextProps> = ({ text, maxPx, minPx, className }) => {
   const ref = React.useRef<HTMLSpanElement>(null);
   const [fontSize, setFontSize] = useState(maxPx);

   React.useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;

      const fit = () => {
         let size = maxPx;
         el.style.fontSize = `${size}px`;
         while (el.scrollWidth > el.clientWidth && size > minPx) {
            size -= 1;
            el.style.fontSize = `${size}px`;
         }
         setFontSize(size);
      };

      fit();

      const ro = new ResizeObserver(fit);
      ro.observe(el);
      return () => ro.disconnect();
   }, [text, maxPx, minPx]);

   return (
      <span
         ref={ref}
         className={className}
         style={{ fontSize: `${fontSize}px`, whiteSpace: 'nowrap', display: 'block', width: '100%' }}
      >
         {text}
      </span>
   );
};

function getSessionDisplayTime(result: RaceResult): string {
   const isValidTime = (val?: string | null): boolean => {
      if (!val) return false;
      const trimmed = val.trim();
      if (!trimmed || trimmed === '-' || trimmed === '—') return false;
      const lower = trimmed.toLowerCase();
      if (lower.includes('lap') || lower.includes('qualified') || lower.includes('no time')) return false;
      return true;
   };

   // For Qualifying / Sprint Qualifying:
   // Drivers who make Q3 have q3; eliminated in Q2 have q2; eliminated in Q1 have q1
   if (isValidTime(result.q3)) return result.q3!.trim();
   if (isValidTime(result.q2)) return result.q2!.trim();
   if (isValidTime(result.q1)) return result.q1!.trim();
   if (isValidTime(result.status)) return result.status!.trim();
   return '—';
}

/* ─── Podium driver portrait card — F1 social-media style ─── */
interface PodiumCardProps {
   result: RaceResult;
   position: 1 | 2 | 3;
   elevated?: boolean;
   isPointsSession?: boolean;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ result, position, elevated, isPointsSession }) => {
   const [imgErr, setImgErr] = useState(false);
   const theme = resolveTheme(result.constructorName);
   const imgUrl = theme ? getDriverImage(theme, result.driverFirstName, result.driverLastName) : null;
   const initials = `${result.driverFirstName[0]}${result.driverLastName[0]}`;

   return (
      <div className={`podium-card flex-1 overflow-hidden ${elevated ? 'mt-0' : 'mt-6 sm:mt-8'}`}>
         {/* Image + overlays */}
         <div className={`relative w-full ${elevated ? 'h-[170px] sm:h-[260px]' : 'h-[140px] sm:h-[210px]'}`}>
            <div
               className="absolute inset-0 z-0"
               style={{
                  background: `linear-gradient(180deg, ${result.constructorColor}CC 0%, ${result.constructorColor}CC 50%, #0d0d16 100%)`,
               }}
            />

            <div className="absolute top-1 left-1 sm:top-2 sm:left-3 z-[5] pointer-events-none select-none">
               <span
                  className={`leading-none ${elevated ? 'text-[3rem] sm:text-[7.5rem]' : 'text-[2.5rem] sm:text-[6.25rem]'}`}
                  style={{
                     fontFamily: "'Unbounded', sans-serif",
                     fontWeight: 900,
                     letterSpacing: '-0.02em',
                     lineHeight: 1,
                     color: '#FFFFFF',
                  }}
               >
                  {position}
               </span>
            </div>

            {imgUrl && !imgErr ? (
               <img
                  src={imgUrl}
                  alt={`${result.driverFirstName} ${result.driverLastName}`}
                  className="absolute inset-y-0 right-0 h-full w-[85%] object-cover object-[center_-5%] sm:object-top z-10"
                  onError={() => setImgErr(true)}
               />
            ) : (
               <div
                  className="absolute inset-0 flex items-center justify-center font-display font-black text-3xl sm:text-5xl z-10"
                  style={{ color: `${result.constructorColor}80` }}
               >
                  {initials}
               </div>
            )}

            <div
               className="absolute bottom-0 inset-x-0 h-1/2 pointer-events-none z-20"
               style={{
                  background: `linear-gradient(to top, ${result.constructorColor}28 0%, transparent 100%)`,
               }}
            />

            <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 flex flex-col items-end z-30">
               {isPointsSession ? (
                  <>
                     {result.fastestLap && (
                        <span className="text-[7px] sm:text-[8px] font-mono font-bold text-purple-300 bg-purple-900/60 px-1 py-0.5 rounded border border-purple-400/40 mb-0.5 backdrop-blur-sm">
                           FL
                        </span>
                     )}
                     <span className="font-display font-black text-base sm:text-2xl text-white leading-none">
                        {result.points}
                     </span>
                     <span className="text-[8px] sm:text-[9px] font-mono text-white/60 uppercase tracking-widest">PTS</span>
                  </>
               ) : (
                  <span className="font-mono font-bold text-[11px] sm:text-xs text-white/90 bg-black/40 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm">
                     {getSessionDisplayTime(result)}
                  </span>
               )}
            </div>
         </div>

         <div
            className={`px-2 sm:px-3 flex flex-col items-center justify-center text-center ${elevated ? 'h-[52px] sm:h-[62px]' : 'h-[46px] sm:h-[56px]'
               }`}
            style={{ backgroundColor: result.constructorColor }}
         >
            <FitText
               text={result.driverLastName}
               maxPx={elevated ? 20 : 18}
               minPx={11}
               className="font-display font-black text-white text-center uppercase tracking-wide leading-tight"
            />
            <span className="text-[9px] sm:text-[10px] font-mono text-white/70 uppercase tracking-widest truncate w-full mt-0.5">
               {result.constructorName}
            </span>
         </div>
      </div>
   );
};

/* ─── Grid row (P4–P10) — F1 broadcast style ─── */
const DriverGridRow: React.FC<{
   result: RaceResult;
   index: number;
   isPointsSession?: boolean;
}> = ({ result, index, isPointsSession }) => {
   const theme = resolveTheme(result.constructorName);
   const timeStr = getSessionDisplayTime(result);

   return (
      <div className="grid-row" style={{ animationDelay: `${index * 25}ms`, animationFillMode: 'both' }}>
         <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#E10600' }}>
            <span className="font-display font-black text-xs text-white">{result.position}</span>
         </div>

         <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: result.constructorColor }} />

         <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-display font-black text-f1-white uppercase tracking-wide truncate block">
               {result.driverFirstName} {result.driverLastName}
            </span>
            {isPointsSession && result.fastestLap && (
               <span className="text-[8px] font-mono font-bold text-purple-300 bg-purple-900/50 px-1 py-0.2 rounded border border-purple-400/30 shrink-0">
                  FL
               </span>
            )}
         </div>

         <div className="hidden sm:flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            {theme?.teamLogoUrl && (
               <img
                  src={theme.teamLogoUrl}
                  alt={result.constructorName}
                  className="h-4 w-auto object-contain opacity-80 shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
               />
            )}
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-f1-silver/60 truncate text-right">
               {result.constructorName}
            </span>
         </div>

         {theme?.teamLogoUrl && (
            <img
               src={theme.teamLogoUrl}
               alt={result.constructorName}
               className="sm:hidden h-4 w-auto object-contain opacity-80 shrink-0"
               onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
         )}

         <div className="flex flex-col items-end shrink-0 ml-2">
            {isPointsSession ? (
               <>
                  <span className="font-display font-black text-base leading-none" style={{ color: '#FBBF24' }}>
                     {result.points > 0 ? result.points : '—'}
                  </span>
                  {result.points > 0 && (
                     <span className="text-[9px] font-mono text-f1-silver/40 uppercase tracking-widest">PTS</span>
                  )}
               </>
            ) : (
               <span className="font-mono font-semibold text-xs text-f1-white leading-none">
                  {timeStr}
               </span>
            )}
         </div>
      </div>
   );
};

/* ─── Section: Recent Race / Sprint / Quali Results ─── */
export interface LastRaceResultsProps {
   raceId: string | number;
   raceName: string;
   sessionType?: SessionResultType;
   sessionDate?: string;
   sprintDate?: string;
   raceDate?: string;
   results: RaceResult[];
   sprintResults?: RaceResult[];
   raceResults?: RaceResult[];
   qualifyingResults?: RaceResult[];
   sprintQualifyingResults?: RaceResult[];
}

const LastRaceResults: React.FC<LastRaceResultsProps> = ({
   raceId,
   raceName,
   sessionType = 'RACE',
   sessionDate,
   sprintDate,
   raceDate,
   results,
   sprintResults,
   raceResults,
   qualifyingResults,
   sprintQualifyingResults,
}) => {
   const [viewMode, setViewMode] = useState<SessionResultType>(sessionType);

   // Sync viewMode if sessionType changes from query refetch
   React.useEffect(() => {
      setViewMode(sessionType);
   }, [sessionType]);

   const availableSessions: Array<{ type: SessionResultType; label: string }> = [];
   if (raceResults && raceResults.length > 0) availableSessions.push({ type: 'RACE', label: 'Grand Prix' });
   if (qualifyingResults && qualifyingResults.length > 0) availableSessions.push({ type: 'QUALIFYING', label: 'Qualifying' });
   if (sprintResults && sprintResults.length > 0) availableSessions.push({ type: 'SPRINT', label: 'Sprint' });
   if (sprintQualifyingResults && sprintQualifyingResults.length > 0) availableSessions.push({ type: 'SPRINT_QUALIFYING', label: 'Sprint Quali' });

   const isSprint = viewMode === 'SPRINT';
   const isQualifying = viewMode === 'QUALIFYING';
   const isSprintQualifying = viewMode === 'SPRINT_QUALIFYING';
   const isPointsSession = viewMode === 'RACE' || viewMode === 'SPRINT';

   const activeResults =
      viewMode === 'SPRINT'
         ? sprintResults && sprintResults.length > 0
            ? sprintResults
            : results
         : viewMode === 'QUALIFYING'
            ? qualifyingResults && qualifyingResults.length > 0
               ? qualifyingResults
               : results
         : viewMode === 'SPRINT_QUALIFYING'
            ? sprintQualifyingResults && sprintQualifyingResults.length > 0
               ? sprintQualifyingResults
               : results
         : raceResults && raceResults.length > 0
            ? raceResults
            : results;

   // Compute distinct date based on active view mode
   const activeDate = isSprint
      ? sprintDate || (sessionType === 'SPRINT' ? sessionDate : undefined)
      : raceDate || sessionDate;

   const resolvedDate = (() => {
      if (activeDate) return activeDate;
      if (isSprint) {
         const baseDate = raceDate || sessionDate;
         if (baseDate) {
            try {
               const [y, m, d] = baseDate.split('-').map(Number);
               if (y && m && d) {
                  const dt = new Date(Date.UTC(y, m - 1, d));
                  dt.setUTCDate(dt.getUTCDate() - 1);
                  return dt.toISOString().split('T')[0];
               }
            } catch {
               // ignore
            }
         }
      }
      return sessionDate;
   })();

   // Show only positions 1–10 directly (lapped/non-scoring drivers are always P11+)
   const top10 = [...activeResults]
      .sort((a, b) => a.position - b.position)
      .filter((r) => r.position >= 1 && r.position <= 10);

   const p1 = top10.find((r) => r.position === 1);
   const p2 = top10.find((r) => r.position === 2);
   const p3 = top10.find((r) => r.position === 3);
   const rest = top10.filter((r) => r.position > 3);

   if (top10.length === 0) return null;

   const destinationTab =
      viewMode === 'SPRINT'
         ? 'sprint'
         : viewMode === 'QUALIFYING'
            ? 'qualifying'
            : viewMode === 'SPRINT_QUALIFYING'
               ? 'sprint_qualifying'
               : 'race';

   return (
      <div className="space-y-3">
         {/* Section header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
               <div
                  className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
                     isSprint
                        ? 'bg-amber-400/15 border-amber-400/30 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                        : isQualifying || isSprintQualifying
                           ? 'bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                           : 'bg-red-500/15 border-red-500/30 text-f1-red-light'
                  }`}
               >
                  {isSprint ? (
                     <Zap className="w-4 h-4 fill-amber-400" />
                  ) : isQualifying || isSprintQualifying ? (
                     <Timer className="w-4 h-4 text-purple-400" />
                  ) : (
                     <Medal className="w-4 h-4" />
                  )}
               </div>
               <div className="min-w-0">
                  <div className="flex items-center gap-2">
                     <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50">
                        {isSprint
                           ? 'Last Sprint Results'
                           : isQualifying
                              ? 'Last Qualifying Results'
                              : isSprintQualifying
                                 ? 'Last Sprint Shootout Results'
                                 : 'Last Race Results'}
                        {resolvedDate && <span className="ml-1.5 text-f1-silver/40">• {resolvedDate}</span>}
                     </p>
                     {/* Session Type Pill Badge */}
                     <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border ${
                           isSprint
                              ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                              : isQualifying
                                 ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                 : isSprintQualifying
                                    ? 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30'
                                    : 'bg-f1-red/15 text-f1-red-light border-f1-red/30'
                        }`}
                     >
                        {isSprint ? (
                           <>
                              <Zap className="w-2.5 h-2.5 fill-current" />
                              SPRINT
                           </>
                        ) : isQualifying ? (
                           <>
                              <Timer className="w-2.5 h-2.5" />
                              QUALIFYING
                           </>
                        ) : isSprintQualifying ? (
                           <>
                              <Timer className="w-2.5 h-2.5" />
                              SPRINT QUALI
                           </>
                        ) : (
                           <>
                              <Flag className="w-2.5 h-2.5" />
                              GRAND PRIX
                           </>
                        )}
                     </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-display font-black text-f1-white leading-tight truncate mt-0.5">
                     {raceName}
                  </h3>
               </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
               {/* Quick toggle if multiple sessions exist for this round */}
               {availableSessions.length > 1 && (
                  <div className="inline-flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.08]">
                     {availableSessions.map((session) => (
                        <button
                           key={session.type}
                           type="button"
                           onClick={() => setViewMode(session.type)}
                           className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all flex items-center gap-1 ${
                              viewMode === session.type
                                 ? session.type === 'SPRINT'
                                    ? 'bg-amber-400 text-black shadow-sm font-bold'
                                    : session.type === 'QUALIFYING' || session.type === 'SPRINT_QUALIFYING'
                                       ? 'bg-purple-500 text-white shadow-sm font-bold'
                                       : 'bg-f1-red text-white shadow-sm font-bold'
                                 : 'text-f1-silver/60 hover:text-white'
                           }`}
                        >
                           {session.type === 'SPRINT' && <Zap className="w-3 h-3 fill-current" />}
                           {(session.type === 'QUALIFYING' || session.type === 'SPRINT_QUALIFYING') && (
                              <Timer className="w-3 h-3" />
                           )}
                           {session.label}
                           {sessionType === session.type && <span className="text-[9px] opacity-75">★</span>}
                        </button>
                     ))}
                  </div>
               )}

               <Link
                  to={`/races/${raceId}?tab=${destinationTab}`}
                  className="flex items-center gap-1 text-xs font-mono text-f1-silver/60 hover:text-f1-red-light transition-colors bg-white/[0.04] hover:bg-white/[0.07] px-3 py-1.5 rounded-lg border border-white/[0.06] group shrink-0"
               >
                  <span className="hidden xs:inline">Full Results</span>
                  <span className="xs:hidden">Results</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
               </Link>
            </div>
         </div>

         {/* Podium — P2 | P1 (elevated) | P3 */}
         <div className="flex items-end gap-1.5 sm:gap-3">
            {p2 && <PodiumCard result={p2} position={2} isPointsSession={isPointsSession} />}
            {p1 && <PodiumCard result={p1} position={1} elevated isPointsSession={isPointsSession} />}
            {p3 && <PodiumCard result={p3} position={3} isPointsSession={isPointsSession} />}
         </div>

         {/* P4–P10 grid */}
         {rest.length > 0 && (
            <div className="space-y-1.5 pt-1">
               {rest.map((result, idx) => (
                  <DriverGridRow
                     key={result.id}
                     result={result}
                     index={idx}
                     isPointsSession={isPointsSession}
                  />
               ))}
            </div>
         )}
      </div>
   );
};

export default LastRaceResults;