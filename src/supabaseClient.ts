import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define the name of the Supabase table we will use
export const SUPABASE_TABLE_NAME = 'incidencias_distrito';

// Helper to get configuration
export interface SupabaseConfigKeys {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfigKeys | null {
  // Check localStorage first
  const localUrl = localStorage.getItem('REPORTES_SUPABASE_URL');
  const localKey = localStorage.getItem('REPORTES_SUPABASE_ANON_KEY');
  
  if (localUrl && localKey) {
    return { url: localUrl, anonKey: localKey };
  }

  // Check env variables
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  return null;
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem('REPORTES_SUPABASE_URL', url.trim());
  localStorage.setItem('REPORTES_SUPABASE_ANON_KEY', anonKey.trim());
}

export function clearStoredSupabaseConfig() {
  localStorage.removeItem('REPORTES_SUPABASE_URL');
  localStorage.removeItem('REPORTES_SUPABASE_ANON_KEY');
}

let supabaseInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config) {
    supabaseInstance = null;
    return null;
  }

  // If client already exists and keys haven't changed, return it
  if (supabaseInstance && lastUsedUrl === config.url && lastUsedKey === config.anonKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.anonKey);
    lastUsedUrl = config.url;
    lastUsedKey = config.anonKey;
    return supabaseInstance;
  } catch (error) {
    console.error('Error al inicializar cliente de Supabase:', error);
    return null;
  }
}

// SQL helper query for user to paste in Supabase
export const SUPABASE_SQL_SETUP = `-- 1. Crea la tabla de incidencias de coyuntura
CREATE TABLE IF NOT EXISTS public.${SUPABASE_TABLE_NAME} (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_informante TEXT NOT NULL,
    odpe TEXT NOT NULL,
    distrito TEXT NOT NULL, -- Distrito o Zona a cargo
    rubro_id INTEGER NOT NULL,
    categoria TEXT NOT NULL,
    pregunta_texto TEXT NOT NULL,
    tiene_problema BOOLEAN NOT NULL DEFAULT TRUE,
    ocurrencia TEXT NOT NULL,
    consecuencia TEXT NOT NULL,
    acciones_odpe TEXT NOT NULL,
    fuente_evidencia TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilita el acceso público para lectura y escritura (puedes ajustar esto según tu seguridad)
ALTER TABLE public.${SUPABASE_TABLE_NAME} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública" ON public.${SUPABASE_TABLE_NAME}
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública" ON public.${SUPABASE_TABLE_NAME}
    FOR INSERT WITH CHECK (true);

-- 3. Habilita la replicación en tiempo real (Realtime) para esta tabla
alter publication supabase_realtime add table public.${SUPABASE_TABLE_NAME};
`;
