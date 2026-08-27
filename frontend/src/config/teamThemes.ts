export interface TeamTheme {
   primary: string;
   bgFrom: string;
   bgTo: string;
   carImageUrl: string;
   teamLogoUrl: string;
   driverImages: Record<string, string>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BASE = `${SUPABASE_URL}/storage/v1/object/public`;

export const TEAM_THEMES: Record<string, TeamTheme> = {
   mercedes: {
      primary: '#00D2BE',
      bgFrom: '#001a18',
      bgTo: '#00D2BE',
      carImageUrl: `${BASE}/cars/mercedes-2026.avif`,
      teamLogoUrl: `${BASE}/teams/mercedes.avif`,
      driverImages: {
         george_russell: `${BASE}/drivers/george_russell.avif`,
         andrea_kimi_antonelli: `${BASE}/drivers/kimi_antonelli.avif`,
      },
   },
   red_bull: {
      primary: '#3671C6',
      bgFrom: '#060d2e',
      bgTo: '#3671C6',
      carImageUrl: `${BASE}/cars/red_bull-2026.avif`,
      teamLogoUrl: `${BASE}/teams/red_bull.avif`,
      driverImages: {
         max_verstappen: `${BASE}/drivers/max_verstappen.avif`,
         isack_hadjar: `${BASE}/drivers/isack_hadjar.avif`,
         liam_lawson: `${BASE}/drivers/liam_lawson.avif`,
         yuki_tsunoda: `${BASE}/drivers/yuki_tsunoda.avif`,
      },
   },
   ferrari: {
      primary: '#E8002D',
      bgFrom: '#1a0004',
      bgTo: '#E8002D',
      carImageUrl: `${BASE}/cars/ferrari-2026.avif`,
      teamLogoUrl: `${BASE}/teams/ferrari.avif`,
      driverImages: {
         charles_leclerc: `${BASE}/drivers/charles_leclrec.avif`,
         lewis_hamilton: `${BASE}/drivers/lewis_hamilton.avif`,
      },
   },
   mclaren: {
      primary: '#FF8000',
      bgFrom: '#1a0d00',
      bgTo: '#FF8000',
      carImageUrl: `${BASE}/cars/mclaren-2026.avif`,
      teamLogoUrl: `${BASE}/teams/mclaren.avif`,
      driverImages: {
         lando_norris: `${BASE}/drivers/lando_norris.avif`,
         oscar_piastri: `${BASE}/drivers/oscar_piastri.avif`,
      },
   },
   aston_martin: {
      primary: '#229971',
      bgFrom: '#001a10',
      bgTo: '#229971',
      carImageUrl: `${BASE}/cars/aston_martin-2026.avif`,
      teamLogoUrl: `${BASE}/teams/aston_martin.avif`,
      driverImages: {
         fernando_alonso: `${BASE}/drivers/fernando_alonso.avif`,
         lance_stroll: `${BASE}/drivers/lance_stroll.avif`,
      },
   },
   alpine: {
      primary: '#0093CC',
      bgFrom: '#001420',
      bgTo: '#0093CC',
      carImageUrl: `${BASE}/cars/alpine-2026.avif`,
      teamLogoUrl: `${BASE}/teams/alpine.avif`,
      driverImages: {
         pierre_gasly: `${BASE}/drivers/pierre_gasly.avif`,
         franco_colapinto: `${BASE}/drivers/franco_colapinto.avif`,
      },
   },
   williams: {
      primary: '#64C4FF',
      bgFrom: '#001428',
      bgTo: '#64C4FF',
      carImageUrl: `${BASE}/cars/williams-2026.avif`,
      teamLogoUrl: `${BASE}/teams/williams.avif`,
      driverImages: {
         alexander_albon: `${BASE}/drivers/alexander_albon.avif`,
         carlos_sainz: `${BASE}/drivers/carloz_sainz.avif`,
      },
   },
   haas: {
      primary: '#B6BABD',
      bgFrom: '#141414',
      bgTo: '#B6BABD',
      carImageUrl: `${BASE}/cars/haas-2026.avif`,
      teamLogoUrl: `${BASE}/teams/haas.avif`,
      driverImages: {
         esteban_ocon: `${BASE}/drivers/esteban_ocon.avif`,
         oliver_bearman: `${BASE}/drivers/oliver_bearman.avif`,
      },
   },
   rb: {
      primary: '#6692FF',
      bgFrom: '#070d2a',
      bgTo: '#6692FF',
      carImageUrl: `${BASE}/cars/racing_bulls-2026.avif`,
      teamLogoUrl: `${BASE}/teams/racing_bulls.avif`,
      driverImages: {
         yuki_tsunoda: `${BASE}/drivers/yuki_tsunoda.avif`,
         liam_lawson: `${BASE}/drivers/liam_lawson.avif`,
         arvid_lindblad: `${BASE}/drivers/arvid_lindblad.avif`,
      },
   },
   audi: {
      primary: '#F3092A',
      bgFrom: '#1a0004',
      bgTo: '#F3092A',
      carImageUrl: `${BASE}/cars/audi-2026.avif`,
      teamLogoUrl: `${BASE}/teams/audi.avif`,
      driverImages: {
         nico_hulkenberg: `${BASE}/drivers/nico_hulkenberg.avif`,
         gabriel_bortoleto: `${BASE}/drivers/gabriel_bortoleto.avif`,
      },
   },
   cadillac: {
      primary: '#FFD700',
      bgFrom: '#1a1600',
      bgTo: '#FFD700',
      carImageUrl: `${BASE}/cars/cadillac-2026.avif`,
      teamLogoUrl: `${BASE}/teams/cadillac.avif`,
      driverImages: {
         valtteri_bottas: `${BASE}/drivers/valtteri_bottas.avif`,
         sergio_perez: `${BASE}/drivers/sergio_perez.avif`,
      },
   },
};

/** Normalise a constructor name to a theme key */
export function getTeamKey(teamName: string): string {
   const n = teamName.toLowerCase();
   if (n.includes('mercedes')) return 'mercedes';
   if (n.includes('red bull')) return 'red_bull';
   if (n.includes('ferrari')) return 'ferrari';
   if (n.includes('mclaren')) return 'mclaren';
   if (n.includes('aston')) return 'aston_martin';
   if (n.includes('alpine')) return 'alpine';
   if (n.includes('williams')) return 'williams';
   if (n.includes('haas')) return 'haas';
   if (n.includes('rb') || n.includes('racing bulls') || n.includes('alphatauri') || n.includes('toro rosso')) return 'rb';
   if (n.includes('audi') || n.includes('sauber')) return 'audi';
   if (n.includes('cadillac')) return 'cadillac';
   return 'mercedes';
}

/** Build driver image slug from first/last name */
export function getDriverSlug(firstName: string, lastName: string): string {
   return `${firstName}_${lastName}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z_]/g, '');
}

/** Resolve a team theme from a constructor name */
export function resolveTheme(constructorName: string): TeamTheme {
   return TEAM_THEMES[getTeamKey(constructorName)];
}

/** Get driver image URL, returns null if not configured */
export function getDriverImage(theme: TeamTheme, firstName: string, lastName: string): string | null {
   const slug = getDriverSlug(firstName, lastName);
   return theme.driverImages[slug] ?? null;
}