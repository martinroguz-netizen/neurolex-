/**
 * index.js — NeuroLex Engine orchestrator
 * Manages classifier, Markov, dataset, Supabase persistence, and analysis
 */

import { NaiveBayesClassifier } from './classifier.js';
import { MarkovGenerator } from './markov.js';
import rawComments from '../data/comments.json';

export const EMOTIONS = {
  alegria:     { label: 'Alegría',     color: '#facc15', emoji: '😊', angle: 0 },
  confianza:   { label: 'Confianza',   color: '#06b6d4', emoji: '🤝', angle: 36 },
  sorpresa:    { label: 'Sorpresa',    color: '#f97316', emoji: '😮', angle: 72 },
  neutral:     { label: 'Neutral',     color: '#94a3b8', emoji: '😐', angle: 108 },
  miedo:       { label: 'Miedo',       color: '#8b5cf6', emoji: '😨', angle: 144 },
  tristeza:    { label: 'Tristeza',    color: '#3b82f6', emoji: '😢', angle: 180 },
  asco:        { label: 'Asco',        color: '#22c55e', emoji: '🤢', angle: 216 },
  enojo:       { label: 'Enojo',       color: '#ef4444', emoji: '😠', angle: 252 },
  frustracion: { label: 'Frustración', color: '#f43f5e', emoji: '😤', angle: 288 },
  decepcion:   { label: 'Decepción',   color: '#a855f7', emoji: '😞', angle: 324 },
};

export const POLARITY_COLORS = {
  positiva: '#22c55e',
  negativa: '#ef4444',
  mixta:    '#f97316',
  neutral:  '#94a3b8',
};

const STORAGE_KEY = 'neurolex_user_comments';
const TRAINING_KEY = 'neurolex_training_additions';

function generateIntensity(confidence) {
  if (confidence >= 0.45) return 'alta';
  if (confidence >= 0.25) return 'media';
  return 'baja';
}

function generateExplanation(label, secondaryLabel, confidence, keywords) {
  const emoMain = EMOTIONS[label]?.label || label;
  const emoSec = EMOTIONS[secondaryLabel]?.label || secondaryLabel;
  const pct = (confidence * 100).toFixed(1);
  const kwStr = keywords.length > 0 ? keywords.slice(0, 3).join(', ') : 'contexto general';

  if (confidence >= 0.45) {
    return `El texto muestra una clara tendencia hacia ${emoMain} (${pct}%), detectada principalmente por palabras como: ${kwStr}. La emoción secundaria es ${emoSec}.`;
  } else if (confidence >= 0.25) {
    return `Se detecta ${emoMain} como emoción predominante (${pct}%), aunque con presencia de ${emoSec}. Palabras clave: ${kwStr}.`;
  } else {
    return `El texto es ambiguo emocionalmente. ${emoMain} predomina ligeramente (${pct}%) sobre ${emoSec}. Indicadores: ${kwStr}.`;
  }
}

class NeuroLexEngine {
  constructor() {
    this.classifier = new NaiveBayesClassifier();
    this.markov = new MarkovGenerator(2);
    this.baseComments = this._parseComments(rawComments);
    this.userComments = this._loadStored(STORAGE_KEY);
    this.trainingAdditions = this._loadStored(TRAINING_KEY);
    this.allComments = [...this.baseComments, ...this.userComments, ...this.trainingAdditions];
    this.hashSet = new Set(this.allComments.map(c => c.hash));
    this.ready = false;
    this.trainingTime = 0;
  }

  _parseComments(raw) {
    return raw.map(c => ({
      id: c.i, texto: c.t, emocion: c.e, polaridad: c.p,
      categoria: c.c, canal: c.ch, ciudad: c.ci,
      intensidad: c.n, hash: c.h, source: 'base',
    }));
  }

  _loadStored(key) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored).map(c => ({ ...c, source: key === TRAINING_KEY ? 'training' : 'user' }));
    } catch (e) {}
    return [];
  }

  _saveStored(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }

  _generateHash(text) {
    let hash = 0;
    const str = text.toLowerCase().trim();
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 12);
  }

  train() {
    const t0 = performance.now();
    this.allComments = [...this.baseComments, ...this.userComments, ...this.trainingAdditions];
    this.hashSet = new Set(this.allComments.map(c => c.hash));

    this.classifier.train(this.allComments.map(c => ({ text: c.texto, label: c.emocion })));
    this.markov.train(this.allComments.map(c => c.texto));

    this.trainingTime = Math.round(performance.now() - t0);
    this.ready = true;
    // Dispatch event so UI components (Stats, Dataset) can react
    try { window.dispatchEvent(new CustomEvent('neurolex-retrained', { detail: { docs: this.allComments.length } })); } catch(e) {}
    return { time: this.trainingTime, docs: this.allComments.length, vocab: this.classifier.vocabSize };
  }

  /**
   * Full analysis: classify + intensity + explanation + keywords
   */
  analyze(text) {
    if (!this.ready) throw new Error('Engine not trained');
    const result = this.classifier.classify(text);

    const intensity = generateIntensity(result.confidence);
    const explanation = generateExplanation(
      result.label, result.secondaryLabel, result.confidence, result.keywords
    );

    return {
      ...result,
      intensity,
      explanation,
      emotionMeta: EMOTIONS[result.label],
      secondaryMeta: EMOTIONS[result.secondaryLabel],
    };
  }

  // Keep classify for backward compat
  classify(text) { return this.analyze(text); }

  /**
   * Add a user comment to the corpus and retrain
   */
  addComment(texto, emocion, polaridad, metadata = {}) {
    const hash = this._generateHash(texto);
    if (this.hashSet.has(hash)) return { added: false, reason: 'duplicate', hash };

    const comment = {
      id: `USR${String(this.userComments.length + 1).padStart(4, '0')}`,
      texto, emocion, polaridad,
      categoria: metadata.categoria || 'entrada del usuario',
      canal: 'interfaz web', ciudad: metadata.ciudad || 'desconocida',
      intensidad: metadata.intensidad || 3, hash, source: 'user',
    };

    this.userComments.push(comment);
    this._saveStored(STORAGE_KEY, this.userComments);
    this.train();
    return { added: true, comment, hash };
  }

  /**
   * Save a corrected/validated analysis to training data
   */
  saveToTraining(texto, emocion) {
    const hash = this._generateHash(texto + '_train');
    if (this.hashSet.has(hash)) return { added: false, reason: 'duplicate' };

    const comment = {
      id: `TRN${String(this.trainingAdditions.length + 1).padStart(4, '0')}`,
      texto, emocion, polaridad: 'validada',
      categoria: 'entrenamiento usuario', canal: 'interfaz web',
      ciudad: 'validado', intensidad: 3, hash, source: 'training',
    };

    this.trainingAdditions.push(comment);
    this._saveStored(TRAINING_KEY, this.trainingAdditions);
    this.train();
    return { added: true, newTotal: this.allComments.length };
  }

  generateText(maxWords = 40) { return this.markov.generate(maxWords); }
  getTopFeatures(emotion, n = 8) { return this.classifier.getTopFeatures(emotion, n); }

  getStats() {
    const emotionCounts = {}, polarityCounts = {}, cityCounts = {}, channelCounts = {}, categoryCounts = {};
    for (const c of this.allComments) {
      emotionCounts[c.emocion] = (emotionCounts[c.emocion] || 0) + 1;
      polarityCounts[c.polaridad] = (polarityCounts[c.polaridad] || 0) + 1;
      cityCounts[c.ciudad] = (cityCounts[c.ciudad] || 0) + 1;
      channelCounts[c.canal] = (channelCounts[c.canal] || 0) + 1;
      categoryCounts[c.categoria] = (categoryCounts[c.categoria] || 0) + 1;
    }
    return {
      total: this.allComments.length, base: this.baseComments.length,
      user: this.userComments.length, training: this.trainingAdditions.length,
      emotions: emotionCounts, polarities: polarityCounts,
      cities: cityCounts, channels: channelCounts, categories: categoryCounts,
      vocabSize: this.classifier.vocabSize, trainingTime: this.trainingTime,
    };
  }

  getComments({ page = 1, perPage = 20, emotion = null, search = '' } = {}) {
    let filtered = this.allComments;
    if (emotion) filtered = filtered.filter(c => c.emocion === emotion);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => c.texto.toLowerCase().includes(q) || c.categoria.toLowerCase().includes(q) || c.ciudad.toLowerCase().includes(q));
    }
    const total = filtered.length;
    const items = filtered.slice((page - 1) * perPage, page * perPage);
    return { items, total, page, totalPages: Math.ceil(total / perPage) };
  }
}

export const engine = new NeuroLexEngine();
