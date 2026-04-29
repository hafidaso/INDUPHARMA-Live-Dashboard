import React, { useRef, useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';

export const SafeChartContainer: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    let rafId = 0;
    if (typeof ResizeObserver === 'undefined') {
      const waitForLayout = () => {
        const rect = element.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10) {
          setReady(true);
          return;
        }
        rafId = window.requestAnimationFrame(waitForLayout);
      };
      waitForLayout();
      return () => window.cancelAnimationFrame(rafId);
    }

    const checkSize = () => {
      const rect = element.getBoundingClientRect();
      setReady(rect.width > 10 && rect.height > 10);
    };

    // Delay first measurement one frame to avoid transient -1 values during animated mount.
    rafId = window.requestAnimationFrame(checkSize);
    const observer = new ResizeObserver(checkSize);
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={hostRef} className={className}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
};
