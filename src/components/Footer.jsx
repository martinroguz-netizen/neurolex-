import { Reveal, IconSparkle } from './Shared.jsx';
import { engine } from '../engine/index.js';

export default function Footer({ scrollTo }) {
  return (
    <footer className="relative bg-black px-6 pt-16 pb-12 overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at bottom, rgba(140,90,220,.10) 0%, transparent 65%)' }} />
      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center gap-8">
          <Reveal y={20} duration={900}>
            <h3 className="text-white tracking-tight"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 'clamp(40px, 6.5vw, 96px)',
                  lineHeight: 1.05,
                }}>
              Escribe. <span className="italic text-white/50">Siente.</span> Aprende.
            </h3>
          </Reveal>
          <Reveal y={16} duration={800} delay={150}>
            <button onClick={() => scrollTo('clasificador')}
                    className="liquid-glass rounded-full px-8 py-3.5 text-white text-sm font-medium hover:brightness-125 transition">
              Empezar a analizar
            </button>
          </Reveal>
          <div className="w-full h-px bg-white/10 mt-12" />
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 text-white/40 text-xs">
            <div className="flex items-center gap-2">
              <IconSparkle size={14} />
              <span>NeuroLex Analyzer · v4.2 · Autopoiesis Emocional · {engine.allComments.length} docs</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-white/25">UAT · Facultad de Ingeniería Tampico · 2026</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
