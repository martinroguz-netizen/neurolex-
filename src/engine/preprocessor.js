/**
 * preprocessor.js — Spanish text preprocessing pipeline
 * Handles: normalization, tokenization, stop-word removal, and lightweight stemming
 */

const STOP_WORDS = new Set([
  'a','al','algo','algunas','algunos','ante','antes','como','con','contra','cual',
  'cuando','de','del','desde','donde','durante','e','el','ella','ellas','ellos',
  'en','entre','era','esa','esas','ese','eso','esos','esta','estaba','estado',
  'estas','este','esto','estos','fue','fueron','ha','había','han','hasta','hay',
  'la','las','le','les','lo','los','más','me','mi','mí','muy','nada','ni','no',
  'nos','nosotros','nuestro','o','otra','otro','otros','para','pero','por','que',
  'qué','se','ser','si','sin','sobre','somos','son','soy','su','sus','también',
  'te','ti','tiene','todo','todos','tu','tú','tus','un','una','unas','uno','unos',
  'usted','ustedes','y','ya','yo','es','está','están','esto','eso','este','ese',
  'aquí','allí','ahí','así','aún','bien','cada','casi','cierto','cómo','cuál',
  'dónde','él','ello','esa','ese','esos','esas','estos','estas','haber','hacer',
  'ir','más','menos','mucho','muy','nada','ningún','ninguno','poco','puede',
  'quien','quién','según','ser','sino','tanto','tener','toda','todas','varios',
  'vez','ya','porque','aunque','donde','después','entonces','mientras','siempre',
  'nunca','aquella','aquel','aquellos','aquellas','nos','les','me','te','se',
  'fue','fui','fuimos','fueron','iba','iban','hemos','han','he','ha','había',
  'hubo','ser','sido','siendo','estar','estoy','estás','está','estamos','están',
  'había','mismo','misma','mismos','mismas','otro','otra','otros','otras',
  'mucha','muchas','muchos','poca','pocas','pocos','toda','todas','todos',
  'del','al','lo','la','los','las','el','un','una','unos','unas',
  'mi','mis','tu','tus','su','sus','nuestro','nuestra','nuestros','nuestras',
  'qué','cuál','cuáles','quién','quiénes','cuánto','cuánta','cuántos','cuántas',
  'dónde','cuándo','cómo','por qué',
  'the','is','are','was','were','and','or','but','in','on','at','to','for',
  'que','con','por','para','como','más','pero','sin','sobre','entre',
  'tiene','puede','hace','hay','ser','estar','haber','tener','hacer','poder',
  'decir','ir','ver','dar','saber','querer','llegar','pasar','deber','poner',
  'parecer','quedar','creer','hablar','llevar','dejar','seguir','encontrar',
  'llamar','venir','pensar','salir','volver','tomar','conocer','vivir','sentir',
  'tratar','mirar','contar','empezar','esperar','buscar','existir','entrar',
  'trabajar','escribir','perder','producir','ocurrir','entender','pedir',
  'recibir','recordar','terminar','permitir','aparecer','conseguir','comenzar',
  'servir','sacar','necesitar','mantener','resultar','leer','caer','cambiar',
  'presentar','crear','abrir','considerar','oír','acabar','convertir',
  'ganar','formar','traer','partir','morir','aceptar','realizar','suponer',
  'comprender','lograr','explicar','preguntar','tocar','reconocer','estudiar',
]);

/**
 * Normalize text: lowercase, remove accents optionally, strip non-alpha
 */
export function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-záéíóúüñ\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize text into array of words
 */
export function tokenize(text) {
  const normalized = normalize(text);
  return normalized.split(' ').filter(w => w.length > 1);
}

/**
 * Remove stop words from token array
 */
export function removeStopWords(tokens) {
  return tokens.filter(t => !STOP_WORDS.has(t) && t.length > 2);
}

/**
 * Lightweight Spanish stemmer (suffix stripping)
 */
export function stem(word) {
  if (word.length < 4) return word;

  // Common Spanish suffixes ordered by length (longest first)
  const suffixes = [
    'imientos', 'imiento', 'aciones', 'uciones',
    'amente', 'mente', 'adora', 'ación', 'ución',
    'istas', 'ismos', 'iones', 'antes', 'ables',
    'ador', 'ante', 'ando', 'endo', 'ible', 'able',
    'ista', 'ismo', 'ción', 'sión',
    'ando', 'endo', 'idos', 'idas', 'ados', 'adas',
    'ores', 'osas', 'osos',
    'ido', 'ida', 'ado', 'ada', 'oso', 'osa',
    'dor', 'nte', 'dad',
    'es', 'os', 'as',
  ];

  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && (word.length - suffix.length) >= 3) {
      return word.slice(0, word.length - suffix.length);
    }
  }

  return word;
}

/**
 * Full preprocessing pipeline: text → cleaned token array
 */
export function preprocess(text) {
  const tokens = tokenize(text);
  const filtered = removeStopWords(tokens);
  return filtered.map(stem);
}

/**
 * Generate n-grams from token array
 */
export function ngrams(tokens, n = 2) {
  const result = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    result.push(tokens.slice(i, i + n).join('_'));
  }
  return result;
}

/**
 * Full feature extraction: unigrams + bigrams
 */
export function extractFeatures(text) {
  const tokens = preprocess(text);
  const bigrams = ngrams(tokens, 2);
  return [...tokens, ...bigrams];
}
