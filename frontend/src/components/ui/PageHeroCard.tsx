import React from 'react';

interface PageHeroCardProps {
   badge?: React.ReactNode;
   title: React.ReactNode;
   subtitle?: string;
   right?: React.ReactNode;
   className?: string;
}

const PageHeroCard: React.FC<PageHeroCardProps> = ({
   badge,
   title,
   subtitle,
   right,
   className = '',
}) => (
   <div
      className={`relative overflow-hidden rounded-3xl bg-f1-carbon/90 border border-white/[0.06] p-5 sm:p-8 shadow-2xl dot-grid ${className}`}
   >
      {/* Scanline texture */}
      <div className="scanline-overlay" />

      {/* Ambient corner glows */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-f1-red/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
         <div className="space-y-2">
            {badge && (
               <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-f1-red/10 border border-f1-red/25 backdrop-blur-md">
                  <span className="text-f1-red-light text-xs font-mono font-bold tracking-[0.2em] uppercase">
                     {badge}
                  </span>
               </div>
            )}

            {title}

            {subtitle && (
               <p className="text-f1-silver text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                  {subtitle}
               </p>
            )}
         </div>

         {right && <div className="shrink-0">{right}</div>}
      </div>
   </div>
);

export default PageHeroCard;
