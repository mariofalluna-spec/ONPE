import { useState, useEffect, FormEvent } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  PlusCircle, 
  HelpCircle 
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig, 
  clearStoredSupabaseConfig, 
  getSupabaseClient, 
  SUPABASE_SQL_SETUP,
  SUPABASE_TABLE_NAME
} from '../supabaseClient';

interface SupabaseConfigProps {
  onConfigChange: () => void;
  onLoadDemoData: () => void;
  onClearAllData: () => void;
  totalRecords: number;
}

export default function SupabaseConfig({ 
  onConfigChange, 
  onLoadDemoData, 
  onClearAllData,
  totalRecords 
}: SupabaseConfigProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error' | 'testing'>('none');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    const config = getStoredSupabaseConfig();
    if (config) {
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setIsSaved(true);
      testConnection(config.url, config.anonKey);
    }
  }, []);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) return;
    saveStoredSupabaseConfig(url, anonKey);
    setIsSaved(true);
    testConnection(url, anonKey);
    onConfigChange();
  };

  const handleClearConfig = () => {
    clearStoredSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setIsSaved(false);
    setConnectionStatus('none');
    setConnectionMessage('');
    onConfigChange();
  };

  const testConnection = async (targetUrl: string, targetKey: string) => {
    setConnectionStatus('testing');
    setConnectionMessage('Probando conexión con Supabase...');
    
    try {
      const client = getSupabaseClient();
      if (!client) {
        setConnectionStatus('error');
        setConnectionMessage('No se pudo inicializar el cliente de Supabase.');
        return;
      }

      // Try reading from the table
      const { data, error } = await client
        .from(SUPABASE_TABLE_NAME)
        .select('id')
        .limit(1);

      if (error) {
        // If the table doesn't exist yet but credentials are correct, that's a partial success
        if (error.code === '42P01') {
          setConnectionStatus('success');
          setConnectionMessage('¡Conectado a Supabase! Nota: La tabla "' + SUPABASE_TABLE_NAME + '" no existe todavía. Por favor, ejecuta el código SQL que se muestra abajo.');
        } else {
          setConnectionStatus('error');
          setConnectionMessage(`Error de conexión: ${error.message} (Código ${error.code})`);
        }
      } else {
        setConnectionStatus('success');
        setConnectionMessage('¡Conexión exitosa! Todo está sincronizado correctamente en tiempo real.');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMessage(`Excepción al conectar: ${err.message || err}`);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="supabase-config-panel" className="bg-white rounded-3xl border-4 border-blue-200 p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
          <Database className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-blue-900 leading-tight">Configuración de Base de Datos</h2>
          <p className="text-blue-600 font-medium text-sm">Conecta tu propia cuenta de Supabase para guardar incidencias de verdad</p>
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="space-y-1 text-center md:text-left">
          <div className="text-blue-950 font-black">Modo de Datos Actual:</div>
          <div className="text-blue-700 font-medium text-sm">
            {isSaved && connectionStatus === 'success' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SUPABASE ACTIVO EN TIEM REAL
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                DEMO LOCAL (Guardado en el navegador)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <button
            id="btn-load-demo"
            onClick={onLoadDemoData}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-md hover:from-amber-500 hover:to-orange-600 active:scale-95 transition-all text-sm flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" /> Generar Datos de Prueba
          </button>
          
          <button
            id="btn-clear-all"
            onClick={onClearAllData}
            className="px-4 py-2 bg-red-100 text-red-700 border-2 border-red-200 font-bold rounded-xl hover:bg-red-200 active:scale-95 transition-all text-sm flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Borrar Todo ({totalRecords})
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-blue-900 font-black mb-1 text-sm">URL de tu proyecto de Supabase (Project URL)</label>
          <input
            id="input-supabase-url"
            type="url"
            disabled={isSaved}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxxxxx.supabase.co"
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:outline-none font-medium text-slate-800 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-blue-900 font-black mb-1 text-sm">Clave anónima pública de Supabase (Anon Key)</label>
          <input
            id="input-supabase-key"
            type="password"
            disabled={isSaved}
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:outline-none font-medium text-slate-800 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
            required
          />
        </div>

        {connectionStatus !== 'none' && (
          <div className={`p-4 rounded-xl border-2 flex gap-3 ${
            connectionStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
            connectionStatus === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' :
            'bg-sky-50 border-sky-200 text-sky-900'
          }`}>
            <div className="shrink-0 mt-0.5">
              {connectionStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {connectionStatus === 'error' && <XCircle className="w-5 h-5 text-rose-600" />}
              {connectionStatus === 'testing' && <RefreshCw className="w-5 h-5 text-sky-600 animate-spin" />}
            </div>
            <div className="text-sm leading-relaxed">
              {connectionMessage}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {isSaved ? (
            <button
              id="btn-disconnect-supabase"
              type="button"
              onClick={handleClearConfig}
              className="flex-1 py-3 px-5 bg-slate-200 text-slate-700 font-bold rounded-2xl border-2 border-slate-300 hover:bg-slate-300 active:scale-95 transition-all"
            >
              Desconectar Supabase
            </button>
          ) : (
            <button
              id="btn-connect-supabase"
              type="submit"
              className="flex-1 py-3 px-5 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
            >
              Guardar y Conectar
            </button>
          )}

          <button
            id="btn-toggle-sql-guide"
            type="button"
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="px-4 py-3 bg-blue-100 text-blue-700 font-bold rounded-2xl border-2 border-blue-200 hover:bg-blue-200 active:scale-95 transition-all flex items-center gap-1.5"
            title="Mostrar ayuda de base de datos"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="hidden sm:inline">¿Cómo preparar la base de datos?</span>
          </button>
        </div>
      </form>

      {showSqlGuide && (
        <div className="border-2 border-indigo-100 rounded-2xl p-5 bg-slate-50 space-y-3 animate-fadeIn">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>🛠️ Instrucciones de Base de Datos</span>
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Para que funcione la sincronización, entra a tu panel de control en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline">Supabase</a>, ve al <strong>SQL Editor</strong> de tu proyecto, pega el siguiente código y presiona <strong>Run</strong>:
          </p>

          <div className="relative bg-slate-900 rounded-xl p-4 overflow-hidden">
            <button
              id="btn-copy-sql"
              onClick={copySql}
              className="absolute top-2 right-2 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg active:scale-95 transition-all flex items-center gap-1 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar SQL
                </>
              )}
            </button>
            <pre className="text-xs text-slate-300 font-mono overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed pt-6">
              {SUPABASE_SQL_SETUP}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
