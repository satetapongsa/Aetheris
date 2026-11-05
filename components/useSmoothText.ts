"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals streamed text smoothly at a steady, adaptive pace instead of in
 * network-sized bursts. Speed scales with the backlog so it never lags far
 * behind, and drains quickly once the stream has finished.
 */
export function useSmoothText(target: string, streaming: boolean) {
  const [shown, setShown] = useState(() => (streaming ? "" : target));
  const lenRef = useRef(shown.length);

  useEffect(() => {
    // Content replaced (e.g. regenerate/edit) → restart from the common prefix.
    if (!target.startsWith(shown.slice(0, lenRef.current))) lenRef.current = 0;

    // Background tab: rAF is paused, so just show everything.
    if (document.hidden) {
      lenRef.current = target.length;
      setShown(target);
      return;
    }

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const remaining = target.length - lenRef.current;
      if (remaining <= 0) return; // caught up — wait for more text
      // chars/sec: base pace + drain the backlog in ~0.35s (faster once finished)
      const cps = 90 + remaining * (streaming ? 3 : 7);
      let next = lenRef.current + Math.max(1, Math.round((cps * dt) / 1000));
      if (next < target.length) {
        const c = target.charCodeAt(next - 1);
        if (c >= 0xd800 && c <= 0xdbff) next++; // don't split a surrogate pair
      }
      lenRef.current = Math.min(next, target.length);
      setShown(target.slice(0, lenRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, streaming]);

  return { text: shown, animating: streaming || shown.length < target.length };
}
