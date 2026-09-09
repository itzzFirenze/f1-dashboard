import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Medal } from 'lucide-react';
import { resolveTheme, getDriverImage } from '../../config/teamThemes';
import type { RaceResult } from '../../types';

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

/* ─── Podium driver portrait card — F1 social-media style ─── */
interface PodiumCardProps {
   result: RaceResult;
   position: 1 | 2 | 3;
   elevated?: boolean;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ result, position, elevated }) => {
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
               <span className="font-display font-black text-base sm:text-2xl text-white leading-none">
                  {result.points}
               </span>
               <span className="text-[8px] sm:text-[9px] font-mono text-white/60 uppercase tracking-widest">PTS</span>
            </div>
         </div>

         <div
            className="px-2 sm:px-3 py-2 sm:py-2.5 flex flex-col items-center text-center"
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
const DriverGridRow: React.FC<{ result: RaceResult; index: number }> = ({ result, index }) => {
   const theme = resolveTheme(result.constructorName);
   return (
      <div className="grid-row" style={{ animationDelay: `${index * 25}ms`, animationFillMode: 'both' }}>
         <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#E10600' }}>
            <span className="font-display font-black text-xs text-white">{result.position}</span>
         </div>

         <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: result.constructorColor }} />

         <div className="flex-1 min-w-0">
            <span className="text-xs sm:text-sm font-display font-black text-f1-white uppercase tracking-wide truncate block">
               {result.driverFirstName} {result.driverLastName}
            </span>
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
            <span className="font-display font-black text-base leading-none" style={{ color: '#FBBF24' }}>
               {result.points > 0 ? result.points : '—'}
            </span>
            {result.points > 0 && (
               <span className="text-[9px] font-mono text-f1-silver/40 uppercase tracking-widest">PTS</span>
            )}
         </div>
      </div>
   );
};

/* ─── Section: Last Race Results (podium + P4–P10 grid) ─── */
interface LastRaceResultsProps {
   raceId: string | number;
   raceName: string;
   results: RaceResult[];
}

const LastRaceResults: React.FC<LastRaceResultsProps> = ({ raceId, raceName, results }) => {
   // Show only positions 1–10 directly (lapped/non-scoring drivers are always P11+)
   const top10 = [...results].sort((a, b) => a.position - b.position).filter((r) => r.position >= 1 && r.position <= 10);

   const p1 = top10.find((r) => r.position === 1);
   const p2 = top10.find((r) => r.position === 2);
   const p3 = top10.find((r) => r.position === 3);
   const rest = top10.filter((r) => r.position > 3);

   if (top10.length === 0) return null;

   return (
      <div className="space-y-3">
         {/* Section header */}
         <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
               <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 shrink-0">
                  <Medal className="w-4 h-4 text-amber-400" />
               </div>
               <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-f1-silver/50">Last Race Results</p>
                  <h3 className="text-base sm:text-lg font-display font-black text-f1-white leading-tight truncate">
                     {raceName}
                  </h3>
               </div>
            </div>
            <Link
               to={`/races/${raceId}`}
               className="flex items-center gap-1 text-xs font-mono text-f1-silver/60 hover:text-f1-red-light transition-colors bg-white/[0.04] hover:bg-white/[0.07] px-3 py-1.5 rounded-lg border border-white/[0.06] group shrink-0"
            >
               <span className="hidden xs:inline">Full Results</span>
               <span className="xs:hidden">Results</span>
               <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
         </div>

         {/* Podium — P2 | P1 (elevated) | P3 */}
         <div className="flex items-end gap-1.5 sm:gap-3">
            {p2 && <PodiumCard result={p2} position={2} />}
            {p1 && <PodiumCard result={p1} position={1} elevated />}
            {p3 && <PodiumCard result={p3} position={3} />}
         </div>

         {/* P4–P10 grid */}
         {rest.length > 0 && (
            <div className="space-y-1.5 pt-1">
               {rest.map((result, idx) => (
                  <DriverGridRow key={result.id} result={result} index={idx} />
               ))}
            </div>
         )}
      </div>
   );
};

export default LastRaceResults;