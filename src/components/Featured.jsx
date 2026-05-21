import { Reveal, VideoSlot } from './Shared.jsx';

export default function FeaturedVideoSection() {
  const PROMPT = `Slow cinematic close-up of glowing ink spreading on dark water, abstract neural particles forming letters that dissolve. Dark, moody, deep purple highlights. 16:9, 10s loop.`;
  return (
    <section className="relative bg-black pt-8 md:pt-14 pb-24 md:pb-36 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <Reveal y={60} duration={1000}>
          <div className="relative rounded-3xl overflow-hidden aspect-video">
            <VideoSlot
              src="/assets/featured.mp4"
              prompt={PROMPT}
              label={"// PROMPT — generar y reemplazar:\n\n" + PROMPT}
            />
            <div aria-hidden className="absolute inset-0 pointer-events-none"
                 style={{ background: 'linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 45%)' }} />
            <div className="absolute inset-0 flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6 p-6 md:p-10">
              <div className="liquid-glass rounded-2xl p-6 md:p-7 max-w-md">
                <div className="text-white/50 text-[10px] tracking-[0.3em] uppercase mb-3">Nuestro enfoque</div>
                <p className="text-white text-sm md:text-base leading-relaxed">
                  Creemos en escuchar antes de clasificar. Cada texto que entra al sistema entrena al siguiente — un
                  vocabulario emocional que crece contigo.
                </p>
              </div>
              <div className="flex md:items-end">
                <button className="liquid-glass rounded-full px-7 py-3 text-white text-sm font-medium hover:scale-[1.04] active:scale-95 transition">
                  Explorar más
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
