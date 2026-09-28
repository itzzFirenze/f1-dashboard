import React from 'react';

interface LoadingCardProps {
   message?: string;
   spinnerColorClass?: string;
}

const LoadingCard: React.FC<LoadingCardProps> = ({
   message = 'Loading…',
   spinnerColorClass = 'border-f1-red',
}) => (
   <div className="telemetry-card p-8 flex flex-col items-center justify-center gap-3 animate-pulse">
      <div
         className={`w-8 h-8 rounded-full border-2 ${spinnerColorClass} border-t-transparent animate-spin`}
      />
      <p className="text-xs font-mono text-f1-silver/50 uppercase tracking-widest">{message}</p>
   </div>
);

export default LoadingCard;
