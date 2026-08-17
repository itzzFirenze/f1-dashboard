-- ==============================================================================
-- F1 DASHBOARD: TRIVIA QUESTIONS SCHEMA & SEED DATA (100+ QUESTIONS)
-- Run this script in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL UNIQUE,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL, -- 'easy', 'medium', 'hard'
    season INT,
    source VARCHAR(50) DEFAULT 'official_f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & allow public read
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to questions"
ON questions FOR SELECT
TO public
USING (true);

-- 2. Insert Trivia Questions
INSERT INTO questions (question, options, correct_answer, explanation, category, difficulty, season, source)
VALUES

-- -----------------------------------------------------------------------------
-- CATEGORY: DRIVERS (10 Questions)
-- -----------------------------------------------------------------------------
(
    'Which driver holds the record for the most Grand Prix starts in Formula 1 history?',
    '["Lewis Hamilton", "Fernando Alonso", "Kimi Räikkönen", "Rubens Barrichello"]'::jsonb,
    'Fernando Alonso',
    'Fernando Alonso became the first driver in F1 history to surpass 350 and 400 Grand Prix entries and starts.',
    'drivers',
    'easy',
    2024,
    'official_f1'
),
(
    'What was Sebastian Vettel''s nickname for his 2013 championship-winning Red Bull RB9?',
    '["Luscious Liz", "Kinky Kylie", "Hungry Heidi", "Abbey"]'::jsonb,
    'Hungry Heidi',
    'Sebastian Vettel famously gave feminine names to all his cars; the dominant 2013 RB9 was named Hungry Heidi.',
    'drivers',
    'medium',
    2013,
    'official_f1'
),
(
    'Which country has produced the highest number of Formula 1 World Drivers'' Champions?',
    '["Germany", "Brazil", "United Kingdom", "Finland"]'::jsonb,
    'United Kingdom',
    'The UK has produced 10 different World Champions (including Hamilton, Stewart, Clark, Mansell, Hill, Button, Surtees, Hawthorn, Hunt).',
    'drivers',
    'easy',
    NULL,
    'historical_archive'
),
(
    'Before joining Ferrari in 2015, which team did Sebastian Vettel drive for when he took his first career win at Monza in 2008?',
    '["Red Bull Racing", "Toro Rosso", "BMW Sauber", "Minardi"]'::jsonb,
    'Toro Rosso',
    'Vettel took a shock maiden victory in the wet at Monza 2008 driving for Scuderia Toro Rosso.',
    'drivers',
    'easy',
    2008,
    'official_f1'
),
(
    'What permanent racing number has Max Verstappen used throughout most of his F1 career (when not running #1)?',
    '["33", "77", "23", "5"]'::jsonb,
    '33',
    'Verstappen chose #33 when entering F1 because his favorite number #3 was already taken by Daniel Ricciardo.',
    'drivers',
    'easy',
    2015,
    'official_f1'
),
(
    'Which driver is famously nicknamed "The Iceman"?',
    '["Mika Häkkinen", "Kimi Räikkönen", "Valtteri Bottas", "Keke Rosberg"]'::jsonb,
    'Kimi Räikkönen',
    'Ron Dennis gave Kimi Räikkönen the nickname "The Iceman" due to his cool, unflappable composure on and off track.',
    'drivers',
    'easy',
    2007,
    'official_f1'
),
(
    'Who is the only driver to win the Formula 1 World Championship posthumously?',
    '["Ayrton Senna", "Jochen Rindt", "Jim Clark", "Gilles Villeneuve"]'::jsonb,
    'Jochen Rindt',
    'Jochen Rindt tragically died during practice at Monza in 1970, but his points lead remained unbeaten by season end.',
    'drivers',
    'hard',
    1970,
    'historical_archive'
),
(
    'Which driver scored points on his Formula 1 debut with Scuderia Toro Rosso at the 2015 Australian GP at age 17?',
    '["Max Verstappen", "Carlos Sainz", "Daniil Kvyat", "Charles Leclerc"]'::jsonb,
    'Carlos Sainz',
    'Carlos Sainz finished P9 on his debut in Australia 2015. Max Verstappen retired from the same race with an engine failure.',
    'drivers',
    'hard',
    2015,
    'official_f1'
),
(
    'How many Formula 1 World Championships did Ayrton Senna win in his career?',
    '["2", "3", "4", "5"]'::jsonb,
    '3',
    'Ayrton Senna won 3 World Championships with McLaren-Honda in 1988, 1990, and 1991.',
    'drivers',
    'easy',
    1991,
    'historical_archive'
),
(
    'Which driver substituted for Lewis Hamilton at the 2020 Sakhir Grand Prix when Hamilton contracted COVID-19?',
    '["Stoffel Vandoorne", "Nico Hülkenberg", "George Russell", "Nyck de Vries"]'::jsonb,
    'George Russell',
    'George Russell stepped up from Williams into the Mercedes W11 for the 2020 Sakhir GP, nearly taking pole and victory.',
    'drivers',
    'medium',
    2020,
    'official_f1'
),

-- -----------------------------------------------------------------------------
-- CATEGORY: TEAMS (10 Questions)
-- -----------------------------------------------------------------------------
(
    'Which team has entered the most Formula 1 races and won the most Constructors'' Championships?',
    '["McLaren", "Ferrari", "Williams", "Mercedes"]'::jsonb,
    'Ferrari',
    'Scuderia Ferrari is the oldest active team, competing since 1950, with 16 Constructors'' Championships.',
    'teams',
    'easy',
    NULL,
    'historical_archive'
),
(
    'Which constructor won the Drivers'' and Constructors'' Championship in their only year of existence?',
    '["Brawn GP", "Stewart GP", "Tyrrell", "Jordan Grand Prix"]'::jsonb,
    'Brawn GP',
    'Ross Brawn bought the remnants of Honda in 2009; Brawn GP won both titles in 2009 before being acquired by Mercedes.',
    'teams',
    'medium',
    2009,
    'historical_archive'
),
(
    'In what year did Red Bull Racing score their very first Grand Prix victory?',
    '["2006", "2008", "2009", "2010"]'::jsonb,
    '2009',
    'Sebastian Vettel led Mark Webber in a 1-2 finish for Red Bull Racing at the wet 2009 Chinese Grand Prix.',
    'teams',
    'medium',
    2009,
    'official_f1'
),
(
    'What engine manufacturer powered McLaren to consecutive World Championships in 1998 and 1999?',
    '["Honda", "Mercedes-Benz", "Ford", "Porsche"]'::jsonb,
    'Mercedes-Benz',
    'McLaren-Mercedes was the dominant partnership with the Ilmor-designed Mercedes V10 engines behind Mika Häkkinen.',
    'teams',
    'medium',
    1998,
    'historical_archive'
),
(
    'Which team was previously known as Renault before being rebranded in 2021?',
    '["Aston Martin", "AlphaTauri", "Alpine", "Stake F1 Team"]'::jsonb,
    'Alpine',
    'Groupe Renault rebranded its Formula 1 works team to Alpine F1 Team in 2021 to promote their sports car brand.',
    'teams',
    'easy',
    2021,
    'official_f1'
),
(
    'How many consecutive Constructors'' World Championships did Mercedes-AMG Petronas win between 2014 and 2021?',
    '["6", "7", "8", "9"]'::jsonb,
    '8',
    'Mercedes won 8 consecutive Constructors'' titles from 2014 through 2021, a modern F1 record.',
    'teams',
    'easy',
    2021,
    'official_f1'
),
(
    'Which privateer Formula 1 team was founded by Sir Frank Williams and Patrick Head in 1977?',
    '["Williams Grand Prix Engineering", "Tyrrell Racing", "Brabham", "March Engineering"]'::jsonb,
    'Williams Grand Prix Engineering',
    'Williams Grand Prix Engineering was founded in 1977 and went on to win 9 Constructors'' Championships.',
    'teams',
    'easy',
    1977,
    'historical_archive'
),
(
    'What iconic racing livery featuring papaya orange is traditionally associated with which team?',
    '["Arrows", "Spyker", "McLaren", "Benetton"]'::jsonb,
    'McLaren',
    'Bruce McLaren adopted papaya orange in 1968 so the cars would stand out on track and on television.',
    'teams',
    'easy',
    NULL,
    'official_f1'
),
(
    'What constructor won 15 out of 16 races during the 1988 Formula 1 season?',
    '["Williams-Honda", "Ferrari", "McLaren-Honda", "Lotus-Honda"]'::jsonb,
    'McLaren-Honda',
    'The McLaren MP4/4 driven by Ayrton Senna and Alain Prost won 15 of 16 races, only missing Monza.',
    'teams',
    'medium',
    1988,
    'historical_archive'
),
(
    'Before becoming Aston Martin in 2021, what was the team originally founded by Eddie Jordan known as in 2019-2020?',
    '["Force India", "Racing Point", "Midland", "Spyker"]'::jsonb,
    'Racing Point',
    'The Silverstone-based team evolved: Jordan -> Midland -> Spyker -> Force India -> Racing Point -> Aston Martin.',
    'teams',
    'medium',
    2020,
    'official_f1'
),

-- -----------------------------------------------------------------------------
-- CATEGORY: CIRCUITS (10 Questions)
-- -----------------------------------------------------------------------------
(
    'Which circuit features the famous corners "Eau Rouge" and "Raidillon"?',
    '["Silverstone", "Circuit de Spa-Francorchamps", "Monza", "Nürburgring"]'::jsonb,
    'Circuit de Spa-Francorchamps',
    'The iconic uphill sweep of Eau Rouge and Raidillon is the signature section of Belgium''s Spa-Francorchamps.',
    'circuits',
    'easy',
    NULL,
    'official_f1'
),
(
    'Which venue hosted Formula 1''s very first official World Championship Grand Prix in May 1950?',
    '["Monza", "Silverstone", "Monaco", "Spa-Francorchamps"]'::jsonb,
    'Silverstone',
    'Silverstone hosted the inaugural FIA World Championship race on May 13, 1950.',
    'circuits',
    'easy',
    1950,
    'historical_archive'
),
(
    'Which track is known as "The Temple of Speed"?',
    '["Autodromo Nazionale Monza", "Suzuka Circuit", "Hockenheimring", "Silverstone"]'::jsonb,
    'Autodromo Nazionale Monza',
    'Monza earns the nickname "The Temple of Speed" because cars run over 75% of the lap at wide-open throttle.',
    'circuits',
    'easy',
    NULL,
    'official_f1'
),
(
    'Which unique circuit is famous for its figure-eight layout with an overpass/bridge?',
    '["Shanghai International Circuit", "Suzuka International Racing Course", "Interlagos", "Sepang"]'::jsonb,
    'Suzuka International Racing Course',
    'Suzuka in Japan is the only figure-eight circuit on the modern Formula 1 calendar.',
    'circuits',
    'easy',
    NULL,
    'official_f1'
),
(
    'At which circuit did Formula 1 host its very first official night race under floodlights in 2008?',
    '["Bahrain International Circuit", "Yas Marina Circuit", "Marina Bay Street Circuit", "Jeddah Corniche Circuit"]'::jsonb,
    'Marina Bay Street Circuit',
    'The Singapore GP at Marina Bay in 2008 was the first night race in Formula 1 history.',
    'circuits',
    'medium',
    2008,
    'official_f1'
),
(
    'What is the slowest corner on the current Formula 1 calendar?',
    '["La Rascasse (Monaco)", "Grand Hotel Hairpin / Loews (Monaco)", "Turn 1 (Monza)", "Castle Section (Baku)"]'::jsonb,
    'Grand Hotel Hairpin / Loews (Monaco)',
    'The Grand Hotel Hairpin in Monaco is taken at roughly 45–50 km/h (28–31 mph) with full steering lock.',
    'circuits',
    'medium',
    NULL,
    'official_f1'
),
(
    'Which circuit features the high-speed Maggotts, Becketts, and Chapel corner complex?',
    '["Silverstone Circuit", "Circuit of the Americas", "Suzuka", "Hungaroring"]'::jsonb,
    'Silverstone Circuit',
    'The rapid change of direction through Maggotts-Becketts-Chapel at Silverstone is one of the ultimate tests of downforce.',
    'circuits',
    'easy',
    NULL,
    'official_f1'
),
(
    'Which circuit has the longest straight on the F1 calendar where cars reach over 350 km/h before Turn 12?',
    '["Baku City Circuit", "Monza", "Las Vegas Strip Circuit", "Autódromo Hermanos Rodríguez"]'::jsonb,
    'Baku City Circuit',
    'The 2.2 km main straight at Baku City Circuit along the Caspian Sea is the longest on the calendar.',
    'circuits',
    'medium',
    NULL,
    'official_f1'
),
(
    'Which race track sits at the highest altitude above sea level on the modern calendar (over 2,200m)?',
    '["Red Bull Ring (Austria)", "Autódromo Hermanos Rodríguez (Mexico)", "Interlagos (Brazil)", "Kyalami (South Africa)"]'::jsonb,
    'Autódromo Hermanos Rodríguez (Mexico)',
    'Mexico City sits ~2,285 meters above sea level, resulting in thin air and reduced downforce and drag.',
    'circuits',
    'easy',
    NULL,
    'official_f1'
),
(
    'What corner at Istanbul Park was legendary for its multi-apex, high-G loads on drivers'' necks?',
    '["Turn 1", "Turn 4", "Turn 8", "Turn 11"]'::jsonb,
    'Turn 8',
    'Turn 8 at Istanbul Park featured four apices taken at over 260 km/h, subjecting drivers to sustained 5G forces.',
    'circuits',
    'medium',
    NULL,
    'historical_archive'
),

-- -----------------------------------------------------------------------------
-- CATEGORY: RACE RESULTS (10 Questions)
-- -----------------------------------------------------------------------------
(
    'Who won the chaotic 2021 Italian Grand Prix at Monza, leading a 1-2 finish for his team?',
    '["Lando Norris", "Daniel Ricciardo", "Pierre Gasly", "Valtteri Bottas"]'::jsonb,
    'Daniel Ricciardo',
    'Daniel Ricciardo won Monza 2021 for McLaren with Lando Norris second, McLaren''s first win since 2012.',
    'race_results',
    'easy',
    2021,
    'official_f1'
),
(
    'Who claimed his maiden F1 victory at the 2020 Italian Grand Prix driving for AlphaTauri?',
    '["Esteban Ocon", "Pierre Gasly", "Carlos Sainz", "Lance Stroll"]'::jsonb,
    'Pierre Gasly',
    'Pierre Gasly held off Carlos Sainz to score an emotional victory for AlphaTauri at Monza 2020.',
    'race_results',
    'easy',
    2020,
    'official_f1'
),
(
    'Who won the 2021 Hungarian Grand Prix after a chaotic wet start and red flag restart?',
    '["Esteban Ocon", "Sebastian Vettel", "Lewis Hamilton", "Fernando Alonso"]'::jsonb,
    'Esteban Ocon',
    'Esteban Ocon took his maiden victory for Alpine at the 2021 Hungarian GP.',
    'race_results',
    'medium',
    2021,
    'official_f1'
),
(
    'Which driver won the 1996 Monaco Grand Prix in a race where only 3 cars crossed the finish line?',
    '["Olivier Panis", "David Coulthard", "Johnny Herbert", "Heinz-Harald Frentzen"]'::jsonb,
    'Olivier Panis',
    'Olivier Panis started 14th in his Ligier and won the wet 1996 Monaco GP; only 3 cars took the checkered flag.',
    'race_results',
    'hard',
    1996,
    'historical_archive'
),
(
    'Who won the 70th Anniversary Grand Prix at Silverstone in 2020 with masterclass tyre management?',
    '["Lewis Hamilton", "Max Verstappen", "Valtteri Bottas", "Charles Leclerc"]'::jsonb,
    'Max Verstappen',
    'Max Verstappen and Red Bull used an alternate hard-tyre starting strategy to defeat Mercedes in hot conditions.',
    'race_results',
    'medium',
    2020,
    'official_f1'
),
(
    'What was notable about the 2005 United States Grand Prix at Indianapolis?',
    '["Only 6 cars started the race", "The race was stopped due to rain after 5 laps", "Michael Schumacher was disqualified", "First win for Minardi"]'::jsonb,
    'Only 6 cars started the race',
    'All Michelin tyre runners withdrew on safety grounds on the formation lap, leaving just 6 Bridgestone-shod cars to race.',
    'race_results',
    'medium',
    2005,
    'historical_archive'
),
(
    'Who won the inaugural Miami Grand Prix in May 2022?',
    '["Charles Leclerc", "Max Verstappen", "Carlos Sainz", "Sergio Pérez"]'::jsonb,
    'Max Verstappen',
    'Max Verstappen passed Charles Leclerc on lap 9 to win the inaugural 2022 Miami GP.',
    'race_results',
    'easy',
    2022,
    'official_f1'
),
(
    'Who won the 2008 Brazilian Grand Prix where Lewis Hamilton famously claimed the title on the last lap?',
    '["Felipe Massa", "Fernando Alonso", "Kimi Räikkönen", "Sebastian Vettel"]'::jsonb,
    'Felipe Massa',
    'Felipe Massa won his home race in dominant fashion, but Hamilton passed Timo Glock on the final corner to seal the crown.',
    'race_results',
    'medium',
    2008,
    'historical_archive'
),
(
    'At which Grand Prix did Sergio Pérez take his first ever Formula 1 win after dropping to last place on Lap 1?',
    '["2020 Sakhir Grand Prix", "2021 Azerbaijan Grand Prix", "2022 Monaco Grand Prix", "2020 Turkish Grand Prix"]'::jsonb,
    '2020 Sakhir Grand Prix',
    'Checo Pérez drove from P20 on Lap 1 to take an astonishing victory for Racing Point at Sakhir 2020.',
    'race_results',
    'medium',
    2020,
    'official_f1'
),
(
    'Who won the shortest race in Formula 1 history at the rain-soaked 2021 Belgian Grand Prix?',
    '["George Russell", "Max Verstappen", "Lewis Hamilton", "Daniel Ricciardo"]'::jsonb,
    'Max Verstappen',
    'Due to torrential rain, the race ran for only 2 laps behind the safety car, awarding half points with Verstappen classified 1st.',
    'race_results',
    'easy',
    2021,
    'official_f1'
),

-- -----------------------------------------------------------------------------
-- CATEGORY: CHAMPIONSHIPS (10 Questions)
-- -----------------------------------------------------------------------------
(
    'Which two drivers share the all-time record for the most World Drivers'' Championships (7 each)?',
    '["Ayrton Senna & Alain Prost", "Michael Schumacher & Lewis Hamilton", "Juan Manuel Fangio & Lewis Hamilton", "Sebastian Vettel & Max Verstappen"]'::jsonb,
    'Michael Schumacher & Lewis Hamilton',
    'Michael Schumacher and Lewis Hamilton both hold 7 World Championships.',
    'championships',
    'easy',
    NULL,
    'official_f1'
),
(
    'Who was the youngest World Drivers'' Champion in F1 history when he won in 2010 at age 23 years and 134 days?',
    '["Lewis Hamilton", "Fernando Alonso", "Sebastian Vettel", "Max Verstappen"]'::jsonb,
    'Sebastian Vettel',
    'Sebastian Vettel won the 2010 championship at Abu Dhabi, becoming the youngest champion in F1 history.',
    'championships',
    'easy',
    2010,
    'official_f1'
),
(
    'How many World Championships did Argentine legend Juan Manuel Fangio win in the 1950s?',
    '["3", "4", "5", "6"]'::jsonb,
    '5',
    'Fangio won 5 titles (1951, 1954, 1955, 1956, 1957) with four different constructors (Alfa Romeo, Maserati, Mercedes, Ferrari).',
    'championships',
    'medium',
    1957,
    'historical_archive'
),
(
    'In what year did Kimi Räikkönen win his only World Drivers'' Championship with Ferrari by a single point?',
    '["2005", "2007", "2008", "2009"]'::jsonb,
    '2007',
    'Kimi overcame a 17-point deficit with two races to go to beat Hamilton and Alonso by 1 point at Interlagos in 2007.',
    'championships',
    'easy',
    2007,
    'official_f1'
),
(
    'Who is the only driver to win the Formula 1 World Championship with his own eponymous team?',
    '["Bruce McLaren", "Jack Brabham", "John Surtees", "Dan Gurney"]'::jsonb,
    'Jack Brabham',
    'Sir Jack Brabham won the 1966 World Championship driving the Brabham BT19 car he constructed.',
    'championships',
    'hard',
    1966,
    'historical_archive'
),
(
    'Which driver won the 2016 World Drivers'' Championship and announced his immediate retirement five days later?',
    '["Jenson Button", "Nico Rosberg", "Mark Webber", "Felipe Massa"]'::jsonb,
    'Nico Rosberg',
    'Nico Rosberg clinched the 2016 title over Lewis Hamilton in Abu Dhabi and stunned the sport by retiring immediately.',
    'championships',
    'easy',
    2016,
    'official_f1'
),
(
    'How many Drivers'' Championships did Alain Prost win during his career?',
    '["3", "4", "5", "2"]'::jsonb,
    '4',
    'Alain "The Professor" Prost won 4 world titles (1985, 1986, 1989 with McLaren, 1993 with Williams).',
    'championships',
    'medium',
    1993,
    'historical_archive'
),
(
    'In what year did Michael Schumacher win Ferrari''s first Drivers'' Championship in 21 years?',
    '["1996", "1998", "2000", "2001"]'::jsonb,
    '2000',
    'Schumacher ended Ferrari''s championship drought at Suzuka in 2000, their first Drivers'' title since Jody Scheckter in 1979.',
    'championships',
    'medium',
    2000,
    'historical_archive'
),
(
    'Which father-and-son pairs have BOTH won the Formula 1 World Drivers'' Championship?',
    '["Graham & Damon Hill, Keke & Nico Rosberg", "Gilles & Jacques Villeneuve", "Mario & Michael Andretti", "Jos & Max Verstappen"]'::jsonb,
    'Graham & Damon Hill, Keke & Nico Rosberg',
    'Graham (1962, 1968) & Damon Hill (1996), along with Keke (1982) & Nico Rosberg (2016) are the only father-son champions.',
    'championships',
    'medium',
    NULL,
    'historical_archive'
),
(
    'By how many points did Niki Lauda defeat Alain Prost to win the 1984 World Championship, the smallest margin in history?',
    '["0.5 points", "1.0 point", "2.0 points", "0.25 points"]'::jsonb,
    '0.5 points',
    'Lauda won the 1984 title by half a point over Prost after the rained-out Monaco GP awarded half points.',
    'championships',
    'hard',
    1984,
    'historical_archive'
),

-- -----------------------------------------------------------------------------
-- CATEGORY: PIT STOPS (8 Questions)
-- -----------------------------------------------------------------------------
(
    'Which team holds the official world record for the fastest pit stop in F1 history (1.80 seconds at Qatar 2023)?',
    '["Red Bull Racing", "McLaren", "Ferrari", "Williams"]'::jsonb,
    'McLaren',
    'McLaren serviced Lando Norris in an astonishing 1.80 seconds at the 2023 Qatar Grand Prix, breaking Red Bull''s 1.82s record.',
    'pit_stops',
    'easy',
    2023,
    'official_f1'
),
(
    'What is the standard pit lane speed limit at most European Grand Prix circuits during race sessions?',
    '["60 km/h", "80 km/h", "100 km/h", "120 km/h"]'::jsonb,
    '80 km/h',
    'The pit lane speed limit is 80 km/h at most circuits (reduced to 60 km/h at tighter tracks like Monaco and Zandvoort).',
    'pit_stops',
    'easy',
    NULL,
    'rules'
),
(
    'In what year was in-race refueling banned in modern Formula 1 for safety and cost reasons?',
    '["2008", "2010", "2012", "2014"]'::jsonb,
    '2010',
    'In-race refueling was banned starting in 2010, requiring cars to start races with full fuel loads.',
    'pit_stops',
    'medium',
    2010,
    'rules'
),
(
    'Approximately how many crew members are involved in a modern Formula 1 four-wheel pit stop?',
    '["8 - 10", "12 - 14", "18 - 22", "30+"]'::jsonb,
    '18 - 22',
    'A pit crew consists of ~20 people: 3 per tyre (gunner, off, on), front/rear jack, side stabilisers, wing adjusters, and lollipop/light operator.',
    'pit_stops',
    'medium',
    NULL,
    'official_f1'
),
(
    'What penalty is commonly issued if a team releases a car into the direct path of an oncoming competitor in the pit lane?',
    '["Unsafe Release penalty", "Jump Start penalty", "Track limits warning", "Parc Fermé breach"]'::jsonb,
    'Unsafe Release penalty',
    'Releasing a car into traffic or with loose wheels incurs an Unsafe Release penalty (time penalty or fine).',
    'pit_stops',
    'easy',
    NULL,
    'rules'
),
(
    'Which driver endured a disastrous 43-hour pit stop in Monaco 2021 when a cross-threaded wheel nut refused to come off?',
    '["Valtteri Bottas", "Carlos Sainz", "Charles Leclerc", "Lewis Hamilton"]'::jsonb,
    'Valtteri Bottas',
    'Valtteri Bottas retired from P2 in Monaco 2021 after the front-right wheel nut machined itself onto the axle.',
    'pit_stops',
    'medium',
    2021,
    'official_f1'
),
(
    'Which tool is used by mechanics to remove and tighten wheel nuts in fractions of a second?',
    '["Hydraulic torque wrench", "Pneumatic wheel gun", "Electric drill", "Manual breaker bar"]'::jsonb,
    'Pneumatic wheel gun',
    'High-pressure pneumatic wheel guns (powered by compressed gas) spin at over 10,000 RPM.',
    'pit_stops',
    'easy',
    NULL,
    'official_f1'
),
(
    'What was Red Bull Racing''s previous record pit stop time set with Max Verstappen at Brazil in 2019?',
    '["1.82 seconds", "1.92 seconds", "2.01 seconds", "1.78 seconds"]'::jsonb,
    '1.82 seconds',
    'Red Bull serviced Max Verstappen in 1.82 seconds at Interlagos 2019, holding the record until McLaren''s 1.80s in 2023.',
    'pit_stops',
    'hard',
    2019,
    'official_f1'
),

-- -----------------------------------------------------------------------------
-- CATEGORY: TYRES (8 Questions)
-- -----------------------------------------------------------------------------
(
    'Who is the sole official tyre supplier for Formula 1 since the 2011 season?',
    '["Bridgestone", "Michelin", "Pirelli", "Goodyear"]'::jsonb,
    'Pirelli',
    'Pirelli has been the exclusive tyre supplier to Formula 1 since replacing Bridgestone in 2011.',
    'tyres',
    'easy',
    2011,
    'official_f1'
),
(
    'What color stripe is used on Pirelli slick tyres to designate the Hard compound?',
    '["Red", "Yellow", "White", "Green"]'::jsonb,
    'White',
    'Pirelli uses White for Hard, Yellow for Medium, and Red for Soft compounds.',
    'tyres',
    'easy',
    NULL,
    'official_f1'
),
(
    'What color designates the Intermediate wet-weather tyre compound?',
    '["Blue", "Green", "Orange", "Purple"]'::jsonb,
    'Green',
    'Green indicates Intermediate tyres (for damp/drying tracks), while Blue indicates Full Wet tyres.',
    'tyres',
    'easy',
    NULL,
    'official_f1'
),
(
    'In what year did Formula 1 transition from 13-inch wheels to low-profile 18-inch wheels?',
    '["2020", "2021", "2022", "2023"]'::jsonb,
    '2022',
    'The 2022 technical regulations overhaul introduced 18-inch low-profile Pirelli tyres.',
    'tyres',
    'medium',
    2022,
    'official_f1'
),
(
    'What rule applies to slick tyre usage in a standard, dry-weather Grand Prix?',
    '["Drivers can use one compound all race", "Drivers must use at least two different dry compounds", "Drivers must stop every 15 laps", "Drivers must use Softs in the final stint"]'::jsonb,
    'Drivers must use at least two different dry compounds',
    'In dry conditions, drivers are mandated to use at least two different dry-weather slick tyre compounds during the race.',
    'tyres',
    'easy',
    NULL,
    'rules'
),
(
    'In Pirelli''s compound range (C1 through C5/C6), which compound number represents the softest, highest-grip rubber?',
    '["C1", "C2", "C3", "C5 / C6"]'::jsonb,
    'C5 / C6',
    'The C-scale runs from hardest (C0/C1) to softest (C5/C6).',
    'tyres',
    'medium',
    NULL,
    'official_f1'
),
(
    'What is the maximum allowed temperature for tyre blankets in modern F1 before leaving the garage?',
    '["70°C", "90°C", "105°C", "120°C"]'::jsonb,
    '70°C',
    'The FIA reduced the maximum tyre blanket temperature to 70°C for both front and rear tyres to reduce energy usage.',
    'tyres',
    'hard',
    2023,
    'rules'
),
(
    'What phenomenon occurs when pieces of rubber shear off the tyre surface and stick back onto the carcass due to sliding?',
    '["Blistering", "Graining", "Flat-spotting", "Aquaplaning"]'::jsonb,
    'Graining',
    'Graining happens when cold rubber tears and balls up on the tread surface before smoothing out.',
    'tyres',
    'medium',
    NULL,
    'official_f1'
),

-- -----------------------------------------------------------------------------
-- CATEGORY: TEAM RADIO (10 Questions)
-- -----------------------------------------------------------------------------
(
    'Which driver famously said over team radio: "Leave me alone, I know what to do"?',
    '["Fernando Alonso", "Kimi Räikkönen", "Max Verstappen", "Sebastian Vettel"]'::jsonb,
    'Kimi Räikkönen',
    'Kimi Räikkönen uttered the iconic line to engineer Simon Rennie on his way to winning Abu Dhabi 2012 for Lotus.',
    'team_radio',
    'easy',
    2012,
    'official_f1'
),
(
    'What famous phrase did Fernando Alonso yell over team radio at Honda''s home race in Suzuka 2015?',
    '["No power, no power!", "GP2 engine! GP2!", "Engine feels good, much slower than before", "What a yoke!"]'::jsonb,
    'GP2 engine! GP2!',
    'Frustrated by McLaren-Honda''s lack of straight-line speed, Alonso vented: "GP2 engine! GP2! Aaargh!"',
    'team_radio',
    'easy',
    2015,
    'official_f1'
),
(
    'Who is the race engineer famously addressed as "Bono" over the Mercedes team radio?',
    '["Gianpiero Lambiase", "Peter Bonnington", "Hugh Bird", "Riccardo Adami"]'::jsonb,
    'Peter Bonnington',
    'Peter "Bono" Bonnington engineered Lewis Hamilton through all 6 of his Mercedes World Championships.',
    'team_radio',
    'easy',
    NULL,
    'official_f1'
),
(
    'Which driver coined the radio celebration "Smooth Operator" after strong race results?',
    '["Carlos Sainz", "Charles Leclerc", "Daniel Ricciardo", "Lando Norris"]'::jsonb,
    'Carlos Sainz',
    'Carlos Sainz frequently sang Sade''s "Smooth Operator" over the team radio after podiums and victories.',
    'team_radio',
    'easy',
    NULL,
    'official_f1'
),
(
    'What did Sebastian Vettel repeatedly tell race director Charlie Whiting over the radio at Mexico 2016?',
    '["Blue flags, blue flags!", "Honestly, what are we doing here?!", "Here is a message for Charlie: F*** off!", "He squeezed me off track!"]'::jsonb,
    'Here is a message for Charlie: F*** off!',
    'An enraged Vettel delivered the infamous expletive-laden message after battling with Max Verstappen.',
    'team_radio',
    'medium',
    2016,
    'official_f1'
),
(
    'Who is Max Verstappen''s long-time Red Bull race engineer, often addressed as "GP"?',
    '["Gianpiero Lambiase", "Xavi Marcos", "Tom Stallard", "Mark Temple"]'::jsonb,
    'Gianpiero Lambiase',
    'Gianpiero Lambiase (GP) has engineered Max Verstappen since his Red Bull debut in 2016.',
    'team_radio',
    'easy',
    NULL,
    'official_f1'
),
(
    'Which driver screamed "NOOOOO!" in agony over the radio after crashing out of the lead at Paul Ricard in 2022?',
    '["Charles Leclerc", "Carlos Sainz", "George Russell", "Sergio Pérez"]'::jsonb,
    'Charles Leclerc',
    'Charles Leclerc let out a heart-wrenching scream on team radio after spinning out of the lead at the French GP.',
    'team_radio',
    'easy',
    2022,
    'official_f1'
),
(
    'What code phrase was delivered to Felipe Massa at Hockenheim 2010 to instruct him to let Fernando Alonso pass?',
    '["Fernando is faster than you. Can you confirm you understood that message?", "Multi 21, Felipe", "Swap positions into turn 6", "Box this lap, execute Plan B"]'::jsonb,
    'Fernando is faster than you. Can you confirm you understood that message?',
    'Ferrari engineer Rob Smedley gave the famous radio message during the era of the team orders ban.',
    'team_radio',
    'medium',
    2010,
    'historical_archive'
),
(
    'What was the infamous controversy code radioed to Sebastian Vettel and Mark Webber at Malaysia 2013?',
    '["Plan B", "Hammer Time", "Multi 21", "Strat 7"]'::jsonb,
    'Multi 21',
    '"Multi 21" meant Car #2 (Webber) should finish ahead of Car #1 (Vettel), which Vettel ignored to take the win.',
    'team_radio',
    'medium',
    2013,
    'official_f1'
),
(
    'What famous phrase does Peter Bonnington tell Lewis Hamilton when it is time to push to the absolute limit?',
    '["Push now", "It''s Hammer Time", "Maximum attack", "Party mode on"]'::jsonb,
    'It''s Hammer Time',
    '"Hammer Time" is Bono''s trademark call for Hamilton to unleash full pace.',
    'team_radio',
    'easy',
    NULL,
    'official_f1'
),

-- -----------------------------------------------------------------------------
-- CATEGORY: HISTORICAL (10 Questions)
-- -----------------------------------------------------------------------------
(
    'In what year was the first official FIA Formula 1 World Championship held?',
    '["1948", "1950", "1952", "1955"]'::jsonb,
    '1950',
    'The inaugural FIA Formula One World Championship took place in 1950, won by Giuseppe Farina in an Alfa Romeo.',
    'historical',
    'easy',
    1950,
    'historical_archive'
),
(
    'Who was the first ever Formula 1 World Drivers'' Champion in 1950?',
    '["Juan Manuel Fangio", "Giuseppe Farina", "Alberto Ascari", "Stirling Moss"]'::jsonb,
    'Giuseppe Farina',
    'Italian driver Nino Farina won 3 races in 1950 to claim the inaugural title for Alfa Romeo.',
    'historical',
    'medium',
    1950,
    'historical_archive'
),
(
    'What tragic event led to major safety reforms following the 1994 San Marino Grand Prix at Imola?',
    '["The deaths of Roland Ratzenberger and Ayrton Senna", "A pit lane explosion involving Benetton", "A massive 10-car pileup at the start", "The banning of turbocharged engines"]'::jsonb,
    'The deaths of Roland Ratzenberger and Ayrton Senna',
    'The tragic Imola 1994 weekend resulted in the fatalities of Ratzenberger and 3-time champion Senna, revolutionizing F1 safety.',
    'historical',
    'easy',
    1994,
    'historical_archive'
),
(
    'Who is the only driver to have won the prestigious "Triple Crown of Motorsport" (Monaco GP / F1 title, Indy 500, Le Mans 24h)?',
    '["Graham Hill", "Fernando Alonso", "Mario Andretti", "Jim Clark"]'::jsonb,
    'Graham Hill',
    'Graham Hill won the Monaco GP (5 times), the 1966 Indy 500, and the 1972 24 Hours of Le Mans.',
    'historical',
    'medium',
    NULL,
    'historical_archive'
),
(
    'Which legendary British driver won both the Formula 1 World Championship (1964) and the 500cc Motorcycle World Championship (multiple times)?',
    '["John Surtees", "Mike Hailwood", "Geoff Duke", "James Hunt"]'::jsonb,
    'John Surtees',
    'John Surtees remains the only person in history to win world championships on both two and four wheels.',
    'historical',
    'medium',
    1964,
    'historical_archive'
),
(
    'What engine format powered Formula 1 cars from 1989 through 2005 before being replaced by V8s?',
    '["Naturally Aspirated 3.0L / 3.5L V10s", "1.5L Turbo V6s", "2.4L V8s", "3.0L Flat-12s"]'::jsonb,
    'Naturally Aspirated 3.0L / 3.5L V10s',
    'The 3.0L V10 era (1995-2005) is revered for screaming 19,000+ RPM soundtracks producing over 900+ HP.',
    'historical',
    'medium',
    2005,
    'historical_archive'
),
(
    'Who was the first female driver to score points in a Formula 1 World Championship Grand Prix?',
    '["Lella Lombardi", "Maria Teresa de Filippis", "Divina Galica", "Desiré Wilson"]'::jsonb,
    'Lella Lombardi',
    'Lella Lombardi finished 6th at the shortened 1975 Spanish GP at Montjuïc, scoring 0.5 points.',
    'historical',
    'hard',
    1975,
    'historical_archive'
),
(
    'Which designer created dominant championship-winning cars for Williams, McLaren, and Red Bull Racing?',
    '["Adrian Newey", "Rory Byrne", "Gordon Murray", "Ross Brawn"]'::jsonb,
    'Adrian Newey',
    'Adrian Newey is widely considered the greatest aerodynamicist in F1 history with over 200 GP wins and 25+ combined titles.',
    'historical',
    'easy',
    NULL,
    'official_f1'
),
(
    'In what year were Turbo-Hybrid V6 power units introduced to Formula 1?',
    '["2012", "2014", "2016", "2018"]'::jsonb,
    '2014',
    'The 1.6L turbocharged V6 hybrid era began in 2014, featuring the MGU-K and MGU-H energy recovery systems.',
    'historical',
    'easy',
    2014,
    'official_f1'
),
(
    'Which team famously ran a six-wheeled car (four small wheels at the front) in the 1976 season?',
    '["Tyrrell (P34)", "March (2-4-0)", "Ferrari (312T6)", "Williams (FW08B)"]'::jsonb,
    'Tyrrell (P34)',
    'The iconic Tyrrell P34 featured 4 10-inch front steering wheels to reduce aerodynamic drag.',
    'historical',
    'medium',
    1976,
    'historical_archive'
),

-- -----------------------------------------------------------------------------
-- CATEGORY: RECORDS (10 Questions)
-- -----------------------------------------------------------------------------
(
    'Who holds the record for the most Grand Prix victories in Formula 1 history?',
    '["Michael Schumacher", "Lewis Hamilton", "Max Verstappen", "Ayrton Senna"]'::jsonb,
    'Lewis Hamilton',
    'Lewis Hamilton was the first driver in history to surpass 100 pole positions and 100 race victories.',
    'records',
    'easy',
    NULL,
    'official_f1'
),
(
    'Who holds the record for the most consecutive race wins in a single season (10 in a row in 2023)?',
    '["Sebastian Vettel", "Max Verstappen", "Michael Schumacher", "Nico Rosberg"]'::jsonb,
    'Max Verstappen',
    'Max Verstappen won 10 consecutive races from Miami to Monza in 2023, beating Vettel''s previous record of 9.',
    'records',
    'easy',
    2023,
    'official_f1'
),
(
    'What is the highest number of Grand Prix wins achieved by a driver in a single Formula 1 season?',
    '["15", "17", "19", "21"]'::jsonb,
    '19',
    'Max Verstappen won an unprecedented 19 out of 22 races (86.4% win rate) during the 2023 season.',
    'records',
    'easy',
    2023,
    'official_f1'
),
(
    'Who holds the record for the most pole positions in Formula 1 history?',
    '["Michael Schumacher", "Ayrton Senna", "Lewis Hamilton", "Sebastian Vettel"]'::jsonb,
    'Lewis Hamilton',
    'Lewis Hamilton holds the record with over 104 career pole positions.',
    'records',
    'easy',
    NULL,
    'official_f1'
),
(
    'Who holds the record for the most podium finishes in Formula 1 history?',
    '["Michael Schumacher", "Lewis Hamilton", "Fernando Alonso", "Alain Prost"]'::jsonb,
    'Lewis Hamilton',
    'Lewis Hamilton holds the all-time record with nearly 200 career podium finishes.',
    'records',
    'easy',
    NULL,
    'official_f1'
),
(
    'Who scored the most pole positions in a single season (15 poles in 2011)?',
    '["Nigel Mansell", "Sebastian Vettel", "Max Verstappen", "Lewis Hamilton"]'::jsonb,
    'Sebastian Vettel',
    'Sebastian Vettel took 15 pole positions in 19 races during his 2011 championship-winning campaign with Red Bull.',
    'records',
    'medium',
    2011,
    'official_f1'
),
(
    'What constructor holds the record for the most wins in a single season (21 wins in 2023)?',
    '["Mercedes (2016)", "McLaren (1988)", "Red Bull Racing (2023)", "Ferrari (2002)"]'::jsonb,
    'Red Bull Racing (2023)',
    'Red Bull Racing won 21 out of 22 races in 2023 (19 by Verstappen, 2 by Pérez), only missing Singapore.',
    'records',
    'easy',
    2023,
    'official_f1'
),
(
    'Who holds the record for the most race starts before taking his first Formula 1 victory (190 starts)?',
    '["Sergio Pérez", "Carlos Sainz", "Mark Webber", "Rubens Barrichello"]'::jsonb,
    'Sergio Pérez',
    'Sergio Pérez started 190 races before finally winning the 2020 Sakhir GP.',
    'records',
    'medium',
    2020,
    'official_f1'
),
(
    'Who holds the record for the most Grand Prix entries without ever scoring a podium (over 200 starts)?',
    '["Nico Hülkenberg", "Adrian Sutil", "Andrea de Cesaris", "Marcus Ericsson"]'::jsonb,
    'Nico Hülkenberg',
    'Nico Hülkenberg holds the record for the most race starts in F1 history without standing on the podium.',
    'records',
    'medium',
    NULL,
    'official_f1'
),
(
    'Who recorded the highest top speed in an official F1 session (378 km/h / 234.9 mph at Baku 2016)?',
    '["Valtteri Bottas", "Kimi Räikkönen", "Lewis Hamilton", "Daniel Ricciardo"]'::jsonb,
    'Valtteri Bottas',
    'Valtteri Bottas reached 378 km/h in his Williams-Mercedes during qualifying at the 2016 European GP in Baku.',
    'records',
    'hard',
    2016,
    'official_f1'
),

-- -----------------------------------------------------------------------------
-- CATEGORY: RULES & REGULATIONS (10 Questions)
-- -----------------------------------------------------------------------------
(
    'What safety device, introduced to cockpits in 2018, was initially controversial but has saved numerous drivers'' lives?',
    '["HANS device", "Halo", "Aeroscreen", "Survival cell"]'::jsonb,
    'Halo',
    'The titanium Halo structure was mandated in 2018 and has proven crucial in violent crashes like Grosjean (2020) and Zhou (2022).',
    'rules',
    'easy',
    2018,
    'rules'
),
(
    'What does DRS stand for in Formula 1?',
    '["Direct Racing System", "Drag Reduction System", "Downforce Regulation Sensor", "Driver Recovery System"]'::jsonb,
    'Drag Reduction System',
    'The Drag Reduction System opens a flap in the rear wing to reduce aerodynamic drag and aid overtaking on straights.',
    'rules',
    'easy',
    2011,
    'rules'
),
(
    'Within what time gap to the car ahead must a trailing driver be at the detection point to activate DRS?',
    '["0.5 seconds", "1.0 second", "1.5 seconds", "2.0 seconds"]'::jsonb,
    '1.0 second',
    'A driver must be within 1.000 second of the car ahead at the DRS detection line to be allowed DRS activation.',
    'rules',
    'easy',
    NULL,
    'rules'
),
(
    'How many championship points does the winner of a standard Grand Prix receive?',
    '["20", "25", "30", "50"]'::jsonb,
    '25',
    'The modern points system awards 25 points for 1st, 18 for 2nd, 15 for 3rd, 12, 10, 8, 6, 4, 2, and 1 for 10th.',
    'rules',
    'easy',
    NULL,
    'rules'
),
(
    'What flag is shown to a driver who is about to be lapped by a faster car, instructing them to let the car pass?',
    '["Yellow Flag", "Blue Flag", "Black and White Flag", "Green Flag"]'::jsonb,
    'Blue Flag',
    'The blue flag instructs a backmarker that a faster car is approaching and must be let through within 3 marshaling sectors.',
    'rules',
    'easy',
    NULL,
    'rules'
),
(
    'What flag is waved alongside a driver''s car number as the "unsportsmanlike conduct / final warning" flag?',
    '["Black Flag", "Diagonal Black and White Flag", "Yellow and Red Striped Flag", "White Flag"]'::jsonb,
    'Diagonal Black and White Flag',
    'The diagonal black-and-white flag acts as motorsport''s equivalent of a yellow card in football.',
    'rules',
    'medium',
    NULL,
    'rules'
),
(
    'What is the minimum weight (including driver in racing gear) for a modern Formula 1 car as of 2024-2026?',
    '["700 kg", "752 kg", "798 kg", "850 kg"]'::jsonb,
    '798 kg',
    'The minimum weight limit for car and driver without fuel is 798 kg.',
    'rules',
    'medium',
    2024,
    'rules'
),
(
    'What does "Parc Fermé" mean in Formula 1?',
    '["Closed park where no car modifications are allowed after qualifying starts", "The podium holding area", "The medical examination center", "The pit lane garage area"]'::jsonb,
    'Closed park where no car modifications are allowed after qualifying starts',
    'Parc Fermé conditions prevent teams from changing car setup between qualifying and the race, except under specific supervision.',
    'rules',
    'easy',
    NULL,
    'rules'
),
(
    'What is the maximum allowed time limit for a Grand Prix race from start to finish (including red flag stoppages)?',
    '["2 hours", "3 hours", "4 hours", "5 hours"]'::jsonb,
    '3 hours',
    'A race has a 2-hour running time cap and a 3-hour overall window including all red flag delays.',
    'rules',
    'medium',
    NULL,
    'rules'
),
(
    'What penalty requires a driver to enter the pit lane, stop in their pit box for 10 seconds without mechanics touching the car, and rejoin?',
    '["5-second time penalty", "10-second Stop-and-Go penalty", "Drive-through penalty", "Disqualification"]'::jsonb,
    '10-second Stop-and-Go penalty',
    'In a Stop-and-Go penalty, the car must remain stationary for 10 seconds and no work can be performed during the stop.',
    'rules',
    'medium',
    NULL,
    'rules'
)
ON CONFLICT (question) DO NOTHING;

