import { Reveal } from './Shared.jsx';

export default function AboutSection() {
  return (
    <section className="relative bg-black pt-32 md:pt-44 pb-12 md:pb-16 px-6 overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at top, rgba(255,255,255,.04) 0%, transparent 70%)' }} />
      <div className="relative max-w-6xl mx-auto">
        <Reveal y={20} duration={700}>
          <div className="text-white/40 text-xs tracking-[0.3em] uppercase mb-6">
            Sobre NeuroLex
          </div>
        </Reveal>
        <Reveal y={40} duration={900} delay={120}>
          <h2 className="text-white leading-[1.05] tracking-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 'clamp(40px, 7vw, 110px)',
              }}>
            Cartografiamos{' '}
            <span className="italic text-white/55">la emoción</span>{' '}
            <br className="hidden md:block" />
            del lenguaje que{' '}
            <span className="italic text-white/55">vive en ti.</span>
          </h2>
        </Reveal>
      </div>
    </section>
  );
}
