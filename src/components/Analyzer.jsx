import { useState, useCallback, useRef, useEffect } from 'react';
import { engine, EMOTIONS } from '../engine/index.js';
import { Reveal } from './Shared.jsx';
import { saveAnalysis, markCorrect, correctEmotion, getHistory, isSupabaseConfigured } from '../lib/supabase.js';

const EXAMPLE_TEXTS = [
  'El servicio al cliente fue excelente, me resolvieron todo en minutos y con una sonrisa.',
  'Llevo tres semanas esperando mi pedido y nadie me da una respuesta clara. Es frustrante.',
  'No esperaba que el producto fuera tan bueno, superó mis expectativas por completo.',
  'Me da miedo comprar en línea después de que me estafaron la última vez.',
  'El sabor de la comida estaba asqueroso, parecía que llevaba días preparada.',
  'Todo estuvo normal, sin nada especial que reportar sobre mi experiencia.',
  'Confío plenamente en esta marca, nunca me han fallado en cinco años.',
  'Pagué el doble y recibí un producto de mala calidad, me siento engañado.',
];

/* ── Emotion distribution bars ── */
function EmotionBar({ emotion, value, max, isTop }) {
  const meta = EMOTIONS[emotion];
  if (!meta) return null;
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group">
      <span className="w-24 text-xs text-white/50 text-right truncate group-hover:text-white/80 transition-colors">
        {meta.emoji} {meta.label}
      </span>
      <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out"
             style={{
               width: `${pct}%`,
               background: isTop ? `linear-gradient(90deg, ${meta.color}, ${meta.color}cc)` : `${meta.color}50`,
               boxShadow: isTop ? `0 0 12px ${meta.color}40` : 'none',
             }} />
      </div>
      <span className="w-14 text-xs font-mono text-right tabular-nums"
            style={{ color: isTop ? meta.color : 'rgba(255,255,255,0.4)' }}>
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

/* ── Feedback actions (Correcto / Corregir / Guardar) ── */
function FeedbackPanel({ result, inputText, dbRecord, onFeedback }) {
  const [showCorrect, setShowCorrect] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState(null);

  const handleCorrect = async () => {
    if (dbRecord?.id) await markCorrect(dbRecord.id);
    engine.saveToTraining(inputText, result.label);
    setFeedbackStatus({ type: 'success', msg: '✓ Validado y guardado en entrenamiento.' });
    onFeedback?.();
  };

  const handleCorrectEmotion = async () => {
    if (!selectedEmotion) return;
    if (dbRecord?.id) await correctEmotion(dbRecord.id, selectedEmotion);
    engine.saveToTraining(inputText, selectedEmotion);
    setShowCorrect(false);
    setFeedbackStatus({ type: 'success', msg: `✓ Corregido a ${EMOTIONS[selectedEmotion]?.label}. Modelo reentrenado con ${engine.allComments.length} docs.` });
    onFeedback?.();
  };

  const handleSaveTraining = () => {
    const res = engine.saveToTraining(inputText, result.label);
    if (res.added) {
      setFeedbackStatus({ type: 'success', msg: `✓ Guardado en entrenamiento. Corpus: ${res.newTotal} docs.` });
      onFeedback?.();
    } else {
      setFeedbackStatus({ type: 'info', msg: 'Ya existe en el corpus de entrenamiento.' });
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-white/[0.06]">
      {!feedbackStatus && !showCorrect && (
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCorrect}
                  className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
            ✓ Correcto
          </button>
          <button onClick={() => setShowCorrect(true)}
                  className="px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20 hover:bg-amber-500/20 transition-all">
            ✏ Corregir emoción
          </button>
          <button onClick={handleSaveTraining}
                  className="px-4 py-2 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20 hover:bg-violet-500/20 transition-all">
            💾 Guardar en entrenamiento
          </button>
        </div>
      )}

      {showCorrect && (
        <div className="flex flex-wrap items-center gap-2 animate-fade-in">
          <select value={selectedEmotion} onChange={(e) => setSelectedEmotion(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs appearance-none cursor-pointer">
            <option value="" className="bg-zinc-900">Selecciona la emoción correcta</option>
            {Object.entries(EMOTIONS).map(([k, em]) => (
              <option key={k} value={k} className="bg-zinc-900">{em.emoji} {em.label}</option>
            ))}
          </select>
          <button onClick={handleCorrectEmotion} disabled={!selectedEmotion}
                  className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 active:scale-95 transition disabled:opacity-40">
            Confirmar corrección
          </button>
          <button onClick={() => setShowCorrect(false)} className="text-white/30 text-xs hover:text-white/60 transition">
            Cancelar
          </button>
        </div>
      )}

      {feedbackStatus && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-medium animate-fade-in ${
          feedbackStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
        }`}>
          {feedbackStatus.msg}
        </div>
      )}
    </div>
  );
}

/* ── Add comment form ── */
function AddCommentForm({ onAdded }) {
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState('alegria');
  const [polarity, setPolarity] = useState('positiva');
  const [status, setStatus] = useState(null);

  const handleSubmit = () => {
    if (text.trim().length < 20) {
      setStatus({ type: 'error', msg: 'El comentario debe tener al menos 20 caracteres.' });
      return;
    }
    const result = engine.addComment(text.trim(), emotion, polarity);
    if (result.added) {
      setStatus({ type: 'success', msg: `Agregado. Corpus reentrenado: ${engine.allComments.length} documentos.` });
      setText('');
      onAdded?.();
    } else {
      setStatus({ type: 'error', msg: 'Comentario duplicado detectado.' });
    }
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <div className="liquid-glass rounded-3xl p-6 md:p-8">
      <div className="mb-5">
        <div className="text-white/45 text-[10px] tracking-[0.3em] uppercase mb-2">Entrenamiento directo</div>
        <h3 className="text-white text-xl tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
          Agregar al corpus
        </h3>
        <p className="text-white/40 text-xs mt-1">Agrega un comentario etiquetado. El clasificador se reentrenará.</p>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Escribe un comentario nuevo..."
                className="w-full h-20 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-white text-sm placeholder:text-white/25 resize-none focus:border-violet-500/30 transition-colors" />
      <div className="flex flex-wrap gap-3 mt-3">
        <div className="flex-1 min-w-[120px]">
          <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Emoción</label>
          <select value={emotion} onChange={(e) => setEmotion(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-white text-xs appearance-none cursor-pointer">
            {Object.entries(EMOTIONS).map(([k, em]) => (
              <option key={k} value={k} className="bg-zinc-900">{em.emoji} {em.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Polaridad</label>
          <select value={polarity} onChange={(e) => setPolarity(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-white text-xs appearance-none cursor-pointer">
            {['positiva','negativa','mixta','neutral'].map(p => (
              <option key={p} value={p} className="bg-zinc-900">{p.charAt(0).toUpperCase()+p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={handleSubmit}
                  className="px-5 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 active:scale-95 transition">
            Agregar
          </button>
        </div>
      </div>
      {status && (
        <div className={`mt-3 px-4 py-2 rounded-xl text-xs font-medium animate-fade-in ${
          status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {status.msg}
        </div>
      )}
    </div>
  );
}

/* ── Markov generator ── */
function MarkovCard() {
  const [generated, setGenerated] = useState('');
  const [busy, setBusy] = useState(false);
  const gen = () => {
    setBusy(true);
    setTimeout(() => { setGenerated(engine.generateText(50)); setBusy(false); }, 200);
  };
  return (
    <div className="liquid-glass rounded-3xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-white/45 text-[10px] tracking-[0.3em] uppercase mb-2">Generador</div>
          <h3 className="text-white text-xl tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            Cadena de Markov
          </h3>
        </div>
        <button onClick={gen} disabled={busy}
                className="liquid-glass rounded-full px-5 py-2 text-white text-xs font-medium hover:brightness-125 transition disabled:opacity-50">
          {busy ? 'Generando...' : 'Generar texto'}
        </button>
      </div>
      {generated ? (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-white/65 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            "{generated}"
          </p>
        </div>
      ) : (
        <p className="text-white/25 text-xs">Presiona generar para crear texto sintético.</p>
      )}
    </div>
  );
}

/* ── History panel (Supabase) ── */
function HistoryPanel({ refreshKey }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    getHistory(15).then(({ data }) => { setHistory(data || []); setLoading(false); });
  }, [refreshKey]);

  if (!isSupabaseConfigured()) {
    return (
      <div className="liquid-glass rounded-3xl p-6">
        <div className="text-white/45 text-[10px] tracking-[0.3em] uppercase mb-3">Historial</div>
        <p className="text-white/25 text-xs">Configura las variables de Supabase en .env para habilitar persistencia.</p>
      </div>
    );
  }

  return (
    <div className="liquid-glass rounded-3xl p-6">
      <div className="text-white/45 text-[10px] tracking-[0.3em] uppercase mb-4">
        Historial de análisis ({history.length})
      </div>
      {loading ? (
        <p className="text-white/20 text-xs">Cargando...</p>
      ) : history.length === 0 ? (
        <p className="text-white/20 text-xs">No hay análisis guardados aún.</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {history.map((h) => {
            const em = EMOTIONS[h.emocion_predicha] || {};
            return (
              <div key={h.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{em.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: em.color }}>{em.label}</span>
                  <span className="text-white/20 text-[10px] ml-auto">{h.confianza}%</span>
                  {h.corregido && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px]">
                      {h.emocion_corregida ? `→ ${EMOTIONS[h.emocion_corregida]?.label || h.emocion_corregida}` : '✓'}
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-[11px] leading-relaxed line-clamp-2">{h.comentario}</p>
                <div className="text-white/15 text-[9px] mt-2">
                  {new Date(h.fecha_creacion).toLocaleString('es-MX')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Analyzer ── */
export default function AnalyzerSection() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [dbRecord, setDbRecord] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [corpusCount, setCorpusCount] = useState(engine.allComments.length);
  const [historyKey, setHistoryKey] = useState(0);
  const textareaRef = useRef(null);

  const refreshCounts = () => {
    setCorpusCount(engine.allComments.length);
    setHistoryKey(k => k + 1);
  };

  const analyze = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    setDbRecord(null);

    setTimeout(async () => {
      const analysis = engine.analyze(inputText.trim());
      setResult(analysis);
      setIsAnalyzing(false);

      // Save to Supabase
      if (isSupabaseConfigured()) {
        const { data } = await saveAnalysis({
          comentario: inputText.trim(),
          emocion_predicha: analysis.label,
          emocion_secundaria: analysis.secondaryLabel,
          confianza: analysis.confidence,
          intensidad: analysis.intensity,
          palabras_clave: analysis.keywords,
          explicacion: analysis.explanation,
        });
        if (data) setDbRecord(data);
        setHistoryKey(k => k + 1);
      }
    }, 350);
  }, [inputText]);

  const useExample = (text) => { setInputText(text); setResult(null); setDbRecord(null); textareaRef.current?.focus(); };

  const sortedDist = result ? Object.entries(result.distribution).sort((a, b) => b[1] - a[1]) : [];
  const topEmotion = result ? EMOTIONS[result.label] : null;
  const maxVal = sortedDist[0]?.[1] || 0;

  return (
    <section className="relative bg-black py-28 md:py-40 px-6 overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,.06) 0%, transparent 60%)' }} />
      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <Reveal y={30} duration={800}>
          <div className="text-white/40 text-xs tracking-[0.3em] uppercase mb-6">Clasificador NLP</div>
          <h2 className="text-white tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 6vw, 80px)', lineHeight: 1.05 }}>
            Analiza <span className="italic text-white/45">la emoción</span>
          </h2>
          <p className="text-white/40 text-sm max-w-lg mb-3">
            Naive Bayes con TF-IDF · {engine.classifier.vocabSize.toLocaleString()} features · 10 clases emocionales
          </p>
          <div className="flex items-center gap-2 mb-14">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/30 text-xs">
              Corpus activo: <strong className="text-white/50">{corpusCount.toLocaleString()}</strong> documentos
            </span>
          </div>
        </Reveal>

        {/* Video banner — top */}
        <Reveal y={40} duration={900}>
          <div className="relative rounded-3xl overflow-hidden aspect-[21/6] mb-10">
            <video src="/assets/analyzer-top.mp4" muted autoPlay loop playsInline preload="auto"
                   className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,.75) 0%, rgba(0,0,0,.4) 50%, rgba(0,0,0,.75) 100%)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="text-white/90 text-xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)', textShadow: '0 2px 20px rgba(0,0,0,.5)' }}>
                  Escribe. Clasifica. Entrena.
                </div>
                <div className="text-white/50 text-xs mt-2" style={{ textShadow: '0 1px 8px rgba(0,0,0,.8)' }}>
                  Un sistema que evoluciona con cada palabra que dejas.
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input panel */}
          <Reveal y={40} duration={900} className="lg:col-span-3 space-y-4">
            <div className="liquid-glass rounded-3xl p-6 md:p-8">
              <textarea ref={textareaRef} value={inputText} onChange={(e) => setInputText(e.target.value)}
                        placeholder="Escribe o pega un comentario aquí para clasificarlo..."
                        className="w-full h-40 bg-transparent text-white text-sm leading-relaxed placeholder:text-white/20 resize-none" />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                <span className="text-white/25 text-xs">{inputText.length} caracteres</span>
                <button onClick={analyze} disabled={!inputText.trim() || isAnalyzing}
                        className="bg-white rounded-full px-6 py-2.5 text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  {isAnalyzing ? 'Analizando...' : 'Clasificar'}
                </button>
              </div>
            </div>
            {/* Examples */}
            <div>
              <div className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-3">Ejemplos rápidos</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXAMPLE_TEXTS.map((t, i) => (
                  <button key={i} onClick={() => useExample(t)}
                          className="text-left px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-white/40 text-xs leading-relaxed hover:bg-white/[0.04] hover:text-white/60 hover:border-white/8 transition-all line-clamp-2">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Results panel */}
          <Reveal y={40} duration={900} delay={150} className="lg:col-span-2 space-y-4">
            {result ? (
              <>
                {/* Main emotion result */}
                <div className="liquid-glass rounded-3xl p-6 md:p-8 animate-fade-in">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                         style={{ background: topEmotion?.color + '18', boxShadow: `0 0 30px ${topEmotion?.color}15` }}>
                      {topEmotion?.emoji}
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{topEmotion?.label}</div>
                      <div className="text-white/40 text-xs mt-0.5">
                        Confianza: {(result.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Secondary emotion */}
                  {result.secondaryLabel && result.secondaryConfidence > 0.05 && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-white/[0.02]">
                      <span className="text-sm">{result.secondaryMeta?.emoji}</span>
                      <span className="text-white/50 text-xs">Secundaria: <strong style={{ color: result.secondaryMeta?.color }}>
                        {result.secondaryMeta?.label}</strong> ({(result.secondaryConfidence * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}

                  {/* Intensity badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-white/30 text-[10px] uppercase tracking-wider">Intensidad</span>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                      result.intensity === 'alta' ? 'bg-red-500/15 text-red-400' :
                      result.intensity === 'media' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-blue-500/15 text-blue-400'
                    }`}>
                      {result.intensity.toUpperCase()}
                    </span>
                  </div>

                  {/* Distribution bars */}
                  <div className="space-y-2 mb-4">
                    {sortedDist.map(([emo, val]) => (
                      <EmotionBar key={emo} emotion={emo} value={val} max={maxVal} isTop={emo === result.label} />
                    ))}
                  </div>

                  {/* Keywords */}
                  {result.keywords?.length > 0 && (
                    <div className="mb-4">
                      <div className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Palabras clave detectadas</div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords.map((kw, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-mono"
                                style={{ background: topEmotion?.color + '12', color: topEmotion?.color + 'bb', border: `1px solid ${topEmotion?.color}18` }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Explicación</div>
                    <p className="text-white/55 text-xs leading-relaxed">{result.explanation}</p>
                  </div>

                  {/* Feedback buttons */}
                  <FeedbackPanel result={result} inputText={inputText} dbRecord={dbRecord} onFeedback={refreshCounts} />
                </div>
              </>
            ) : (
              <div className="liquid-glass rounded-3xl p-8 text-center">
                <div className="text-3xl mb-4 opacity-30">🧠</div>
                <p className="text-white/30 text-sm">
                  Escribe un texto y presiona <strong className="text-white/50">Clasificar</strong> para ver el análisis emocional completo.
                </p>
              </div>
            )}
          </Reveal>
        </div>

        {/* Training + Markov + History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <Reveal y={30} duration={800}><AddCommentForm onAdded={refreshCounts} /></Reveal>
          <Reveal y={30} duration={800} delay={150}><MarkovCard /></Reveal>
        </div>

        {/* History */}
        <div className="mt-8">
          <Reveal y={30} duration={800}>
            <HistoryPanel refreshKey={historyKey} />
          </Reveal>
        </div>

        {/* Video banner — bottom */}
        <Reveal y={40} duration={900}>
          <div className="relative rounded-3xl overflow-hidden aspect-[21/6] mt-10">
            <video src="/assets/analyzer-bottom.mp4" muted autoPlay loop playsInline preload="auto"
                   className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,.7) 0%, rgba(0,0,0,.35) 50%, rgba(0,0,0,.7) 100%)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="text-white/80 text-lg md:text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-serif)', textShadow: '0 2px 20px rgba(0,0,0,.6)' }}>
                  Cada análisis entrena al siguiente.
                </div>
                <div className="text-white/40 text-xs mt-2" style={{ textShadow: '0 1px 8px rgba(0,0,0,.8)' }}>
                  Corpus activo: {corpusCount.toLocaleString()} documentos · Autopoiesis emocional
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
