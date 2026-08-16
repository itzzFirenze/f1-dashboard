'use client';

import {
   useCallback,
   useEffect,
   useRef,
   useState,
   type ChangeEvent,
   type MouseEvent as ReactMouseEvent,
} from 'react';
import axios from 'axios';
import { circuits } from '../../data/circuits';
import { circuitSvgPaths } from '../../data/circuits/svgPaths';
import { circuitService, type CircuitPositionsPayload } from '../../services/circuitService';

// ── Types ──────────────────────────────────────────────────────────────────

type SamplePoint = { x: number; y: number; percent: number };
type CircuitPathKey = keyof typeof circuitSvgPaths;
type PickerMode = 'corners' | 'sectors' | 'activeAero' | 'overtake' | 'speedTrap' | 'pitLane';

type CircuitOption = { id: string; name: string; pathKey: CircuitPathKey };

// ── SVG key ↔ circuit ID mapping ───────────────────────────────────────────

const SVG_KEY_TO_CIRCUIT_ID: Record<string, string> = {
   abuDhabi: 'abu-dhabi', austin: 'austin', australia: 'australia', austria: 'austria',
   azerbaijan: 'azerbaijan', bahrain: 'bahrain', belgium: 'belgium', brazil: 'brazil',
   canada: 'canada', china: 'china', hungary: 'hungary', imola: 'imola', japan: 'japan',
   lasVegas: 'las-vegas', mexico: 'mexico', miami: 'miami', monaco: 'monaco', monza: 'monza',
   netherlands: 'netherlands', qatar: 'qatar', saudiArabia: 'saudi-arabia',
   silverstone: 'silverstone', singapore: 'singapore', spain: 'spain',
};

const CIRCUIT_ID_TO_SVG_KEY = Object.fromEntries(
   Object.entries(SVG_KEY_TO_CIRCUIT_ID).map(([k, v]) => [v, k]),
) as Record<string, CircuitPathKey>;

const SAMPLE_COUNT = 1000;

const CIRCUITS: CircuitOption[] = circuits.map((c) => ({
   id: c.id,
   name: c.name,
   pathKey: CIRCUIT_ID_TO_SVG_KEY[c.id] || (c.id as CircuitPathKey),
}));

// ── Mode metadata ──────────────────────────────────────────────────────────

const MODES: { key: PickerMode; label: string; color: string }[] = [
   { key: 'corners', label: 'Corners', color: '#E10600' },
   { key: 'sectors', label: 'Sectors', color: '#f59e0b' },
   { key: 'activeAero', label: 'Active Aero', color: '#22c55e' },
   { key: 'overtake', label: 'Overtake', color: '#3b82f6' },
   { key: 'speedTrap', label: 'Speed Trap', color: '#a855f7' },
   { key: 'pitLane', label: 'Pit Lane', color: '#facc15' }
];

// ── Component ──────────────────────────────────────────────────────────────

export default function CornerPositionPicker() {
   // Mode
   const [mode, setMode] = useState<PickerMode>('corners');

   // Circuit
   const [circuitId, setCircuitId] = useState<string>(CIRCUITS[0]?.id ?? '');

   // Corners
   const [points, setPoints] = useState<number[]>([]);

   // Sectors
   const [sector1, setSector1] = useState<number | null>(null);
   const [sector2, setSector2] = useState<number | null>(null);
   const [sector3, setSector3] = useState<number | null>(null);

   const [pitEntry, setPitEntry] = useState<number | null>(null); const [pitExit, setPitExit] = useState<number | null>(null);

   // Active Aero
   const [aeroZones, setAeroZones] = useState<[number, number][]>([]);
   const [aeroZoneStart, setAeroZoneStart] = useState<number | null>(null);

   // Overtake
   const [overtakeDetection, setOvertakeDetection] = useState<number | null>(null);
   const [overtakeActivation, setOvertakeActivation] = useState<number | null>(null);

   // Speed Trap
   const [speedTrap, setSpeedTrap] = useState<number | null>(null);

   // SVG
   const [totalLength, setTotalLength] = useState<number>(0);
   const [hover, setHover] = useState<SamplePoint | null>(null);

   // UI
   const [copied, setCopied] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [saveMessage, setSaveMessage] = useState('');
   const [saveError, setSaveError] = useState('');

   const trackPathRef = useRef<SVGPathElement | null>(null);
   const svgRef = useRef<SVGSVGElement | null>(null);
   const samplesRef = useRef<SamplePoint[]>([]);

   const selectedCircuit = circuits.find((c) => c.id === circuitId);
   const currentPathKey = selectedCircuit ? CIRCUIT_ID_TO_SVG_KEY[selectedCircuit.id] : null;
   const currentD = currentPathKey ? circuitSvgPaths[currentPathKey] : '';

   // ── Initialize state from circuit data ──────────────────────────────────

   useEffect(() => {
      const c = selectedCircuit;
      if (c) {
         setPoints(c.cornerMarkers.map((m) => m.positionPercent));
         setSector1(c.sectors[0]?.startPercent ?? null);
         setSector2(c.sectors[1]?.startPercent ?? null);
         setSector3(c.sectors[2]?.startPercent ?? null);
         setAeroZones(c.activeAeroZones.map((z) => [z.startPercent, z.endPercent] as [number, number]));
         setOvertakeDetection(c.overtakeMode.detectionPointPercent);
         setOvertakeActivation(c.overtakeMode.activationPointPercent);
         setSpeedTrap(c.speedTrap.positionPercent);
         setPitEntry(c.pitLane.entryPercent !== c.pitLane.exitPercent ? c.pitLane.entryPercent : null);
         setPitExit(c.pitLane.entryPercent !== c.pitLane.exitPercent ? c.pitLane.exitPercent : null);
      } else {
         setPoints([]);
         setSector1(null); setSector2(null); setSector3(null);
         setAeroZones([]); setOvertakeDetection(null); setOvertakeActivation(null);
         setSpeedTrap(null);
         setPitEntry(null); setPitExit(null);
      }
      setAeroZoneStart(null);
      setHover(null);
      setSaveMessage('');
      setSaveError('');

      const raf = requestAnimationFrame(() => {
         const path = trackPathRef.current;
         if (!path) return;
         const len = path.getTotalLength();
         setTotalLength(len);
         const samples: SamplePoint[] = [];
         for (let i = 0; i <= SAMPLE_COUNT; i++) {
            const pt = path.getPointAtLength((i / SAMPLE_COUNT) * len);
            samples.push({ x: pt.x, y: pt.y, percent: (i / SAMPLE_COUNT) * 100 });
         }
         samplesRef.current = samples;
      });
      return () => cancelAnimationFrame(raf);
   }, [circuitId, currentD, selectedCircuit]);

   // ── SVG helpers ─────────────────────────────────────────────────────────

   const nearestOnPath = useCallback((x: number, y: number): SamplePoint | null => {
      let best: SamplePoint | null = null;
      let bestD = Infinity;
      for (const s of samplesRef.current) {
         const d = (s.x - x) ** 2 + (s.y - y) ** 2;
         if (d < bestD) { bestD = d; best = s; }
      }
      return best;
   }, []);

   const svgPointFromEvent = useCallback(
      (evt: ReactMouseEvent<SVGSVGElement>): DOMPoint | SVGPoint | null => {
         const svg = svgRef.current;
         if (!svg) return null;
         const ctm = svg.getScreenCTM();
         if (!ctm) return null;
         const pt = svg.createSVGPoint();
         pt.x = evt.clientX; pt.y = evt.clientY;
         return pt.matrixTransform(ctm.inverse());
      }, [],
   );

   const pointAtPercent = (pct: number): { x: number; y: number } => {
      const path = trackPathRef.current;
      if (!path || !totalLength) return { x: 0, y: 0 };
      return path.getPointAtLength((pct / 100) * totalLength);
   };

   // ── Mouse handlers ──────────────────────────────────────────────────────

   const handleMouseMove = (evt: ReactMouseEvent<SVGSVGElement>): void => {
      if (!totalLength) return;
      const pt = svgPointFromEvent(evt);
      if (!pt) return;
      const nearest = nearestOnPath(pt.x, pt.y);
      if (nearest) setHover(nearest);
   };

   const handleMouseLeave = (): void => setHover(null);

   const handleClick = (evt: ReactMouseEvent<SVGSVGElement>): void => {
      if (!totalLength) return;
      const pt = svgPointFromEvent(evt);
      if (!pt) return;
      const nearest = nearestOnPath(pt.x, pt.y);
      if (!nearest) return;

      const pct = Number(nearest.percent.toFixed(2));
      setSaveMessage('');
      setSaveError('');

      switch (mode) {
         case 'corners':
            setPoints((prev) => [...prev, pct]);
            break;

         case 'sectors':
            if (sector1 === null) setSector1(pct);
            else if (sector2 === null) setSector2(pct);
            else if (sector3 === null) setSector3(pct);
            break;

         case 'pitLane':
            if (pitEntry === null) setPitEntry(pct);
            else setPitExit(pct);
            break;

         case 'activeAero':
            if (aeroZoneStart === null) {
               setAeroZoneStart(pct);
            } else {
               setAeroZones((prev) => [...prev, [aeroZoneStart, pct]]);
               setAeroZoneStart(null);
            }
            break;

         case 'overtake':
            if (overtakeDetection === null) setOvertakeDetection(pct);
            else if (overtakeActivation === null) setOvertakeActivation(pct);
            break;

         case 'speedTrap':
            setSpeedTrap(pct);
            break;
      }
   };

   // ── Corner helpers ──────────────────────────────────────────────────────

   const undo = (): void => { setPoints((p) => p.slice(0, -1)); setSaveMessage(''); };
   const clearCorners = (): void => { setPoints([]); setSaveMessage(''); };
   const removeAt = (i: number): void => { setPoints((p) => p.filter((_, j) => j !== i)); setSaveMessage(''); };
   const editAt = (i: number, v: string): void => {
      const n = Number(v);
      if (!Number.isFinite(n)) return;
      setPoints((p) => p.map((x, j) => (j === i ? Math.min(100, Math.max(0, n)) : x)));
      setSaveMessage('');
   };

   // ── Save ────────────────────────────────────────────────────────────────

   const saveAll = async (): Promise<void> => {
      if (!circuitId) return;
      setIsSaving(true); setSaveMessage(''); setSaveError('');
      try {
         const payload: CircuitPositionsPayload = {
            circuitId,
            cornerPositions: points.length > 0 ? points : null,
            sector1StartPercent: sector1,
            sector2StartPercent: sector2,
            sector3StartPercent: sector3,
            activeAeroRanges: aeroZones.length > 0 ? aeroZones : null,
            overtakeDetectionPercent: overtakeDetection,
            overtakeActivationPercent: overtakeActivation,
            speedTrapPercent: speedTrap,
            pitLaneEntryPercent: pitEntry,
            pitLaneExitPercent: pitExit,
         };
         await circuitService.saveCircuitPositions(payload);
         setSaveMessage(`Saved all positions for ${circuitId}!`);
      } catch (error: unknown) {
         let msg = 'Failed to save.';
         if (axios.isAxiosError(error)) {
            const rd = error.response?.data as { message?: string } | undefined;
            msg = rd?.message || error.message;
         } else if (error instanceof Error) { msg = error.message; }
         setSaveError(msg);
      } finally { setIsSaving(false); }
   };

   // ── Copy ────────────────────────────────────────────────────────────────

   const outputText = JSON.stringify({
      cornerPositions: points,
      sector1StartPercent: sector1, sector2StartPercent: sector2, sector3StartPercent: sector3,
      activeAeroRanges: aeroZones,
      overtakeDetectionPercent: overtakeDetection, overtakeActivationPercent: overtakeActivation,
      speedTrapPercent: speedTrap,
      pitLaneEntryPercent: pitEntry,
      pitLaneExitPercent: pitExit,
   }, null, 2);

   const copyOutput = async (): Promise<void> => {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
   };

   // ── Derived ─────────────────────────────────────────────────────────────

   const expectedCorners = selectedCircuit?.corners ?? 0;
   const activeColor = MODES.find((m) => m.key === mode)?.color ?? '#fff';

   // ── Render ──────────────────────────────────────────────────────────────

   return (
      <div className="cpp-root">
         <style>{CSS}</style>

         {/* ── Sidebar ── */}
         <div className="cpp-side">
            <div>
               <h1 className="cpp-h1">Circuit Data Picker</h1>
               <p className="cpp-sub">Click the track to place positions for each data type.</p>
            </div>

            {/* Circuit select */}
            <select className="cpp-select" value={circuitId}
               onChange={(e: ChangeEvent<HTMLSelectElement>) => setCircuitId(e.target.value)}>
               {CIRCUITS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Mode tabs */}
            <div className="cpp-modes">
               {MODES.map((m) => (
                  <button key={m.key} type="button"
                     className={`cpp-mode-btn${mode === m.key ? ' active' : ''}`}
                     style={mode === m.key ? { borderColor: m.color, color: m.color } : {}}
                     onClick={() => setMode(m.key)}>
                     {m.label}
                  </button>
               ))}
            </div>

            {/* ── Mode panels ── */}
            <div className="cpp-panel">

               {/* CORNERS */}
               {mode === 'corners' && (
                  <>
                     <div className="cpp-panel-title" style={{ color: '#E10600' }}>Corners</div>
                     <div className="cpp-hint">Click the track in driving order to add corner markers.</div>
                     <div className="cpp-row">
                        <button className="cpp-btn" type="button" onClick={undo} disabled={points.length === 0}>Undo</button>
                        <button className="cpp-btn" type="button" onClick={clearCorners} disabled={points.length === 0}>Clear all</button>
                     </div>
                     <div className="cpp-corner-count">Corners: {points.length} / {expectedCorners}
                        {points.length !== expectedCorners && expectedCorners > 0 &&
                           <span className="cpp-warning"> (expected {expectedCorners})</span>}
                     </div>
                     <div className="cpp-list">
                        {points.map((pct, i) => (
                           <div className="cpp-item" key={`${i}-${pct}`}>
                              <div className="cpp-num">{i + 1}</div>
                              <input type="number" min="0" max="100" step="0.01" value={pct}
                                 onChange={(e: ChangeEvent<HTMLInputElement>) => editAt(i, e.target.value)} />
                              <button className="cpp-rm" type="button" onClick={() => removeAt(i)} aria-label={`Remove ${i + 1}`}>✕</button>
                           </div>
                        ))}
                     </div>
                     {points.length === 0 && <div className="cpp-empty">Click the track to add Turn 1.</div>}
                  </>
               )}

               {/* SECTORS */}
               {mode === 'sectors' && (
                  <>
                     <div className="cpp-panel-title" style={{ color: '#f59e0b' }}>Sector Boundaries</div>
                     <div className="cpp-hint">Click three times for S1 start, S2 start, S3 start. Clear to re-pick.</div>
                     {([['S1 Start', sector1, setSector1], ['S2 Start', sector2, setSector2], ['S3 Start', sector3, setSector3]] as const).map(([label, val, setter]) => (
                        <div className="cpp-item" key={label}>
                           <span style={{ color: '#f59e0b', fontWeight: 600, width: 60 }}>{label}</span>
                           <input type="number" min="0" max="100" step="0.01" value={val ?? ''}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                 const n = Number(e.target.value);
                                 (setter as React.Dispatch<React.SetStateAction<number | null>>)(Number.isFinite(n) ? n : null);
                              }} />
                           <button className="cpp-rm" type="button" onClick={() => (setter as React.Dispatch<React.SetStateAction<number | null>>)(null)}>✕</button>
                        </div>
                     ))}
                  </>
               )}

               {/* ACTIVE AERO */}
               {mode === 'activeAero' && (
                  <>
                     <div className="cpp-panel-title" style={{ color: '#22c55e' }}>Active Aero Zones</div>
                     <div className="cpp-hint">
                        Click twice: start → end to define a zone. Repeat for multiple zones.
                        {aeroZoneStart !== null && <><br /><b style={{ color: '#22c55e' }}>Zone start placed at {aeroZoneStart}% — click end point.</b></>}
                     </div>
                     {aeroZones.map(([s, e], i) => (
                        <div className="cpp-item" key={`aero-${i}`}>
                           <span style={{ color: '#22c55e', fontWeight: 600 }}>Zone {i + 1}</span>
                           <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}>{s}% – {e}%</span>
                           <button className="cpp-rm" type="button" onClick={() => setAeroZones((z) => z.filter((_, j) => j !== i))}>✕</button>
                        </div>
                     ))}
                     <button className="cpp-btn" type="button" style={{ marginTop: 4 }}
                        onClick={() => { setAeroZones([]); setAeroZoneStart(null); }}>Clear all zones</button>
                  </>
               )}

               {/* OVERTAKE */}
               {mode === 'overtake' && (
                  <>
                     <div className="cpp-panel-title" style={{ color: '#3b82f6' }}>Overtake Points</div>
                     <div className="cpp-hint">Click once for detection point, then activation point.</div>
                     {([['Detection', overtakeDetection, setOvertakeDetection], ['Activation', overtakeActivation, setOvertakeActivation]] as const).map(([label, val, setter]) => (
                        <div className="cpp-item" key={label}>
                           <span style={{ color: '#3b82f6', fontWeight: 600, width: 72 }}>{label}</span>
                           <input type="number" min="0" max="100" step="0.01" value={val ?? ''}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                 const n = Number(e.target.value);
                                 (setter as React.Dispatch<React.SetStateAction<number | null>>)(Number.isFinite(n) ? n : null);
                              }} />
                           <button className="cpp-rm" type="button" onClick={() => (setter as React.Dispatch<React.SetStateAction<number | null>>)(null)}>✕</button>
                        </div>
                     ))}
                  </>
               )}

               {/* SPEED TRAP */}
               {mode === 'speedTrap' && (
                  <>
                     <div className="cpp-panel-title" style={{ color: '#a855f7' }}>Speed Trap</div>
                     <div className="cpp-hint">Click the track to place the speed trap location.</div>
                     <div className="cpp-item">
                        <span style={{ color: '#a855f7', fontWeight: 600, width: 72 }}>Position</span>
                        <input type="number" min="0" max="100" step="0.01" value={speedTrap ?? ''}
                           onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const n = Number(e.target.value);
                              setSpeedTrap(Number.isFinite(n) ? n : null);
                           }} />
                        <button className="cpp-rm" type="button" onClick={() => setSpeedTrap(null)}>✕</button>
                     </div>
                  </>
               )}

               {mode === 'pitLane' && (
                  <>
                     <div className="cpp-panel-title" style={{ color: '#facc15' }}>Pit Lane</div>
                     <div className="cpp-hint">Click once for entry, then exit.</div>
                     {([['Entry', pitEntry, setPitEntry], ['Exit', pitExit, setPitExit]] as const).map(([label, val, setter]) => (
                        <div className="cpp-item" key={label}>
                           <span style={{ color: '#facc15', fontWeight: 600, width: 60 }}>{label}</span>
                           <input type="number" min="0" max="100" step="0.01" value={val ?? ''}
                              onChange={(e) => {
                                 const n = Number(e.target.value);
                                 (setter as React.Dispatch<React.SetStateAction<number | null>>)(Number.isFinite(n) ? n : null);
                              }} />
                           <button className="cpp-rm" type="button" onClick={() => (setter as React.Dispatch<React.SetStateAction<number | null>>)(null)}>✕</button>
                        </div>
                     ))}
                  </>
               )}
            </div>

            {/* ── Output / Save ── */}
            <div>
               <p className="cpp-sub" style={{ marginBottom: 6 }}>Current values:</p>
               <textarea className="cpp-textarea" readOnly value={outputText} />

               <button className="cpp-btn cpp-save" type="button" onClick={saveAll} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save all positions'}
               </button>
               <button className="cpp-btn" type="button" style={{ marginTop: 6, width: '100%' }}
                  onClick={copyOutput}>{copied ? 'Copied!' : 'Copy JSON'}</button>

               {saveMessage && <div className="cpp-success">{saveMessage}</div>}
               {saveError && <div className="cpp-error">{saveError}</div>}
            </div>
         </div>

         {/* ── SVG Canvas ── */}
         <div className="cpp-main">
            <div className="cpp-mode-indicator" style={{ borderColor: activeColor, color: activeColor }}>
               Mode: {MODES.find((m) => m.key === mode)?.label}
            </div>

            <svg ref={svgRef} className="cpp-svg" viewBox="0 0 500 500" width="640" height="640"
               onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={handleClick}>

               {/* Track shadow + line */}
               <path d={currentD} fill="none" stroke="#232838" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
               <path ref={trackPathRef} d={currentD} fill="none" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />

               {/* ── Active Aero zone arcs ── */}
               {aeroZones.map(([s, e], i) => {
                  const ps = pointAtPercent(s);
                  const pe = pointAtPercent(e);
                  // Draw a line segment between start and end points as a visual indicator
                  return (
                     <g key={`aero-arc-${i}`}>
                        <circle cx={ps.x} cy={ps.y} r="5" fill="#22c55e" stroke="#0b0e14" strokeWidth="1.5" opacity="0.7" />
                        <circle cx={pe.x} cy={pe.y} r="5" fill="#22c55e" stroke="#0b0e14" strokeWidth="1.5" opacity="0.7" />
                        <line x1={ps.x} y1={ps.y} x2={pe.x} y2={pe.y} stroke="#22c55e" strokeWidth="2" opacity="0.4" strokeDasharray="4 2" />
                        <text x={(ps.x + pe.x) / 2} y={(ps.y + pe.y) / 2 - 6} textAnchor="middle" fontSize="7" fill="#22c55e" fontWeight="700">AERO {i + 1}</text>
                     </g>
                  );
               })}

               {/* Pending aero zone start */}
               {aeroZoneStart !== null && (() => {
                  const p = pointAtPercent(aeroZoneStart);
                  return <circle cx={p.x} cy={p.y} r="6" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="3 2" />;
               })()}

               {/* ── Sector markers ── */}
               {([['S1', sector1, '#f59e0b'], ['S2', sector2, '#fbbf24'], ['S3', sector3, '#fde68a']] as const).map(([label, val, color]) => {
                  if (val === null) return null;
                  const p = pointAtPercent(val);
                  return (
                     <g key={label} transform={`translate(${p.x} ${p.y})`}>
                        <rect x="-9" y="-9" width="18" height="18" rx="3" fill={color} stroke="#0b0e14" strokeWidth="1.5" />
                        <text y="3.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1a1200">{label}</text>
                     </g>
                  );
               })}

               {/* ── Overtake markers ── */}
               {overtakeDetection !== null && (() => {
                  const p = pointAtPercent(overtakeDetection);
                  return (
                     <g transform={`translate(${p.x} ${p.y})`}>
                        <polygon points="0,-10 8,0 0,10 -8,0" fill="#3b82f6" stroke="#0b0e14" strokeWidth="1.5" />
                        <text y="3" textAnchor="middle" fontSize="5" fontWeight="700" fill="#fff">DET</text>
                     </g>
                  );
               })()}
               {overtakeActivation !== null && (() => {
                  const p = pointAtPercent(overtakeActivation);
                  return (
                     <g transform={`translate(${p.x} ${p.y})`}>
                        <polygon points="0,-10 8,0 0,10 -8,0" fill="#60a5fa" stroke="#0b0e14" strokeWidth="1.5" />
                        <text y="3" textAnchor="middle" fontSize="5" fontWeight="700" fill="#fff">ACT</text>
                     </g>
                  );
               })()}

               {/* ── Speed Trap marker ── */}
               {speedTrap !== null && (() => {
                  const p = pointAtPercent(speedTrap);
                  return (
                     <g transform={`translate(${p.x} ${p.y})`}>
                        <polygon points="0,-10 9,6 -9,6" fill="#a855f7" stroke="#0b0e14" strokeWidth="1.5" />
                        <text y="2" textAnchor="middle" fontSize="5" fontWeight="700" fill="#fff">ST</text>
                     </g>
                  );
               })()}

               {/* ── Pit Lane markers ── */}
               {pitEntry !== null && (() => {
                  const p = pointAtPercent(pitEntry);
                  return (
                     <g transform={`translate(${p.x} ${p.y})`}>
                        <circle r="6" fill="#facc15" stroke="#0b0e14" strokeWidth="1.5" />
                        <text y="2.5" textAnchor="middle" fontSize="5" fontWeight="700" fill="#1a1200">IN</text>
                     </g>
                  );
               })()}

               {pitExit !== null && (() => {
                  const p = pointAtPercent(pitExit);
                  return (
                     <g transform={`translate(${p.x} ${p.y})`}>
                        <circle r="6" fill="#4ade80" stroke="#0b0e14" strokeWidth="1.5" />
                        <text y="2.5" textAnchor="middle" fontSize="5" fontWeight="700" fill="#0b0e14">OUT</text>
                     </g>
                  );
               })()}

               {/* ── Corner markers (always visible) ── */}
               <g>
                  {points.map((pct, i) => {
                     const p = pointAtPercent(pct);
                     return (
                        <g key={`c-${i}-${pct}`} transform={`translate(${p.x} ${p.y})`}>
                           <circle r="7" fill="#E10600" stroke="#F5F5F5" strokeWidth="1.5" />
                           <text y="2.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#F5F5F5">{i + 1}</text>
                        </g>
                     );
                  })}
               </g>

               {/* Hover cursor */}
               {hover && (
                  <circle cx={hover.x} cy={hover.y} r="5" fill={activeColor} stroke="#0b0e14"
                     strokeWidth="1.5" style={{ pointerEvents: 'none' }} />
               )}
            </svg>

            {hover && (
               <div className="cpp-cursor-badge">
                  <div className="cpp-lbl">Nearest point</div>
                  <div className="cpp-pct" style={{ color: activeColor }}>{hover.percent.toFixed(2)}%</div>
               </div>
            )}
         </div>
      </div>
   );
}

// ── CSS ────────────────────────────────────────────────────────────────────

const CSS = `
.cpp-root{ display:flex; height:100vh; overflow:hidden; background:#0b0e14; color:#e7ebf3; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
.cpp-side{ width:380px; min-width:380px; background:#12161f; border-right:1px solid #232838; display:flex; flex-direction:column; padding:16px; gap:12px; overflow-y:auto; }
.cpp-main{ flex:1; display:flex; align-items:center; justify-content:center; position:relative; padding:24px; }
.cpp-h1{ font-size:15px; font-weight:600; margin:0 0 2px; letter-spacing:.2px; }
.cpp-sub{ color:#8a93a6; font-size:12px; line-height:1.5; margin:0 0 6px; }
.cpp-select, .cpp-btn{ font:inherit; color:#e7ebf3; background:#1a1f2c; border:1px solid #232838; border-radius:6px; padding:8px 10px; font-size:13px; }
.cpp-select{ width:100%; }
.cpp-btn{ cursor:pointer; }
.cpp-btn:hover:not(:disabled){ border-color:#3a4256; }
.cpp-btn:disabled{ cursor:not-allowed; opacity:.45; }
.cpp-save{ margin-top:6px; width:100%; border-color:#375a4b; background:#16362c; }
.cpp-row{ display:flex; gap:8px; }
.cpp-row > *{ flex:1; }
.cpp-modes{ display:flex; gap:4px; flex-wrap:wrap; }
.cpp-mode-btn{ font-size:11px; padding:5px 10px; border:1px solid #232838; border-radius:6px; background:#1a1f2c; color:#8a93a6; cursor:pointer; transition:all .15s; }
.cpp-mode-btn:hover{ border-color:#3a4256; color:#e7ebf3; }
.cpp-mode-btn.active{ background:#1a1f2c; font-weight:600; }
.cpp-panel{ display:flex; flex-direction:column; gap:8px; min-height:80px; }
.cpp-panel-title{ font-size:13px; font-weight:700; letter-spacing:.3px; }
.cpp-hint{ background:#1a1f2c; border:1px solid #232838; border-radius:6px; padding:8px 10px; font-size:11px; color:#8a93a6; line-height:1.5; }
.cpp-hint b{ color:#e7ebf3; }
.cpp-list{ display:flex; flex-direction:column; gap:4px; max-height:260px; overflow-y:auto; }
.cpp-item{ display:flex; align-items:center; gap:8px; background:#1a1f2c; border:1px solid #232838; border-radius:6px; padding:5px 8px; font-size:12px; font-family:'SF Mono',ui-monospace,Consolas,monospace; }
.cpp-num{ width:22px; height:22px; border-radius:50%; background:#f59e0b; color:#1a1200; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:11px; flex-shrink:0; }
.cpp-item input{ flex:1; background:transparent; border:none; color:#e7ebf3; font-family:'SF Mono',ui-monospace,Consolas,monospace; font-size:12px; width:60px; }
.cpp-rm{ background:none; border:none; color:#8a93a6; padding:2px 6px; font-size:14px; line-height:1; cursor:pointer; }
.cpp-rm:hover{ color:#ef4444; }
.cpp-empty{ color:#8a93a6; font-size:12px; text-align:center; padding:12px 0; border:1px dashed #232838; border-radius:6px; }
.cpp-corner-count{ font-size:12px; color:#8a93a6; font-weight:500; }
.cpp-warning{ color:#fbbf24; }
.cpp-textarea{ width:100%; height:100px; box-sizing:border-box; background:#0e1219; border:1px solid #232838; border-radius:6px; color:#22d3ee; font-family:'SF Mono',ui-monospace,Consolas,monospace; font-size:10px; padding:8px; resize:vertical; }
.cpp-success{ margin-top:8px; color:#86efac; font-size:11px; line-height:1.4; }
.cpp-error{ margin-top:8px; color:#fca5a5; font-size:11px; line-height:1.4; }
.cpp-svg{ max-width:100%; max-height:100%; cursor:crosshair; }
.cpp-cursor-badge{ position:absolute; top:24px; right:24px; background:#12161f; border:1px solid #232838; border-radius:8px; padding:10px 14px; font-family:'SF Mono',ui-monospace,Consolas,monospace; font-size:13px; text-align:right; }
.cpp-cursor-badge .cpp-pct{ font-size:20px; font-weight:700; }
.cpp-cursor-badge .cpp-lbl{ color:#8a93a6; font-size:10px; text-transform:uppercase; letter-spacing:.5px; }
.cpp-mode-indicator{ position:absolute; top:24px; left:24px; background:#12161f; border:1px solid; border-radius:8px; padding:6px 14px; font-size:12px; font-weight:600; letter-spacing:.3px; }
`;