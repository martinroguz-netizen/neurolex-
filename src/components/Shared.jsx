import { useEffect, useRef, useState } from 'react';

// ── useInView hook (from handoff hooks.jsx) ──
export function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (options.once !== false) obs.disconnect();
      } else if (options.once === false) {
        setInView(false);
      }
    }, { rootMargin: options.rootMargin || '-80px', threshold: options.threshold ?? 0.05 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ── Reveal (from handoff hooks.jsx) ──
export function Reveal({ children, y = 30, x = 0, delay = 0, duration = 700, className = '', as: As = 'div', once = true, style = {} }) {
  const [ref, inView] = useInView({ once });
  const styleOut = {
    transform: inView ? 'translate(0,0)' : `translate(${x}px, ${y}px)`,
    opacity: inView ? 1 : 0,
    transition: `transform ${duration}ms cubic-bezier(.2,.7,.2,1) ${delay}ms, opacity ${duration}ms ease ${delay}ms`,
    ...style,
  };
  return <As ref={ref} className={className} style={styleOut}>{children}</As>;
}

// ── VideoSlot — plays real video with fallback gradient ──
export function VideoSlot({ src, prompt, label, className = '' }) {
  const videoRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!src || !videoRef.current) return;
    const v = videoRef.current;
    const onLoaded = () => setLoaded(true);
    const onError = () => setErrored(true);
    v.addEventListener('loadeddata', onLoaded);
    v.addEventListener('error', onError);
    return () => { v.removeEventListener('loadeddata', onLoaded); v.removeEventListener('error', onError); };
  }, [src]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {src && !errored && (
        <video ref={videoRef} src={src} muted autoPlay loop playsInline preload="auto"
               className="absolute inset-0 w-full h-full object-cover" />
      )}
      {(!src || errored || !loaded) && (
        <div className="absolute inset-0 animated-gradient" />
      )}
    </div>
  );
}

// ── Icons (from handoff icons.jsx) ──
function makeIcon(paths) {
  return function Icon({ size = 20, className = '', color = 'currentColor', strokeWidth = 1.6 }) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
           fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
           className={className}>
        {paths}
      </svg>
    );
  };
}

export const IconGlobe = makeIcon(<>
  <circle cx="12" cy="12" r="10" />
  <path d="M2 12h20" />
  <path d="M12 2a15 15 0 0 1 0 20" />
  <path d="M12 2a15 15 0 0 0 0 20" />
</>);

export const IconArrowRight = makeIcon(<>
  <path d="M5 12h14" />
  <path d="M13 5l7 7-7 7" />
</>);

export const IconArrowUpRight = makeIcon(<>
  <path d="M7 17L17 7" />
  <path d="M8 7h9v9" />
</>);

export const IconInstagram = makeIcon(<>
  <rect x="3" y="3" width="18" height="18" rx="5" />
  <circle cx="12" cy="12" r="4" />
  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
</>);

export const IconTwitter = makeIcon(<>
  <path d="M22 5.8c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.2-.8.5-1.7.8-2.6 1A4 4 0 0 0 12 9.1c0 .3 0 .6.1.9A11.4 11.4 0 0 1 3 4.7a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.7-.5v.1c0 2 1.3 3.6 3.2 4-.3.1-.7.2-1.1.2l-.7-.1c.5 1.6 2 2.7 3.7 2.7A8 8 0 0 1 2 18a11.3 11.3 0 0 0 6 1.8c7.4 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.4-1.3 2-2.1z" />
</>);

export const IconSparkle = makeIcon(<>
  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
</>);

export const IconBrain = makeIcon(<>
  <path d="M9.5 2a3 3 0 0 0-3 3v.5A3 3 0 0 0 4 8.5v.4a3 3 0 0 0-1 2.3 3 3 0 0 0 1 2.3v.4a3 3 0 0 0 2.5 3v.6a3 3 0 0 0 3 3 3 3 0 0 0 3-3V5a3 3 0 0 0-3-3z" />
  <path d="M14.5 2a3 3 0 0 1 3 3v.5A3 3 0 0 1 20 8.5v.4a3 3 0 0 1 1 2.3 3 3 0 0 1-1 2.3v.4a3 3 0 0 1-2.5 3v.6a3 3 0 0 1-3 3 3 3 0 0 1-3-3" />
</>);
