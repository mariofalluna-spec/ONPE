import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define the name of the Supabase table we will use
export const SUPABASE_TABLE_NAME = 'incidencias_distrito';

// Default project URL if none is configured
export const DEFAULT_SUPABASE_URL = 'https://kcunaxyxanmokzvnhnsi.supabase.co';

// Helper to get configuration
export interface SupabaseConfigKeys {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfigKeys | null {
  // 1. Check if configuration was passed in the URL (Hash or Query param)
  // This allows the admin to send an auto-configured link to hundreds of mobile devices!
  if (typeof window !== 'undefined') {
    try {
      // Check hash #cfg=BASE64
      const hash = window.location.hash;
      if (hash && hash.includes('cfg=')) {
        const match = hash.match(/cfg=([^&]+)/);
        if (match && match[1]) {
          const decodedStr = decodeURIComponent(match[1]);
          const decoded = JSON.parse(atob(decodedStr));
          if (decoded.url && decoded.anonKey) {
            saveStoredSupabaseConfig(decoded.url, decoded.anonKey);
            // Clean up the URL bar so the hash doesn't linger
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            return { url: decoded.url, anonKey: decoded.anonKey };
          }
        }
      }

      // Check query params ?supa_url=...&supa_key=...
      const searchParams = new URLSearchParams(window.location.search);
      const qUrl = searchParams.get('supa_url');
      const qKey = searchParams.get('supa_key');
      if (qUrl && qKey) {
        saveStoredSupabaseConfig(qUrl, qKey);
        // Clean query params
        searchParams.delete('supa_url');
        searchParams.delete('supa_key');
        const newSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
        window.history.replaceState(null, '', window.location.pathname + newSearch);
        return { url: qUrl, anonKey: qKey };
      }
    } catch (err) {
      console.warn('No se pudo extraer configuración desde la URL:', err);
    }
  }

  // 2. Check localStorage
  const localUrl = localStorage.getItem('REPORTES_SUPABASE_URL');
  const localKey = localStorage.getItem('REPORTES_SUPABASE_ANON_KEY');
  
  if (localUrl && localKey) {
    return { url: localUrl, anonKey: localKey };
  }

  // 3. Check env variables from Vite
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  return null;
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('REPORTES_SUPABASE_URL', url.trim());
    localStorage.setItem('REPORTES_SUPABASE_ANON_KEY', anonKey.trim());
  }
}

export function clearStoredSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('REPORTES_SUPABASE_URL');
    localStorage.removeItem('REPORTES_SUPABASE_ANON_KEY');
  }
}

// Generate an auto-configuring link that can be shared to coordinators via WhatsApp or email
export function generateShareableLink(overrideUrl?: string, overrideKey?: string): string {
  const config = (overrideUrl && overrideKey) 
    ? { url: overrideUrl, anonKey: overrideKey } 
    : getStoredSupabaseConfig();
    
  if (!config || !config.url || !config.anonKey) {
    return window.location.origin + window.location.pathname;
  }

  try {
    const payload = btoa(JSON.stringify({ url: config.url.trim(), anonKey: config.anonKey.trim() }));
    const base = window.location.origin + window.location.pathname;
    return `${base}#cfg=${encodeURIComponent(payload)}`;
  } catch (e) {
    // Fallback to query params
    const base = window.location.origin + window.location.pathname;
    return `${base}?supa_url=${encodeURIComponent(config.url.trim())}&supa_key=${encodeURIComponent(config.anonKey.trim())}`;
  }
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
export const SUPABASE_SQL_SETUP = `-- 1. Crea la tabla de incidencias de coyuntura si no existe
CREATE TABLE IF NOT EXISTS public.${SUPABASE_TABLE_NAME} (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_informante TEXT NOT NULL,
    odpe TEXT NOT NULL,
    distrito TEXT NOT NULL,
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

-- 2. Habilita la seguridad por filas (Row Level Security)
ALTER TABLE public.${SUPABASE_TABLE_NAME} ENABLE ROW LEVEL SECURITY;

-- 3. Limpia políticas anteriores para evitar duplicados si se vuelve a ejecutar
DROP POLICY IF EXISTS "Permitir lectura pública" ON public.${SUPABASE_TABLE_NAME};
DROP POLICY IF EXISTS "Permitir inserción pública" ON public.${SUPABASE_TABLE_NAME};
DROP POLICY IF EXISTS "Permitir actualización pública" ON public.${SUPABASE_TABLE_NAME};
DROP POLICY IF EXISTS "Permitir eliminación pública" ON public.${SUPABASE_TABLE_NAME};
DROP POLICY IF EXISTS "Permitir acceso completo" ON public.${SUPABASE_TABLE_NAME};

-- 4. Crea las políticas para que la app y los celulares de los informantes puedan registrar y consultar
CREATE POLICY "Permitir lectura pública" ON public.${SUPABASE_TABLE_NAME}
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública" ON public.${SUPABASE_TABLE_NAME}
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización pública" ON public.${SUPABASE_TABLE_NAME}
    FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación pública" ON public.${SUPABASE_TABLE_NAME}
    FOR DELETE USING (true);

-- 5. Otorga permisos de acceso a los roles de Supabase
GRANT ALL ON TABLE public.${SUPABASE_TABLE_NAME} TO anon, authenticated, service_role;

-- 6. Habilita la replicación en tiempo real (Realtime)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = '${SUPABASE_TABLE_NAME}'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.${SUPABASE_TABLE_NAME};
  END IF;
END $$;
`;
