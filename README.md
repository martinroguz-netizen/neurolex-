# NeuroLex Analyzer v4 — Autopoiesis Emocional

Sistema bidireccional de análisis emocional con clasificador **Multinomial Naive Bayes**, vectorización **TF-IDF**, generador **Markov Chain**, persistencia en **Supabase**, y un corpus autoexpandible de **2,500+ comentarios**.

## Setup rápido

```bash
npm install
cp .env.example .env   # Editar con tus credenciales de Supabase
npm run dev
```

## Configurar Supabase (persistencia)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** → New query → pega el contenido de `supabase-setup.sql` → Run
3. Ve a **Settings → API** → copia la URL y la anon key
4. Crea un archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. En Vercel: Settings → Environment Variables → agrega las mismas 2 variables

**Sin Supabase:** la app funciona al 100% — el clasificador, generador, y entrenamiento local siguen funcionando con localStorage. Supabase solo agrega persistencia en la nube y el historial.

## Arquitectura

### Motor NLP (100% in-browser, sin API)
- **Preprocesamiento**: normalización Unicode → tokenización → stop words (300+) → stemming español
- **Features**: unigramas + bigramas
- **Clasificador**: Multinomial Naive Bayes con Laplace smoothing + temperature-scaled softmax
- **10 clases**: alegría, enojo, tristeza, miedo, sorpresa, asco, neutral, frustración, confianza, decepción
- **Salida**: emoción dominante, secundaria, confianza, intensidad, palabras clave, explicación
- **Generador Markov**: cadena de orden 2 entrenada sobre el corpus

### Persistencia dual
- **localStorage**: comentarios de entrenamiento del usuario (sobreviven recargas)
- **Supabase**: historial de análisis, validaciones, correcciones (persiste entre dispositivos)

### Entrenamiento en vivo
- Agregar comentarios al corpus → retrain automático
- Botones: ✓ Correcto | ✏ Corregir emoción | 💾 Guardar en entrenamiento
- El contador de documentos se actualiza en tiempo real
- Deduplicación por hash único

### Distribución realista (fix)
- Temperature scaling (T=0.3) en softmax evita que una emoción se lleve el 100%
- Los porcentajes reflejan la ambigüedad real del texto

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| NLP Engine | Vanilla JS (cero dependencias) |
| Persistencia | Supabase (PostgreSQL) + localStorage |
| Videos | 4 MP4 cinematográficos |
| Deploy | Vercel |

## Deploy en Vercel

```bash
npx vercel --prod
```

O conecta el repo de GitHub — Vercel detecta Vite automáticamente.

**Importante:** agrega las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel → Settings → Environment Variables.

## Estructura

```
src/
├── engine/
│   ├── index.js          # Orquestador: classifier + markov + data + analysis
│   ├── classifier.js     # Naive Bayes + temperature softmax + keyword extraction
│   ├── markov.js         # Cadenas de Markov (orden 2)
│   └── preprocessor.js   # normalize → tokenize → stem → ngrams
├── lib/
│   └── supabase.js       # Cliente + CRUD: save, correct, history
├── components/
│   ├── Analyzer.jsx      # Clasificador + feedback + historial
│   ├── Dataset.jsx       # Explorador del corpus
│   ├── Stats.jsx         # Plutchik wheel + charts
│   ├── Hero.jsx          # Hero con video background
│   ├── About.jsx         # Sección "Sobre"
│   ├── Featured.jsx      # Video featured
│   ├── Philosophy.jsx    # Lenguaje × Emoción
│   ├── Services.jsx      # Clasificador NLP + Motor Markov cards
│   ├── Footer.jsx        # CTA footer
│   └── Shared.jsx        # Reveal, VideoSlot, Icons, useInView
├── data/
│   └── comments.json     # 2,500 comentarios base
├── App.jsx
├── main.jsx
└── index.css
public/
└── assets/               # 4 videos MP4
supabase-setup.sql        # SQL para crear la tabla
```

## UAT — Facultad de Ingeniería Tampico · 2026
