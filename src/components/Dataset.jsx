import { useState, useMemo } from 'react';
import { engine, EMOTIONS, POLARITY_COLORS } from '../engine/index.js';
import { Reveal } from './Shared.jsx';

export default function DatasetSection() {
  const [emotion, setEmotion] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const data = useMemo(() => engine.getComments({ page, perPage, emotion, search }), [page, emotion, search]);

  return (
    <section className="relative bg-black py-28 md:py-40 px-6 overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 70% 80%, rgba(6,182,212,.04) 0%, transparent 60%)' }} />

      <div className="relative max-w-6xl mx-auto">
        <Reveal y={30} duration={800}>
          <div className="text-white/40 text-xs tracking-[0.3em] uppercase mb-6">Corpus de entrenamiento</div>
          <h2 className="text-white tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 6vw, 80px)', lineHeight: 1.05 }}>
            Data <span className="italic text-white/45">set</span>
          </h2>
          <p className="text-white/40 text-sm mb-12">
            {engine.allComments.length.toLocaleString()} comentarios etiquetados
            {engine.userComments.length > 0 && <span className="text-violet-400"> (+{engine.userComments.length} tuyos)</span>}
          </p>
        </Reveal>

        {/* Search */}
        <Reveal y={20} duration={700}>
          <div className="relative max-w-md mb-8">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                   placeholder="Buscar por texto, categoría o ciudad..."
                   className="w-full pl-11 pr-4 py-3 rounded-full bg-white/[0.02] border border-white/[0.06] text-white text-sm placeholder:text-white/20 liquid-glass focus:border-violet-500/30 transition-colors" />
          </div>
        </Reveal>

        {/* Emotion filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => { setEmotion(null); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!emotion ? 'bg-white/10 text-white' : 'bg-white/[0.02] text-white/40 hover:text-white/60'}`}>
            Todos
          </button>
          {Object.entries(EMOTIONS).map(([key, em]) => (
            <button key={key} onClick={() => { setEmotion(key === emotion ? null : key); setPage(1); }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: emotion === key ? em.color + '25' : 'rgba(255,255,255,0.02)',
                      color: emotion === key ? em.color : 'rgba(255,255,255,0.4)',
                      border: `1px solid ${emotion === key ? em.color + '40' : 'transparent'}`,
                    }}>
              {em.emoji} {em.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.items.map((c) => {
            const emMeta = EMOTIONS[c.emocion] || {};
            const polColor = POLARITY_COLORS[c.polaridad] || '#94a3b8';
            return (
              <div key={c.id + c.hash} className="liquid-glass rounded-2xl p-5 hover:bg-white/[0.03] transition-colors group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="emotion-tag text-[10px]"
                          style={{ background: emMeta.color + '18', color: emMeta.color, border: `1px solid ${emMeta.color}25` }}>
                      {emMeta.emoji} {emMeta.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: polColor + '15', color: polColor }}>{c.polaridad}</span>
                  </div>
                  <span className="text-white/15 text-[10px] font-mono">{c.source === 'user' ? '✦ ' : ''}{c.id}</span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed line-clamp-4 group-hover:text-white/75 transition-colors">{c.texto}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                  <span className="text-white/20 text-[10px]">{c.categoria}</span>
                  <span className="text-white/10">·</span>
                  <span className="text-white/20 text-[10px]">{c.ciudad}</span>
                  <span className="text-white/10">·</span>
                  <span className="text-white/20 text-[10px]">Int. {c.intensidad}/5</span>
                </div>
              </div>
            );
          })}
        </div>

        {data.items.length === 0 && (
          <div className="text-center py-16"><p className="text-white/20 text-sm">No se encontraron comentarios.</p></div>
        )}

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="liquid-glass rounded-full px-5 py-2 text-white/60 text-xs font-medium hover:brightness-125 transition disabled:opacity-30 disabled:cursor-not-allowed">
              ← Anterior
            </button>
            <span className="text-white/30 text-xs">{page} / {data.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                    className="liquid-glass rounded-full px-5 py-2 text-white/60 text-xs font-medium hover:brightness-125 transition disabled:opacity-30 disabled:cursor-not-allowed">
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
