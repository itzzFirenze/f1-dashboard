import { useState, useEffect } from 'react';
import type { CountdownTime } from '../types';

/**
 * Countdown timer hook. Returns time remaining until the target date.
 * Updates every second.
 */
export function useCountdown(targetDate: string | null): CountdownTime {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>(
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    if (!targetDate) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function calculateTimeLeft(targetDate: string | null): CountdownTime {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };

  const difference = new Date(targetDate).getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}
