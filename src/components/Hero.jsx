import { Reveal, IconSparkle, IconArrowRight, IconInstagram, IconTwitter, IconGlobe } from './Shared.jsx';

export default function Hero({ scrollTo, trainInfo }) {
  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col" id="hero">
      {/* Video background */}
      <video
        src="/assets/hero.mp4"
        muted autoPlay loop playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.55 }}
      />

      {/* Fallback gradient */}
      <div className="absolute inset-0 -z-10" style={{
        background: 'radial-gradient(ellipse at 50% 70%, rgba(120,80,200,.18) 0%, rgba(0,0,0,1) 65%)'
      }} />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.2) 30%, rgba(0,0,0,.15) 60%, rgba(0,0,0,.85) 100%)'
      }} />

      {/* ── Navbar (exact from handoff) ── */}
      <div className="relative z-20 px-6 py-6">
        <nav className="liquid-glass rounded-full max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center gap-2 text-white">
              <IconSparkle size={20} />
              <span className="font-semibold text-lg tracking-tight"
                    style={{ fontFamily: "var(--font-serif)" }}>NeuroLex</span>
            </div>
            <div className="hidden md:flex items-center gap-8 ml-10">
              <button onClick={() => scrollTo('dataset')}
                      className="text-white/70 hover:text-white text-sm font-medium transition-colors">Data set</button>
              <button onClick={() => scrollTo('clasificador')}
                      className="text-white/70 hover:text-white text-sm font-medium transition-colors">Clasificador</button>
              <button onClick={() => scrollTo('estadisticas')}
                      className="text-white/70 hover:text-white text-sm font-medium transition-colors">Estadísticas</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/40 text-xs tracking-wider hidden sm:block">v4.2</span>
            <button onClick={() => scrollTo('clasificador')}
                    className="liquid-glass rounded-full px-5 py-2 text-white text-sm font-medium hover:brightness-125 transition">
              Acceder
            </button>
          </div>
        </nav>
      </div>

      {/* ── Hero content (exact structure from handoff) ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center"
           style={{ transform: 'translateY(-6%)' }}>
        <Reveal y={20} duration={1200}>
          <h1 className="text-white tracking-tight whitespace-nowrap"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 'clamp(56px, 11vw, 168px)',
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
              }}>
            Siente lo que <em className="italic" style={{ fontStyle: 'italic' }}>escribes.</em>
          </h1>
        </Reveal>

        <Reveal y={20} duration={900} delay={250}>
          <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-xl mt-8 px-4"
             style={{ fontFamily: "var(--font-serif)", fontStyle: 'italic' }}>
            Una herramienta de análisis emocional bidireccional. Escribe, y el sistema escucha — clasifica lo que sientes
            y aprende de cada palabra que dejas.
          </p>
        </Reveal>

        <Reveal y={20} duration={900} delay={420}>
          <div onClick={() => scrollTo('clasificador')}
               className="liquid-glass rounded-full max-w-xl w-full mt-10 pl-6 pr-2 py-2 flex items-center gap-3 cursor-pointer hover:brightness-110 transition"
               style={{ width: 'min(560px, 92vw)' }}>
            <span className="flex-1 text-white/40 text-sm py-2 text-left">
              Escribe un comentario para clasificar...
            </span>
            <button className="bg-white rounded-full p-3 text-black hover:bg-white/90 active:scale-95 transition">
              <IconArrowRight size={18} color="black" />
            </button>
          </div>
        </Reveal>

        <Reveal y={20} duration={900} delay={580}>
          <div className="flex items-center gap-3 mt-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/35 text-xs tracking-wider">
              Motor entrenado · {trainInfo?.docs || 2500} docs · {trainInfo?.vocab?.toLocaleString() || '—'} features · {trainInfo?.time || 0}ms
            </span>
          </div>
        </Reveal>

        <Reveal y={20} duration={900} delay={700}>
          <button onClick={() => scrollTo('estadisticas')}
                  className="mt-6 liquid-glass rounded-full px-7 py-3 text-white text-sm font-medium hover:brightness-125 transition">
            Leer el manifiesto
          </button>
        </Reveal>
      </div>

      {/* ── Social footer (exact from handoff) ── */}
      <Reveal y={16} duration={900} delay={750} className="relative z-10 flex justify-center gap-3 pb-10">
        {[IconInstagram, IconTwitter, IconGlobe].map((Ic, i) => (
          <button key={i}
                  className="liquid-glass rounded-full p-3 text-white/80 hover:text-white hover:brightness-125 transition">
            <Ic size={18} />
          </button>
        ))}
      </Reveal>
    </section>
  );
}
