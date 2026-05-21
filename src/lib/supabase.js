import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;

/**
 * Save an analyzed comment to Supabase
 */
export async function saveAnalysis({
  comentario,
  emocion_predicha,
  emocion_secundaria,
  confianza,
  intensidad,
  palabras_clave,
  explicacion,
}) {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('comentarios_analizados')
    .insert([{
      comentario,
      emocion_predicha,
      emocion_secundaria,
      confianza: Math.round(confianza * 10000) / 100,
      intensidad,
      palabras_clave,
      explicacion,
      corregido: false,
      emocion_corregida: null,
      fecha_creacion: new Date().toISOString(),
    }])
    .select()
    .single();

  return { data, error };
}

/**
 * Mark a comment as validated (correct)
 */
export async function markCorrect(id) {
  if (!supabase) return { error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('comentarios_analizados')
    .update({ corregido: true })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

/**
 * Correct the emotion of an analyzed comment
 */
export async function correctEmotion(id, emocion_corregida) {
  if (!supabase) return { error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('comentarios_analizados')
    .update({ corregido: true, emocion_corregida })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

/**
 * Get the history of analyzed comments
 */
export async function getHistory(limit = 20) {
  if (!supabase) return { data: [], error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('comentarios_analizados')
    .select('*')
    .order('fecha_creacion', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}

/**
 * Get total count of analyzed comments
 */
export async function getAnalysisCount() {
  if (!supabase) return { count: 0 };
  const { count, error } = await supabase
    .from('comentarios_analizados')
    .select('*', { count: 'exact', head: true });
  return { count: count || 0, error };
}
