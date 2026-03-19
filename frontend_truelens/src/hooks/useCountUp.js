import { useState, useEffect, useRef } from "react";

function useCountUp(end, duration = 2000, decimals = 0) {
  const [value, setValue] = useState(0);
  const startTime = useRef(null);
  const rafId     = useRef(null);

  useEffect(() => {
    startTime.current = null;
    // FIX: cancel any in-flight animation before starting a new one
    if (rafId.current) cancelAnimationFrame(rafId.current);
    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * end).toFixed(decimals)));
      if (progress < 1) rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [end, duration, decimals]);

  return value;
}

// FIX: Separate stat display from animated-stat to avoid re-mounting all stats on scanCount change.
// The key on AnimatedStat previously included scanCount, which caused all 4 counters to unmount
// and restart from 0 on every scan. Now only the stats that actually change get new end values;
// the key is just the index so the component persists.

export default useCountUp;
