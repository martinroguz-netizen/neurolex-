-- NeuroLex Analyzer: Supabase table for persistent analysis storage
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS comentarios_analizados (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  comentario    TEXT NOT NULL,
  emocion_predicha    TEXT NOT NULL,
  emocion_secundaria  TEXT,
  confianza     NUMERIC(6,2) NOT NULL DEFAULT 0,
  intensidad    TEXT CHECK (intensidad IN ('baja', 'media', 'alta')) DEFAULT 'media',
  palabras_clave TEXT[] DEFAULT '{}',
  explicacion   TEXT,
  corregido     BOOLEAN DEFAULT FALSE,
  emocion_corregida TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - allow all for anon key
ALTER TABLE comentarios_analizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON comentarios_analizados
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_comentarios_fecha ON comentarios_analizados (fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_comentarios_emocion ON comentarios_analizados (emocion_predicha);
