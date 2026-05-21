/**
 * markov.js — Markov Chain text generator
 * Generates plausible Spanish text based on the training corpus
 */

export class MarkovGenerator {
  constructor(order = 2) {
    this.order = order;
    this.chains = new Map(); // key (ngram) → Map(next_word → count)
    this.starters = [];      // valid sentence starters
    this.trained = false;
  }

  /**
   * Train on array of texts, optionally filtered by emotion
   */
  train(texts) {
    this.chains.clear();
    this.starters = [];

    for (const text of texts) {
      const words = text
        .toLowerCase()
        .replace(/[^\wáéíóúüñ\s.,!?¿¡]/gi, '')
        .split(/\s+/)
        .filter(w => w.length > 0);

      if (words.length < this.order + 1) continue;

      // First n words are a potential starter
      this.starters.push(words.slice(0, this.order).join(' '));

      for (let i = 0; i <= words.length - this.order - 1; i++) {
        const key = words.slice(i, i + this.order).join(' ');
        const next = words[i + this.order];

        if (!this.chains.has(key)) {
          this.chains.set(key, new Map());
        }
        const nexts = this.chains.get(key);
        nexts.set(next, (nexts.get(next) || 0) + 1);
      }
    }

    this.trained = true;
  }

  /**
   * Pick a random next word based on weighted probabilities
   */
  _pickWeighted(countsMap) {
    const entries = [...countsMap.entries()];
    const total = entries.reduce((s, [, c]) => s + c, 0);
    let r = Math.random() * total;
    for (const [word, count] of entries) {
      r -= count;
      if (r <= 0) return word;
    }
    return entries[entries.length - 1][0];
  }

  /**
   * Generate text of approximately `maxWords` length
   */
  generate(maxWords = 40) {
    if (!this.trained || this.starters.length === 0) {
      return 'El modelo necesita más datos de entrenamiento.';
    }

    const starter = this.starters[Math.floor(Math.random() * this.starters.length)];
    const words = starter.split(' ');

    for (let i = 0; i < maxWords - this.order; i++) {
      const key = words.slice(-this.order).join(' ');
      const nexts = this.chains.get(key);

      if (!nexts || nexts.size === 0) break;

      const next = this._pickWeighted(nexts);
      words.push(next);

      // End on sentence-ending punctuation if we're past minimum length
      if (words.length > 15 && /[.!?]$/.test(next)) break;
    }

    let result = words.join(' ');
    // Capitalize first letter
    result = result.charAt(0).toUpperCase() + result.slice(1);
    // Ensure ends with period
    if (!/[.!?]$/.test(result)) result += '.';

    return result;
  }
}
