import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

// Tracks the last pointer position (works for mouse hover and touch tap).
const pointer = { x: 0, y: 0 };

// Number of FlipTooltips currently mounted (i.e. a chart tooltip is showing).
let visibleTooltips = 0;

if (typeof window !== 'undefined') {
   const track = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
   };
   window.addEventListener('pointermove', track, { passive: true });
   window.addEventListener('pointerdown', track, { passive: true });

   // Mobile fix: when you tap a new chart point while another tooltip is open,
   // the browser's emulated mouse events (mouseleave on the old point, enter on
   // the new one) can race, leaving no tooltip until you tap again.
   // After each touch tap, if no tooltip ended up showing, replay the hover
   // on the element under the finger so the chart shows the new tooltip.
   window.addEventListener(
      'pointerup',
      (e: PointerEvent) => {
         if (e.pointerType !== 'touch') return;
         const { clientX, clientY } = e;
         window.setTimeout(() => {
            if (visibleTooltips > 0) return; // tooltip is already showing
            const target = document.elementFromPoint(clientX, clientY);
            if (!target || !target.closest('svg')) return; // only chart elements
            const init: MouseEventInit = { bubbles: true, cancelable: true, clientX, clientY, view: window };
            target.dispatchEvent(new MouseEvent('mouseover', init));
            target.dispatchEvent(new MouseEvent('mousemove', init));
         }, 60);
      },
      { passive: true }
   );
}

/**
 * Viewport-aware tooltip. Rendered in a portal on document.body so card
 * overflow / scroll wrappers can't clip it.
 * Prefers top-right of the pointer; flips left if cut off on the right,
 * flips below if cut off on top, and clamps to the viewport as a last resort.
 */
export const FlipTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const ref = useRef<HTMLDivElement>(null);
   const [pos, setPos] = useState({ left: 0, top: 0, visible: false });

   // Register this tooltip as visible while it is mounted
   useEffect(() => {
      visibleTooltips += 1;
      return () => {
         visibleTooltips -= 1;
      };
   }, []);

   useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const gap = 12;
      const margin = 8;

      // Horizontal: prefer right of pointer, flip to left if cut off
      let left = pointer.x + gap;
      if (left + width > vw - margin) left = pointer.x - gap - width;
      left = Math.max(margin, Math.min(left, vw - width - margin));

      // Vertical: prefer above pointer, flip below if cut off
      let top = pointer.y - gap - height;
      if (top < margin) top = pointer.y + gap;
      top = Math.max(margin, Math.min(top, vh - height - margin));

      setPos((p) => (p.left === left && p.top === top && p.visible ? p : { left, top, visible: true }));
   });

   return createPortal(
      <div
         ref={ref}
         style={{
            position: 'fixed',
            left: pos.left,
            top: pos.top,
            zIndex: 9999,
            pointerEvents: 'none',
            visibility: pos.visible ? 'visible' : 'hidden',
            background: '#1a1a2e',
            color: '#fff',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '8px 12px',
            fontSize: 12,
            fontFamily: 'ui-monospace, monospace',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
         }}
      >
         {children}
      </div>,
      document.body
   );
};

export const TipRow: React.FC<{ color: string; label: string; value: React.ReactNode }> = ({ color, label, value }) => (
   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 10, height: 10, borderRadius: 9999, background: color, display: 'inline-block' }} />
      <span>{label}</span>
      <strong style={{ marginLeft: 'auto', paddingLeft: 12 }}>{value}</strong>
   </div>
);

export default FlipTooltip;