export interface TimezoneOption {
   id: string;
   label: string;
   region: string;
   flag: string;
}

export const POPULAR_TIMEZONES: TimezoneOption[] = [
   { id: 'auto', label: 'Local (Auto Detect)', region: 'Auto', flag: '🌐' },
   { id: 'UTC', label: 'UTC (Race Control)', region: 'Global', flag: '⏱️' },
   { id: 'Asia/Kolkata', label: 'India Standard Time (IST)', region: 'India', flag: '🇮🇳' },
   { id: 'America/New_York', label: 'US Eastern (EDT/EST)', region: 'Americas', flag: '🇺🇸' },
   { id: 'America/Chicago', label: 'US Central (CDT/CST)', region: 'Americas', flag: '🇺🇸' },
   { id: 'America/Denver', label: 'US Mountain (MDT/MST)', region: 'Americas', flag: '🇺🇸' },
   { id: 'America/Los_Angeles', label: 'US Pacific (PDT/PST)', region: 'Americas', flag: '🇺🇸' },
   { id: 'Europe/London', label: 'UK (GMT/BST)', region: 'Europe', flag: '🇬🇧' },
   { id: 'Europe/Paris', label: 'Central Europe (CET/CEST)', region: 'Europe', flag: '🇪🇺' },
   { id: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', region: 'Middle East', flag: '🇦🇪' },
   { id: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', region: 'Asia', flag: '🇸🇬' },
   { id: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', region: 'Asia', flag: '🇯🇵' },
   { id: 'Australia/Sydney', label: 'Australian Eastern (AEST/AEDT)', region: 'Oceania', flag: '🇦🇺' },
   { id: 'America/Sao_Paulo', label: 'Brasilia Time (BRT)', region: 'South America', flag: '🇧🇷' },
];

export function getDetectedLocalTimeZone(): string {
   try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
   } catch {
      return 'UTC';
   }
}

export function getTimeZoneAbbr(timeZone?: string, date?: Date): string {
   const d = date || new Date();
   try {
      const tz = timeZone && timeZone !== 'auto' ? timeZone : getDetectedLocalTimeZone();
      const parts = new Intl.DateTimeFormat('en-US', {
         timeZone: tz,
         timeZoneName: 'short',
      }).formatToParts(d);
      const part = parts.find((p) => p.type === 'timeZoneName');
      return part ? part.value : '';
   } catch {
      return '';
   }
}

export function getTimeZoneOffset(timeZone?: string, date?: Date): string {
   const d = date || new Date();
   try {
      const tz = timeZone && timeZone !== 'auto' ? timeZone : getDetectedLocalTimeZone();
      const parts = new Intl.DateTimeFormat('en-US', {
         timeZone: tz,
         timeZoneName: 'longOffset',
      }).formatToParts(d);
      const part = parts.find((p) => p.type === 'timeZoneName');
      if (part) {
         return part.value.replace('GMT', 'UTC');
      }
   } catch {
   }
   return '';
}

export function parseUtcSessionDateTime(dateStr?: string | null, timeStr?: string | null): Date | null {
   if (!dateStr) return null;
   if (!timeStr) {
      return new Date(`${dateStr}T12:00:00Z`);
   }

   let cleanTime = timeStr.trim();
   if (!cleanTime.endsWith('Z')) {
      if (cleanTime.split(':').length === 2) {
         cleanTime += ':00';
      }
      cleanTime += 'Z';
   }

   const iso = `${dateStr}T${cleanTime}`;
   const parsed = new Date(iso);
   return isNaN(parsed.getTime()) ? null : parsed;
}

export function parseCalendarDate(dateStr?: string | null): Date | null {
   if (!dateStr) return null;
   const parts = dateStr.split('-');
   if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
   }
   const d = new Date(dateStr);
   return isNaN(d.getTime()) ? null : d;
}

export function formatCalendarDate(
   dateStr?: string | null,
   options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
   const d = parseCalendarDate(dateStr);
   if (!d) return dateStr || '';
   return d.toLocaleDateString(undefined, options);
}

export function formatSessionToLocal(
   dateStr?: string | null,
   timeStr?: string | null,
   targetTimeZone?: string
): {
   dateStr: string;
   timeStr: string;
   tzAbbr: string;
   fullStr: string;
   dayOfWeek: string;
} {
   const tz = targetTimeZone && targetTimeZone !== 'auto' ? targetTimeZone : getDetectedLocalTimeZone();
   const dateObj = parseUtcSessionDateTime(dateStr, timeStr);

   if (!dateObj) {
      return {
         dateStr: dateStr || '',
         timeStr: timeStr || '',
         tzAbbr: '',
         fullStr: dateStr || '',
         dayOfWeek: '',
      };
   }

   const tzAbbr = getTimeZoneAbbr(tz, dateObj);

   try {
      const dateFormatted = new Intl.DateTimeFormat(undefined, {
         timeZone: tz,
         weekday: 'short',
         month: 'short',
         day: 'numeric',
      }).format(dateObj);

      const dayOfWeek = new Intl.DateTimeFormat(undefined, {
         timeZone: tz,
         weekday: 'short',
      }).format(dateObj);

      let timeFormatted = '';
      if (timeStr) {
         timeFormatted = new Intl.DateTimeFormat(undefined, {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
         }).format(dateObj);
      }

      const fullStr = timeFormatted
         ? `${dateFormatted} • ${timeFormatted} ${tzAbbr}`
         : dateFormatted;

      return {
         dateStr: dateFormatted,
         timeStr: timeFormatted,
         tzAbbr,
         fullStr,
         dayOfWeek,
      };
   } catch (e) {
      return {
         dateStr: dateStr || '',
         timeStr: timeStr || '',
         tzAbbr: '',
         fullStr: `${dateStr} ${timeStr || ''}`,
         dayOfWeek: '',
      };
   }
}

export function formatRaceDate(
   dateStr?: string | null,
   timeStr?: string | null,
   targetTimeZone?: string,
   options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
   const tz = targetTimeZone && targetTimeZone !== 'auto' ? targetTimeZone : getDetectedLocalTimeZone();
   const dateObj = parseUtcSessionDateTime(dateStr, timeStr);
   if (!dateObj) return dateStr || '';

   try {
      return new Intl.DateTimeFormat(undefined, {
         timeZone: tz,
         ...options,
      }).format(dateObj);
   } catch {
      return dateStr || '';
   }
}

export function formatRaceTime(
   dateStr?: string | null,
   timeStr?: string | null,
   targetTimeZone?: string,
   includeAbbr = true
): string {
   if (!timeStr) return '';
   const tz = targetTimeZone && targetTimeZone !== 'auto' ? targetTimeZone : getDetectedLocalTimeZone();
   const dateObj = parseUtcSessionDateTime(dateStr, timeStr);
   if (!dateObj) return timeStr;

   try {
      const timePart = new Intl.DateTimeFormat(undefined, {
         timeZone: tz,
         hour: '2-digit',
         minute: '2-digit',
         hour12: false,
      }).format(dateObj);

      if (includeAbbr) {
         const abbr = getTimeZoneAbbr(tz, dateObj);
         return abbr ? `${timePart} ${abbr}` : timePart;
      }
      return timePart;
   } catch {
      return timeStr;
   }
}