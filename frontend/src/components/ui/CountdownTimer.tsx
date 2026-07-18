import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';

interface CountdownTimerProps {
  targetDate: string;
}

/** Live countdown timer with days/hours/minutes/seconds display. */
const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const { days, hours, minutes, seconds, total } = useCountdown(targetDate);

  if (total <= 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-f1-red rounded-full animate-pulse" />
        <span className="text-f1-red-light font-bold text-lg">LIVE NOW</span>
      </div>
    );
  }

  const units = [
    { value: days, label: 'DAYS' },
    { value: hours, label: 'HRS' },
    { value: minutes, label: 'MIN' },
    { value: seconds, label: 'SEC' },
  ];

  return (
    <div className="flex items-center gap-3">
      {units.map(({ value, label }, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center">
            <span className="font-display font-bold text-2xl sm:text-3xl text-f1-white tabular-nums">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-f1-silver tracking-widest mt-1">{label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="text-f1-red text-2xl font-bold self-start mt-0.5">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default CountdownTimer;
