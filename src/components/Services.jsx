import { Reveal, VideoSlot, IconArrowUpRight } from './Shared.jsx';

export default function ServicesSection() {
  const cards = [
    {
      tag: 'Análisis',
      title: 'Clasificador NLP',
      desc: 'Detectamos matices emocionales en cada frase — alegría, tristeza, miedo, ira y todo lo que vive entre medias.',
      src: '/assets/service-nlp.mp4',
      prompt: `Ink-on-water close-up: drops of color (violet, amber, ice blue) blooming and merging into letter-like shapes. Dark, cinematic, calm. 16:9, 8s loop.`,
    },
    {
      tag: 'Data set',
      title: 'Motor Markov',
      desc: 'Un corpus que aprende contigo. Cada frase entra al data set y entrena al siguiente — un espejo lingüístico que evoluciona.',
      src: '/assets/hero.mp4',
      prompt: `Slow camera drift over a glowing 3D mesh of letters forming and dissolving over a dark void. Soft purple glow. Cinematic. 16:9, 8s loop.`,
    },
  ];

  return (
    <section className="relative bg-black py-28 md:py-40 px-6 overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,.025) 0%, transparent 60%)' }} />
      <div className="relative max-w-6xl mx-auto">
        <Reveal y={30} duration={800} className="flex items-end justify-between mb-12 md:mb-16">
          <h2 className="text-white tracking-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 'clamp(36px, 5.5vw, 80px)',
                lineHeight: 1.05,
              }}>
            Lo que <span className="italic text-white/55">hacemos</span>
          </h2>
          <div className="hidden md:block text-white/40 text-xs tracking-[0.3em] uppercase">Nuestros servicios</div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {cards.map((c, i) => (
            <Reveal key={i} y={50} duration={900} delay={i * 150}>
              <div className="group liquid-glass rounded-3xl overflow-hidden">
                <div className="relative aspect-video overflow-hidden">
                  <VideoSlot
                    src={c.src}
                    prompt={c.prompt}
                    label={"// PROMPT — generar y reemplazar:\n\n" + c.prompt}
                    className="transition-transform duration-700 group-hover:scale-105"
                  />
                  <div aria-hidden className="absolute inset-0 pointer-events-none"
                       style={{ background: 'linear-gradient(to top, rgba(0,0,0,.45) 0%, transparent 60%)' }} />
                </div>
                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <div className="text-white/45 text-[10px] tracking-[0.3em] uppercase">{c.tag}</div>
                    <button className="liquid-glass rounded-full p-2 text-white">
                      <IconArrowUpRight size={16} />
                    </button>
                  </div>
                  <h3 className="text-white text-2xl md:text-3xl tracking-tight mb-3"
                      style={{ fontFamily: "var(--font-serif)" }}>
                    {c.title}
                  </h3>
                  <p className="text-white/55 text-sm leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
