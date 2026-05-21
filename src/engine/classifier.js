/**
 * classifier.js — Hybrid Emotion Classifier
 * 
 * Combines two signals:
 * 1. Lexicon-based scoring: explicit emotion keywords in Spanish
 * 2. Naive Bayes: statistical patterns from training corpus
 * 
 * This hybrid approach works because:
 * - Lexicon catches direct cues ("me da miedo", "estoy feliz", "qué asco")
 * - Naive Bayes catches subtle patterns from 2500 training examples
 * - Combined weight: 40% lexicon + 60% Naive Bayes
 */

import { extractFeatures, tokenize, normalize } from './preprocessor.js';

// Spanish emotion lexicon — explicit keywords mapped to emotions
const LEXICON = {
  alegria: {
    strong: ['feliz','contento','contenta','alegría','alegria','encantado','encantada','maravilloso','maravillosa','excelente','fantástico','fantastico','genial','increíble','increible','perfecto','perfecta','encanta','amo','amor','hermoso','hermosa','espectacular','brillante','extraordinario'],
    moderate: ['bueno','buena','bien','bonito','bonita','lindo','linda','agradable','satisfecho','satisfecha','cómodo','comodo','gusto','gustó','recomiendo','recomendable','valió','valiosa','sonrisa','positivo','positiva','disfrute','disfruté','mejor','favorito','favorita'],
  },
  enojo: {
    strong: ['furioso','furiosa','enojado','enojada','indignado','indignada','rabia','ira','coraje','molesto','molesta','enfurecido','enfurecida','intolerante','inaceptable','abuso','injusto','injusta'],
    moderate: ['enoja','enojar','irritante','irritado','irritada','harto','harta','cansado','cansada','colmo','hartazgo','queja','quejé','reclamo','reclamé','insoportable','intolerable'],
  },
  tristeza: {
    strong: ['triste','tristeza','deprimido','deprimida','desolado','desolada','devastado','devastada','desconsolado','lloré','lloro','llorando','dolor','sufrimiento','angustia','pena','soledad'],
    moderate: ['melancolía','melancolia','nostálgico','nostalgico','apagado','apagada','desanimado','desanimada','vacío','vacia','extraño','añoranza','pérdida','perdida','lamentable','decaído'],
  },
  miedo: {
    strong: ['miedo','terror','pánico','panico','aterrorizado','aterrorizada','espantado','espantada','horrorizado','horrorizada','temor','fobia','pavor'],
    moderate: ['asustado','asustada','preocupado','preocupada','inquieto','inquieta','nervioso','nerviosa','inseguro','insegura','desconfianza','riesgo','temeroso','temerosa','ansiedad','ansioso','ansiosa','estafa','estafaron','estafado','fraude'],
  },
  sorpresa: {
    strong: ['sorprendido','sorprendida','impactado','impactada','asombrado','asombrada','atónito','atonito','estupefacto','estupefacta','increíble','no lo puedo creer','impresionante'],
    moderate: ['sorpresa','inesperado','inesperada','no esperaba','superó','sorprendió','impresionó','expectativas','novedad','descubrimiento','repentino','repentina'],
  },
  asco: {
    strong: ['asco','asqueroso','asquerosa','repugnante','nauseabundo','vomitar','repulsivo','repulsiva','inmundo','inmunda','pestilente','podrido','podrida'],
    moderate: ['desagradable','horrible','horroroso','horrorosa','pésimo','pesimo','deplorable','sucio','sucia','mugre','mugroso','mugrosa','apestoso','apestosa','feo','fea','cochinada','rechazo','higiene'],
  },
  neutral: {
    strong: ['normal','neutro','neutra','estándar','estandar','regular','ordinario','ordinaria'],
    moderate: ['aceptable','pasable','común','comun','corriente','habitual','típico','tipico','estable','tranquilo','tranquila','sin novedad','nada especial','sin problemas'],
  },
  frustracion: {
    strong: ['frustrado','frustrada','frustración','frustracion','desesperado','desesperada','impotente','impotencia','exasperado','exasperada'],
    moderate: ['frustrante','desesperante','desgastante','insistir','insistí','cansé','hartazgo','obstáculo','obstaculo','burocracia','ineficiente','incompetente','no funciona','no sirve','no responde'],
  },
  confianza: {
    strong: ['confío','confio','confianza','fiable','confiable','seguro','segura','leal','lealtad','fiel','fidelidad'],
    moderate: ['respaldo','garantía','garantia','cumplieron','cumplió','profesional','serio','seria','responsable','puntual','honesto','honesta','transparente','recomendable'],
  },
  decepcion: {
    strong: ['decepcionado','decepcionada','decepción','decepcion','defraudado','defraudada','desilusionado','desilusionada','traicionado','traicionada'],
    moderate: ['esperaba más','esperaba mas','no cumplió','incumplió','engañado','engañada','engaño','falso','falsa','mentira','mentiras','promesas rotas','mala calidad','peor de lo esperado'],
  },
};

class NaiveBayesCore {
  constructor() {
    this.classCounts = new Map();
    this.classWordCounts = new Map();
    this.classTotalWords = new Map();
    this.totalDocs = 0;
    this.vocabSize = 0;
    this.vocabulary = new Map();
    this.classes = [];
    this.trained = false;
  }

  train(data) {
    this.classCounts.clear();
    this.classWordCounts.clear();
    this.classTotalWords.clear();
    this.vocabulary.clear();
    this.totalDocs = data.length;

    for (const { text, label } of data) {
      const features = extractFeatures(text);
      this.classCounts.set(label, (this.classCounts.get(label) || 0) + 1);
      if (!this.classWordCounts.has(label)) {
        this.classWordCounts.set(label, new Map());
        this.classTotalWords.set(label, 0);
      }
      const wm = this.classWordCounts.get(label);
      for (const w of features) {
        wm.set(w, (wm.get(w) || 0) + 1);
        this.classTotalWords.set(label, this.classTotalWords.get(label) + 1);
        if (!this.vocabulary.has(w)) this.vocabulary.set(w, this.vocabulary.size);
      }
    }
    this.vocabSize = this.vocabulary.size;
    this.classes = [...this.classCounts.keys()].sort();
    this.trained = true;
  }

  /** Returns normalized scores (0-1) per class */
  score(text) {
    if (!this.trained) return {};
    const features = extractFeatures(text);
    if (features.length === 0) {
      const u = {};
      for (const c of this.classes) u[c] = 1 / this.classes.length;
      return u;
    }

    const alpha = 1.0;
    const logProbs = new Map();
    const contribs = new Map();

    const tf = new Map();
    for (const w of features) tf.set(w, (tf.get(w) || 0) + 1);

    for (const cls of this.classes) {
      let logP = Math.log(this.classCounts.get(cls) / this.totalDocs);
      const wc = this.classWordCounts.get(cls);
      const tw = this.classTotalWords.get(cls);
      const d = tw + alpha * this.vocabSize;
      const cs = [];

      for (const [word, count] of tf) {
        const c = wc.get(word) || 0;
        logP += count * Math.log((c + alpha) / d);
        if (c > 0) cs.push({ word, strength: c / tw });
      }

      logProbs.set(cls, logP);
      contribs.set(cls, cs.sort((a, b) => b.strength - a.strength).slice(0, 8));
    }

    // Adaptive temperature softmax
    const vals = [...logProbs.values()];
    const range = Math.max(...vals) - Math.min(...vals);
    const T = Math.max(range / 5, 1);

    const maxL = Math.max(...vals);
    let expSum = 0;
    const exps = new Map();
    for (const [cls, lp] of logProbs) {
      const v = Math.exp((lp - maxL) / T);
      exps.set(cls, v);
      expSum += v;
    }

    const scores = {};
    for (const [cls, v] of exps) {
      scores[cls] = v / expSum;
    }

    return { scores, contribs };
  }

  getTopFeatures(cls, n = 10) {
    if (!this.classWordCounts.has(cls)) return [];
    return [...this.classWordCounts.get(cls).entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, n)
      .map(([word, score]) => ({ word, score: Math.round(score * 100) / 100 }));
  }
}

export class NaiveBayesClassifier {
  constructor() {
    this.nb = new NaiveBayesCore();
    this.vocabSize = 0;
    this.classes = [];
  }

  get trained() { return this.nb.trained; }

  train(data) {
    this.nb.train(data);
    this.vocabSize = this.nb.vocabSize;
    this.classes = this.nb.classes;
  }

  /** Lexicon scoring: scan normalized text for emotion keywords */
  _lexiconScore(text) {
    const lower = normalize(text);
    const tokens = lower.split(/\s+/);
    const scores = {};

    for (const [emotion, lists] of Object.entries(LEXICON)) {
      let score = 0;
      for (const word of lists.strong) {
        if (lower.includes(word)) score += 3.0;
      }
      for (const word of lists.moderate) {
        if (lower.includes(word)) score += 1.5;
      }
      scores[emotion] = score;
    }

    // Normalize to probability distribution
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    if (total > 0) {
      for (const k of Object.keys(scores)) scores[k] /= total;
    } else {
      // No lexicon matches: uniform
      const n = Object.keys(scores).length;
      for (const k of Object.keys(scores)) scores[k] = 1 / n;
    }

    return scores;
  }

  classify(text) {
    if (!this.nb.trained) throw new Error('Not trained');

    const { scores: nbScores, contribs } = this.nb.score(text);
    const lexScores = this._lexiconScore(text);

    // Check if lexicon found any strong signal
    const lexMax = Math.max(...Object.values(lexScores));
    const hasLexSignal = lexMax > 0.15; // More than uniform (1/10 = 0.1)

    // Blend weights: more lexicon weight when it has signal
    const lexWeight = hasLexSignal ? 0.45 : 0.15;
    const nbWeight = 1 - lexWeight;

    // Combine
    const distribution = {};
    const allClasses = new Set([...Object.keys(nbScores), ...Object.keys(lexScores)]);

    for (const cls of allClasses) {
      const nb = nbScores[cls] || 0;
      const lex = lexScores[cls] || 0;
      distribution[cls] = Math.round((nb * nbWeight + lex * lexWeight) * 10000) / 10000;
    }

    // Normalize
    const total = Object.values(distribution).reduce((s, v) => s + v, 0);
    if (total > 0) {
      for (const k of Object.keys(distribution)) {
        distribution[k] = Math.round((distribution[k] / total) * 10000) / 10000;
      }
    }

    // Find top 2
    let best = { label: '', prob: 0 }, second = { label: '', prob: 0 };
    for (const [cls, prob] of Object.entries(distribution)) {
      if (prob > best.prob) { second = { ...best }; best = { label: cls, prob }; }
      else if (prob > second.prob) { second = { label: cls, prob }; }
    }

    // Keywords from NB contributions for the winning class
    const keywords = (contribs?.get(best.label) || []).slice(0, 6).map(c => c.word);

    // Also add any lexicon words found
    const lexWords = [];
    const lower = normalize(text);
    const lex = LEXICON[best.label];
    if (lex) {
      for (const w of [...lex.strong, ...lex.moderate]) {
        if (lower.includes(w)) lexWords.push(w);
      }
    }
    const allKeywords = [...new Set([...lexWords.slice(0, 3), ...keywords])].slice(0, 6);

    return {
      label: best.label,
      confidence: Math.round(best.prob * 10000) / 10000,
      secondaryLabel: second.label,
      secondaryConfidence: Math.round(second.prob * 10000) / 10000,
      distribution,
      keywords: allKeywords,
    };
  }

  getTopFeatures(cls, n = 10) {
    return this.nb.getTopFeatures(cls, n);
  }

  getStats() {
    return { totalDocs: this.nb.totalDocs, vocabSize: this.vocabSize, classes: this.classes };
  }
}
