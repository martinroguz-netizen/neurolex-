import { Reveal, VideoSlot } from './Shared.jsx';

export default function PhilosophySection() {
  const PROMPT = `Macro shot of soft glowing tendrils of light forming organic shapes, slowly breathing. Black background, subtle purple/amber accents. Cinematic, abstract, ambient. 4:3, 10s loop.`;
  return (
    <section className="relative bg-black py-28 md:py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <Reveal y={40} duration={900}>
          <h2 className="text-white tracking-tight mb-16 md:mb-24"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 'clamp(48px, 8vw, 128px)',
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
              }}>
            Lenguaje <span className="italic text-white/45">×</span> Emoción
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          <Reveal x={-40} duration={1000}>
            <div className="rounded-3xl overflow-hidden aspect-[4/3] relative">
              <VideoSlot src="/assets/philosophy.mp4" prompt={PROMPT} label={"// PROMPT — generar y reemplazar:\n\n" + PROMPT} />
            </div>
          </Reveal>

          <Reveal x={40} duration={1000} className="flex flex-col gap-10">
            <div>
              <div className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4">Elige tu espacio</div>
              <p className="text-white/75 text-base md:text-lg leading-relaxed">
                Toda observación significativa empieza donde se cruzan el lenguaje y la sensación. Operamos en
                ese cruce: convertimos texto crudo en mapas emocionales, y los mapas en herramientas que te
                ayudan a entenderte mejor.
              </p>
            </div>
            <div className="w-full h-px bg-white/10" />
            <div>
              <div className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4">Da forma al futuro</div>
              <p className="text-white/75 text-base md:text-lg leading-relaxed">
                El mejor trabajo aparece cuando la curiosidad se encuentra con la convicción. Nuestro proceso
                descubre patrones ocultos y los traduce en experiencias que resuenan mucho después de la
                primera lectura.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
