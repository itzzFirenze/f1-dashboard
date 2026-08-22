import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
   getDetectedLocalTimeZone,
   getTimeZoneAbbr,
   getTimeZoneOffset,
   formatSessionToLocal,
   formatRaceDate,
   formatRaceTime,
   POPULAR_TIMEZONES,
   TimezoneOption,
} from '../utils/timezone';

interface TimezoneContextType {
   selectedTimeZone: string;
   resolvedTimeZone: string;
   isAuto: boolean;
   tzAbbr: string;
   tzOffset: string;
   setTimeZone: (tz: string) => void;
   formatSession: (dateStr?: string | null, timeStr?: string | null) => {
      dateStr: string;
      timeStr: string;
      tzAbbr: string;
      fullStr: string;
      dayOfWeek: string;
   };
   formatDate: (
      dateStr?: string | null,
      timeStr?: string | null,
      options?: Intl.DateTimeFormatOptions
   ) => string;
   formatTime: (dateStr?: string | null, timeStr?: string | null, includeAbbr?: boolean) => string;
   popularTimezones: TimezoneOption[];
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

const STORAGE_KEY = 'f1_preferred_timezone';

export const TimezoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [selectedTimeZone, setSelectedTimeZoneState] = useState<string>(() => {
      return localStorage.getItem(STORAGE_KEY) || 'auto';
   });

   const resolvedTimeZone = useMemo(() => {
      return selectedTimeZone === 'auto' ? getDetectedLocalTimeZone() : selectedTimeZone;
   }, [selectedTimeZone]);

   const isAuto = selectedTimeZone === 'auto';

   const tzAbbr = useMemo(() => {
      return getTimeZoneAbbr(resolvedTimeZone);
   }, [resolvedTimeZone]);

   const tzOffset = useMemo(() => {
      return getTimeZoneOffset(resolvedTimeZone);
   }, [resolvedTimeZone]);

   const setTimeZone = (tz: string) => {
      setSelectedTimeZoneState(tz);
      localStorage.setItem(STORAGE_KEY, tz);
   };

   const formatSession = (dateStr?: string | null, timeStr?: string | null) => {
      return formatSessionToLocal(dateStr, timeStr, resolvedTimeZone);
   };

   const formatDate = (
      dateStr?: string | null,
      timeStr?: string | null,
      options?: Intl.DateTimeFormatOptions
   ) => {
      return formatRaceDate(dateStr, timeStr, resolvedTimeZone, options);
   };

   const formatTime = (dateStr?: string | null, timeStr?: string | null, includeAbbr = true) => {
      return formatRaceTime(dateStr, timeStr, resolvedTimeZone, includeAbbr);
   };

   return (
      <TimezoneContext.Provider
         value={{
            selectedTimeZone,
            resolvedTimeZone,
            isAuto,
            tzAbbr,
            tzOffset,
            setTimeZone,
            formatSession,
            formatDate,
            formatTime,
            popularTimezones: POPULAR_TIMEZONES,
         }}
      >
         {children}
      </TimezoneContext.Provider>
   );
};

export const useTimezone = (): TimezoneContextType => {
   const context = useContext(TimezoneContext);
   if (!context) {
      throw new Error('useTimezone must be used within a TimezoneProvider');
   }
   return context;
};
