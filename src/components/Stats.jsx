import { useState, useMemo, useEffect, useRef } from 'react';
import { engine, EMOTIONS, POLARITY_COLORS } from '../engine/index.js';
import { Reveal } from './Shared.jsx';

function useReactiveStats() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const handler = () => setVersion(v => v + 1);
    window.addEventListener('neurolex-retrained', handler);
    return () => window.removeEventListener('neurolex-retrained', handler);
  }, []);
  return useMemo(() => engine.getStats(), [version]);
}

function PlutchikWheel({ stats }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2;
    const emotions = Object.entries(EMOTIONS);
    const maxCount = Math.max(...Object.values(stats.emotions));
    const sliceAngle = (2 * Math.PI) / emotions.length;

    emotions.forEach(([key, em], i) => {
      const count = stats.emotions[key] || 0;
      const ratio = count / maxCount;
      const radius = 35 + ratio * 90;
      const startAngle = i * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle); ctx.closePath();
      ctx.fillStyle = em.color + '40'; ctx.fill();
      ctx.strokeStyle = em.color + '60'; ctx.lineWidth = 1.5; ctx.stroke();

      const la = startAngle + sliceAngle / 2;
      const lx = cx + Math.cos(la) * (radius + 18);
      const ly = cy + Math.sin(la) * (radius + 18);
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = em.color + 'cc';
      ctx.fillText(em.emoji, lx, ly - 6);
      ctx.font = '8px "DM Sans", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText(em.label, lx, ly + 7);
    });

    ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = 'bold 13px "DM Sans", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(stats.total.toString(), cx, cy - 1);
    ctx.font = '7px "DM Sans", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('docs', cx, cy + 11);
  }, [stats]);
  return <canvas ref={canvasRef} className="mx-auto" />;
}

function BarChart({ data, colorMap, label }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;
  return (
    <div className="liquid-glass rounded-3xl p-6">
      <div className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-5">{label}</div>
      <div className="space-y-2.5">
        {sorted.slice(0, 10).map(([key, count]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/50 text-xs truncate max-w-[60%] capitalize">{key}</span>
              <span className="text-white/30 text-xs font-mono tabular-nums">{count}</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${(count / max) * 100}%`, background: colorMap?.[key] || '#a78bfa' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsSection() {
  const stats = useReactiveStats();
  const emotionColors = {};
  for (const [k, em] of Object.entries(EMOTIONS)) emotionColors[k] = em.color;

  return (
    <section className="relative bg-black py-28 md:py-40 px-6 overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(244,63,94,.04) 0%, transparent 60%)' }} />

      <div className="relative max-w-6xl mx-auto">
        <Reveal y={30} duration={800}>
          <div className="text-white/40 text-xs tracking-[0.3em] uppercase mb-6">Panel de métricas</div>
          <h2 className="text-white tracking-tight mb-14"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 6vw, 80px)', lineHeight: 1.05 }}>
            Estadísticas <span className="italic text-white/45">del corpus</span>
          </h2>
        </Reveal>

        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { l: 'Total docs', v: stats.total, s: `${stats.base} base + ${stats.user + stats.training} agregados` },
            { l: 'Vocabulario', v: stats.vocabSize.toLocaleString(), s: 'features TF-IDF', c: '#a78bfa' },
            { l: 'Clases', v: Object.keys(stats.emotions).length, s: 'emociones', c: '#06b6d4' },
            { l: 'Train time', v: `${stats.trainingTime}ms`, s: 'Naive Bayes', c: '#22c55e' },
          ].map((card, i) => (
            <Reveal key={i} y={20} duration={700} delay={i * 80}>
              <div className="liquid-glass rounded-2xl p-5">
                <div className="text-white/30 text-[10px] tracking-[0.2em] uppercase mb-2">{card.l}</div>
                <div className="text-white text-2xl font-bold tracking-tight" style={{ color: card.c }}>{card.v}</div>
                <div className="text-white/25 text-xs mt-1">{card.s}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Reveal y={30} duration={800}>
            <div className="liquid-glass rounded-3xl p-6 flex flex-col items-center">
              <div className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-6 self-start">Rueda de Plutchik</div>
              <PlutchikWheel stats={stats} />
            </div>
          </Reveal>
          <Reveal y={30} duration={800} delay={100}>
            <BarChart data={stats.emotions} colorMap={emotionColors} label="Distribución por emoción" />
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Reveal y={30} duration={800}><BarChart data={stats.polarities} colorMap={POLARITY_COLORS} label="Por polaridad" /></Reveal>
          <Reveal y={30} duration={800} delay={100}><BarChart data={stats.channels} colorMap={{}} label="Por canal" /></Reveal>
        </div>

        {/* Categories */}
        <Reveal y={20} duration={700}>
          <div className="liquid-glass rounded-3xl p-6 mt-6">
            <div className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-5">Categorías del corpus</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <span key={cat} className="px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.04] text-white/40 text-xs hover:bg-white/[0.04] hover:text-white/60 transition-colors">
                  {cat} <span className="text-white/20 ml-1">{count}</span>
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
