export interface CircuitFact {
   id: string;
   tag: 'Iconic Moment' | 'Track Quirk' | 'Driving Challenge' | 'Historical Lore' | 'Engineering';
   title: string;
   description: string;
}

export const CIRCUIT_FACTS: Record<string, CircuitFact[]> = {
   bahrain: [
      {
         id: 'bhr-1',
         tag: 'Track Quirk',
         title: 'Desert Spray & Sand Glaze',
         description:
            'To stop desert sand from blowing onto the circuit and destroying car radiators, the organizers spray an adhesive resin over the surrounding dunes before every Grand Prix weekend.',
      },
      {
         id: 'bhr-2',
         tag: 'Iconic Moment',
         title: 'The "Duel in the Desert" (2014)',
         description:
            'Lewis Hamilton and Nico Rosberg produced one of F1’s greatest wheel-to-wheel battles in 2014, crossing the finish line just 1.085 seconds apart after a frantic 10-lap sprint.',
      },
      {
         id: 'bhr-3',
         tag: 'Historical Lore',
         title: 'First F1 Race in the Middle East',
         description:
            'In 2004, Bahrain became the very first Middle Eastern nation to host a Formula 1 Grand Prix, designed by renowned architect Hermann Tilke.',
      },
   ],
   'saudi-arabia': [
      {
         id: 'ksa-1',
         tag: 'Driving Challenge',
         title: 'Fastest Street Track in History',
         description:
            'Drivers average over 250 km/h (155 mph) between the concrete walls of Jeddah, making it the fastest street circuit ever built in Formula 1.',
      },
      {
         id: 'ksa-2',
         tag: 'Track Quirk',
         title: '27 Blinding Corners',
         description:
            'With 27 turns, Jeddah Corniche Circuit features more corners than any other track on the current F1 calendar, most taken in 6th and 7th gear.',
      },
      {
         id: 'ksa-3',
         tag: 'Engineering',
         title: 'Turn 13 Banking',
         description:
            'Turn 13 features a steep 12-degree banking designed to maximize car flow, creating tremendous lateral G-forces of up to 4.5G on drivers.',
      },
   ],
   australia: [
      {
         id: 'aus-1',
         tag: 'Track Quirk',
         title: 'Public Park Conversion',
         description:
            'Albert Park is a public recreation park with cricket ovals and walking paths for 50 weeks a year. It takes six weeks to assemble barriers and grandstands for the Grand Prix.',
      },
      {
         id: 'aus-2',
         tag: 'Iconic Moment',
         title: 'Mark Webber’s 5th Place on Debut (2002)',
         description:
            'Aussie hero Mark Webber scored an emotional 5th place on his F1 debut for the underdog Minardi team, earning a podium celebration with the team boss Paul Stoddart.',
      },
      {
         id: 'aus-3',
         tag: 'Historical Lore',
         title: 'Traditional Season Opener',
         description:
            'Melbourne hosted the opening round of the F1 World Championship from 1996 through 2019, creating some of the most chaotic season openers in motorsport history.',
      },
   ],
   japan: [
      {
         id: 'jpn-1',
         tag: 'Track Quirk',
         title: 'Figure-Eight Layout',
         description:
            'Suzuka is the only figure-eight circuit on the modern F1 calendar, with the back straight crossing over the front sector via a high-speed overpass bridge.',
      },
      {
         id: 'jpn-2',
         tag: 'Driving Challenge',
         title: 'The Legendary 130R',
         description:
            'Turn 15 (130R) is a monstrous 130-meter radius left-hander taken flat out at 305 km/h, punishing any driver who lifts off throttle.',
      },
      {
         id: 'jpn-3',
         tag: 'Iconic Moment',
         title: 'Senna vs. Prost Title Collisions',
         description:
            'Suzuka decided the 1989 and 1990 World Championships through dramatic collisions between Ayrton Senna and Alain Prost at the Casio Triangle chicane and Turn 1.',
      },
   ],
   china: [
      {
         id: 'chn-1',
         tag: 'Track Quirk',
         title: 'The "Shang" Character Blueprint',
         description:
            'The circuit layout was architecturally designed to resemble the Chinese character "上" (shàng), meaning "above" or "ascend".',
      },
      {
         id: 'chn-2',
         tag: 'Driving Challenge',
         title: 'The Never-Ending Turn 1 Snail',
         description:
            'Turns 1 to 4 form a tightening 270-degree snail curve that requires drivers to turn continuously for over 6 seconds while trail-braking from 320 km/h down to 80 km/h.',
      },
      {
         id: 'chn-3',
         tag: 'Historical Lore',
         title: 'Schumacher’s 91st & Final Victory (2006)',
         description:
            'Michael Schumacher took the 91st and final Formula 1 victory of his legendary career at Shanghai in wet-to-dry conditions in 2006.',
      },
   ],
   miami: [
      {
         id: 'mia-1',
         tag: 'Track Quirk',
         title: 'Hard Rock Stadium Hub',
         description:
            'The circuit was built around the NFL’s Miami Dolphins stadium, with the F1 paddock club located directly on the football field.',
      },
      {
         id: 'mia-2',
         tag: 'Engineering',
         title: 'Overpass Rollercoaster',
         description:
            'Turns 14 and 15 pass under and over local highway exit ramps, creating a dramatic elevation rise and blind crest before a high-speed straight.',
      },
      {
         id: 'mia-3',
         tag: 'Iconic Moment',
         title: 'Lando Norris Maiden F1 Victory (2024)',
         description:
            'Lando Norris scored his long-awaited first Grand Prix win at Miami in 2024, converting a well-timed Safety Car to beat Max Verstappen by over 7 seconds.',
      },
   ],
   imola: [
      {
         id: 'imo-1',
         tag: 'Historical Lore',
         title: 'Named After F1 Royalty',
         description:
            'The circuit is named after Ferrari founder Enzo Ferrari and his son Dino. It is located just 80 km from the Ferrari headquarters in Maranello.',
      },
      {
         id: 'imo-2',
         tag: 'Driving Challenge',
         title: 'Blind Crest at Piratella',
         description:
            'Turn 9 (Piratella) is a downhill, off-camber 220 km/h left-hander entered over a blind crest where drivers must commit without seeing the apex.',
      },
      {
         id: 'imo-3',
         tag: 'Track Quirk',
         title: 'Anti-Clockwise Rollercoaster',
         description:
            'Imola runs counter-clockwise with intense elevation changes across the Santerno valley, placing heavy neck strain on drivers throughout 63 laps.',
      },
   ],
   monaco: [
      {
         id: 'mco-1',
         tag: 'Track Quirk',
         title: 'Slowest Hairpin in Formula 1',
         description:
            'The Fairmont (Grand Hotel) Hairpin is taken at just 48 km/h (30 mph). Steering racks must be specially modified just for Monaco to allow full steering lock.',
      },
      {
         id: 'mco-2',
         tag: 'Driving Challenge',
         title: 'Riding a Bicycle Around Your Living Room',
         description:
            'Three-time World Champion Nelson Piquet famously described racing at Monaco as "like trying to ride a bicycle around your living room."',
      },
      {
         id: 'mco-3',
         tag: 'Iconic Moment',
         title: 'Ayrton Senna: The Master of Monaco',
         description:
            'Ayrton Senna holds the all-time record with 6 Monaco victories, including 5 consecutive wins from 1989 to 1993 for McLaren.',
      },
   ],
   canada: [
      {
         id: 'can-1',
         tag: 'Iconic Moment',
         title: 'The Infamous "Wall of Champions"',
         description:
            'The concrete barrier on the exit of Turn 14 earned its nickname in 1999 when World Champions Damon Hill, Michael Schumacher, and Jacques Villeneuve all crashed into it during the same race.',
      },
      {
         id: 'can-2',
         tag: 'Track Quirk',
         title: 'Man-Made Island Sanctuary',
         description:
            'The circuit is located on Notre Dame Island, an artificial island constructed for the 1967 International Expo in the Saint Lawrence River.',
      },
      {
         id: 'can-3',
         tag: 'Historical Lore',
         title: 'Longest F1 Race in History (2011)',
         description:
            'The 2011 Canadian GP holds the record for the longest F1 race at 4 hours, 4 minutes, won by Jenson Button on the final lap after 6 safety cars and a 2-hour rain stoppage.',
      },
   ],
   spain: [
      {
         id: 'esp-1',
         tag: 'Engineering',
         title: 'The Ultimate Aerodynamic Benchmark',
         description:
            'Because Barcelona features every type of corner (high, medium, low-speed), teams consider it the ultimate test of a car’s true aerodynamic package.',
      },
      {
         id: 'esp-2',
         tag: 'Iconic Moment',
         title: 'Max Verstappen’s Historic 2016 Debut Win',
         description:
            'At just 18 years and 228 days old, Max Verstappen became the youngest Grand Prix winner in F1 history in his very first race for Red Bull Racing.',
      },
      {
         id: 'esp-3',
         tag: 'Driving Challenge',
         title: 'Brutal Turn 3 G-Forces',
         description:
            'Turn 3 is an uphill, accelerating 240 km/h right-hand sweeper that subjects the driver’s neck to continuous 3.8G lateral loads for 4 consecutive seconds.',
      },
   ],
   austria: [
      {
         id: 'aut-1',
         tag: 'Track Quirk',
         title: 'Shortest Lap Time on the Calendar',
         description:
            'With only 10 corners and high average speed, qualifying lap times at the Red Bull Ring regularly drop below 64 seconds, creating the tightest qualifying margins in F1.',
      },
      {
         id: 'aut-2',
         tag: 'Engineering',
         title: 'High Altitude Cooling Deficit',
         description:
            'Situated 670 meters above sea level in the Styrian mountains, the thinner air reduces engine cooling efficiency by nearly 8%, forcing teams to open extra cooling vents.',
      },
      {
         id: 'aut-3',
         tag: 'Iconic Moment',
         title: 'Steep Turn 3 Braking Battles',
         description:
            'Turn 3 climbs steeply uphill, creating an extreme braking compression zone where drivers regularly attempt daring late-braking overtakes down the inside.',
      },
   ],
   silverstone: [
      {
         id: 'gbr-1',
         tag: 'Historical Lore',
         title: 'Where the World Championship Began',
         description:
            'Silverstone hosted the very first official Formula 1 World Championship race on May 13, 1950, won by Giuseppe Farina in an Alfa Romeo.',
      },
      {
         id: 'gbr-2',
         tag: 'Driving Challenge',
         title: 'Maggotts, Becketts & Chapel Complex',
         description:
            'This famous sequence is taken in 7th gear at 290 km/h with drivers enduring rapid G-force reversals from +5G left to -5G right in less than 2 seconds.',
      },
      {
         id: 'gbr-3',
         tag: 'Track Quirk',
         title: 'Former WWII Bomber Airfield',
         description:
            'The circuit was built on the runways and perimeter roads of RAF Silverstone, a World War II bomber training station constructed in 1943.',
      },
   ],
   belgium: [
      {
         id: 'bel-1',
         tag: 'Driving Challenge',
         title: 'The Legendary Eau Rouge & Raidillon',
         description:
            'Drivers plunge downhill across an elevation dip before rocketing up an 18% gradient at 305 km/h, feeling their stomach compress with 4G of vertical load.',
      },
      {
         id: 'bel-2',
         tag: 'Track Quirk',
         title: 'Raining on One Side, Dry on the Other',
         description:
            'At 7.004 km, Spa is the longest circuit in F1. Microclimates in the Ardennes forest frequently mean it pours rain on one half while the other half is bone dry.',
      },
      {
         id: 'bel-3',
         tag: 'Historical Lore',
         title: 'Michael Schumacher’s Debut & Sanctuary',
         description:
            'Michael Schumacher made his shock F1 debut here in 1991 for Jordan, took his maiden victory in 1992, and holds the all-time record of 6 Belgian GP wins.',
      },
   ],
   hungary: [
      {
         id: 'hun-1',
         tag: 'Track Quirk',
         title: '"Monaco Without the Buildings"',
         description:
            'Due to its tight, twisty nature with almost no long straights, the Hungaroring is nicknamed "Monaco without the walls" because overtaking is exceptionally difficult.',
      },
      {
         id: 'hun-2',
         tag: 'Historical Lore',
         title: 'First Race Behind the Iron Curtain (1986)',
         description:
            'In 1986, Hungary became the first Eastern bloc nation behind the Soviet Iron Curtain to host a Grand Prix, drawing 200,000 spectators.',
      },
      {
         id: 'hun-3',
         tag: 'Iconic Moment',
         title: 'First-Time Winners Paradise',
         description:
            'Fernando Alonso (2003), Jenson Button (2006), Heikki Kovalainen (2008), and Esteban Ocon (2021) all scored their first-ever career F1 victories at the Hungaroring.',
      },
   ],
   netherlands: [
      {
         id: 'nld-1',
         tag: 'Engineering',
         title: 'Steeper Than Indianapolis Speedway',
         description:
            'Turn 14 (Arie Luyendyk) and Turn 3 (Hugenholtz) feature 18-degree banking (32% gradient)—more than double the slope of the iconic Indianapolis Motor Speedway.',
      },
      {
         id: 'nld-2',
         tag: 'Track Quirk',
         title: 'North Sea Dunes Micro-Grip',
         description:
            'Located steps away from the North Sea beaches, seaside gusts constantly blow coastal sand onto the tarmac, making grip levels shift dramatically every session.',
      },
      {
         id: 'nld-3',
         tag: 'Iconic Moment',
         title: 'The Orange Sea Phenomenon',
         description:
            'Zandvoort returned to the calendar in 2021 after a 36-year absence, creating the legendary "Orange Army" festival atmosphere for Max Verstappen.',
      },
   ],
   monza: [
      {
         id: 'ita-1',
         tag: 'Historical Lore',
         title: 'The "Temple of Speed"',
         description:
            'Monza is the fastest circuit in Formula 1 history. Lewis Hamilton set the all-time fastest lap in F1 history here in 2020 at an average speed of 264.362 km/h (164.267 mph).',
      },
      {
         id: 'ita-2',
         tag: 'Engineering',
         title: 'Skinny "Skin-and-Bones" Wings',
         description:
            'Teams bring bespoke aerodynamic packages with near-horizontal front and rear wings to minimize drag, reaching top speeds of over 355 km/h.',
      },
      {
         id: 'ita-3',
         tag: 'Iconic Moment',
         title: 'Closest F1 Finish Ever (1971)',
         description:
            'The 1971 Italian GP produced the closest top-5 finish in F1 history: Peter Gethin won by just 0.01s, with the top 5 cars separated by only 0.61 seconds.',
      },
   ],
   azerbaijan: [
      {
         id: 'aze-1',
         tag: 'Track Quirk',
         title: 'Narrowest Section in World Championship (7.6m)',
         description:
            'Turn 8 winds past the 12th-century medieval Old City fortress wall with a track width of just 7.6 meters, barely leaving enough room for a single modern F1 car.',
      },
      {
         id: 'aze-2',
         tag: 'Driving Challenge',
         title: '2.2 km Flat-Out Drag Strip',
         description:
            'The blast from Turn 16 along the Caspian Sea waterfront to Turn 1 is 2.22 kilometers long, allowing cars with DRS to reach over 350 km/h into heavy braking.',
      },
      {
         id: 'aze-3',
         tag: 'Iconic Moment',
         title: 'Baku Chaos & Safety Car Restarts',
         description:
            'Baku has produced different race winners in almost every running, famously remembered for Sebastian Vettel and Lewis Hamilton’s safety car clash in 2017.',
      },
   ],
   singapore: [
      {
         id: 'sgp-1',
         tag: 'Historical Lore',
         title: 'First-Ever F1 Night Race (2008)',
         description:
            'Singapore hosted the first night race in Formula 1 history in 2008, illuminated by 1,600 custom projector light fixtures delivering 3,000 lux (4x brighter than a stadium).',
      },
      {
         id: 'sgp-2',
         tag: 'Driving Challenge',
         title: 'The Most Physically Grueling Race',
         description:
            'With 90% humidity, 35°C track temperatures, and up to 2 hours of non-stop braking, drivers lose up to 3.5 kg (7.7 lbs) of body weight in sweat during the race.',
      },
      {
         id: 'sgp-3',
         tag: 'Track Quirk',
         title: '100% Safety Car Probability',
         description:
            'Every single running of the Singapore Grand Prix has featured at least one Safety Car or Virtual Safety Car deployment since its 2008 debut.',
      },
   ],
   austin: [
      {
         id: 'usa-1',
         tag: 'Driving Challenge',
         title: 'Turn 1 Steep 41m Blind Climb',
         description:
            'The start-finish straight climbs 41 meters (133 feet) straight up into a blind, 110-degree hairpin apex, creating spectacular multi-car overtakes at the race start.',
      },
      {
         id: 'usa-2',
         tag: 'Track Quirk',
         title: 'Tribute to Legendary World Corners',
         description:
            'COTA was deliberately designed with tribute sections: Turns 3–6 mimic Silverstone’s Maggotts/Becketts, Turns 12–15 mimic Hockenheim’s stadium, and 16–18 copy Istanbul’s Turn 8.',
      },
      {
         id: 'usa-3',
         tag: 'Historical Lore',
         title: 'Home of the Modern US Grand Prix',
         description:
            'Built specifically for Formula 1 in 2012, COTA revived the American Grand Prix, routinely drawing over 440,000 fans across the race weekend.',
      },
   ],
   mexico: [
      {
         id: 'mex-1',
         tag: 'Engineering',
         title: '2,240m Above Sea Level (Thin Air)',
         description:
            'At 2.2 kilometers above sea level, air density is 20% lower than at sea level. Teams run Monaco-level maximum downforce wings but generate Monza-level low drag.',
      },
      {
         id: 'mex-2',
         tag: 'Track Quirk',
         title: 'The Foro Sol Baseball Stadium',
         description:
            'Turns 12 through 16 weave through the center of a 30,000-seat former baseball stadium, creating the loudest and most iconic podium celebration in F1.',
      },
      {
         id: 'mex-3',
         tag: 'Historical Lore',
         title: 'Named After the Rodriguez Brothers',
         description:
            'The circuit is named after Mexican racing prodigy brothers Ricardo and Pedro Rodríguez, who both competed for Ferrari in the 1960s.',
      },
   ],
   brazil: [
      {
         id: 'bra-1',
         tag: 'Historical Lore',
         title: 'Title Decider of the Century (2008)',
         description:
            'Lewis Hamilton won his first World Championship on the final corner of the final lap in 2008, overtaking Timo Glock in pouring rain after Felipe Massa had already won the race.',
      },
      {
         id: 'bra-2',
         tag: 'Track Quirk',
         title: 'Anti-Clockwise Natural Amphitheater',
         description:
            'Interlagos translates to "between lakes". The bowl-shaped natural amphitheater allows spectators on grandstands to see nearly 60% of the entire circuit.',
      },
      {
         id: 'bra-3',
         tag: 'Iconic Moment',
         title: 'Senna’s Emotional 1991 Home Win',
         description:
            'Ayrton Senna won his first Brazilian GP in 1991 with his gearbox stuck in 6th gear for the final 7 laps, collapsing from pure physical exhaustion on the podium.',
      },
   ],
   'las-vegas': [
      {
         id: 'lvs-1',
         tag: 'Track Quirk',
         title: 'Racing Down the Iconic Vegas Boulevard',
         description:
            'Cars blast down the actual Las Vegas Strip past the Bellagio Fountains, Caesars Palace, and the Venetian along a flat-out 1.9 km straight at 350+ km/h.',
      },
      {
         id: 'lvs-2',
         tag: 'Driving Challenge',
         title: 'Freezing Desert Night Temperatures',
         description:
            'Starting at 10:00 PM in November desert chill, track temperatures plunge below 12°C (53°F), creating a severe challenge for drivers to keep tyre temperature.',
      },
      {
         id: 'lvs-3',
         tag: 'Iconic Moment',
         title: 'The Sphere Spectacle',
         description:
            'Turns 5 to 9 encircle the $2.3 billion MSG Sphere, which displays live F1 race telemetry, driver helmets, and custom animated yellow flags during the race.',
      },
   ],
   qatar: [
      {
         id: 'qat-1',
         tag: 'Driving Challenge',
         title: 'Extreme Sustained G-Force Strain',
         description:
            'Lusail features 16 medium-to-high speed sweepers without low-speed hairpins, forcing drivers to endure continuous 4.5G lateral loads for 57 laps.',
      },
      {
         id: 'qat-2',
         tag: 'Engineering',
         title: '18-Lap Maximum Tyre Mandate (2023)',
         description:
            'Due to severe tyre carcass micro-tears caused by Lusail’s aggressive 50mm pyramid kerbs, the FIA mandated a strict 18-lap maximum stint limit on all tyres.',
      },
      {
         id: 'qat-3',
         tag: 'Track Quirk',
         title: 'MotoGP Heritage',
         description:
            'Built primarily as a premier MotoGP motorcycle circuit in 2004, the wide sweeping curves produce flowing slipstream battles across the 1 km main straight.',
      },
   ],
   'abu-dhabi': [
      {
         id: 'abu-1',
         tag: 'Historical Lore',
         title: 'The 2021 Championship Climax',
         description:
            'Yas Marina hosted the controversial 2021 finale where Max Verstappen overtook Lewis Hamilton on fresh soft tyres on the final lap to take his first World Championship.',
      },
      {
         id: 'abu-2',
         tag: 'Track Quirk',
         title: 'The Subterranean Pit Exit Tunnel',
         description:
            'Yas Marina features the only pit exit in Formula 1 that travels underground through a concrete tunnel under Turn 1 before merging back onto the track.',
      },
      {
         id: 'abu-3',
         tag: 'Engineering',
         title: 'Twilight Race Lighting',
         description:
            'The Grand Prix begins at dusk under natural golden sunlight and finishes under thousands of high-intensity floodlights as nighttime descends across the marina.',
      },
   ],
};
