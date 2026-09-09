import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  BarChart3, 
  Database, 
  Sparkles, 
  Volume2,
  Settings,
  Download,
  ArrowDownToLine,
  KeyRound,
  Lock,
  ChevronDown
} from 'lucide-react';
import { IncidentReport } from './types';
import DistrictWizard, { SubmitResult } from './components/DistrictWizard';
import RealTimeDashboard from './components/RealTimeDashboard';
import SupabaseConfig from './components/SupabaseConfig';
import AudioReader from './components/AudioReader';
import { getSupabaseClient, SUPABASE_TABLE_NAME, initGlobalSupabaseConfig } from './supabaseClient';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OnpeLogo } from './components/OnpeLogo';
import { exportToExcel } from './utils/excelExport';

// Realistic seed data of MACE/ODPE Coyuntura to make charts colorful and descriptive instantly
const INITIAL_DEMO_REPORTS: IncidentReport[] = [
  {
    id_local: 'demo-1',
    nombre_informante: 'Rosa Elena Castro',
    odpe: 'ODPE PIURA',
    distrito: 'Piura Centro',
    rubro_id: 1,
    categoria: 'ACTUACIONES DE ACTORES ELECTORALES E INSTITUCIONALES',
    pregunta_texto: 'Actuaciones, denuncias, confrontaciones, amenazas, presiones o controversias vinculadas con candidatos, organizaciones políticas, personeros, autoridades, funcionarios u organismos electorales.',
    tiene_problema: true,
    ocurrencia: 'Personeros de partidos políticos sostuvieron fuerte altercado verbal en el ingreso del Colegio San Miguel de Piura por la ubicación de su propaganda.',
    consecuencia: 'Generó desorden en las colas de electores y retrasó levemente la instalación de la mesa número 0432.',
    acciones_odpe: 'El coordinador de local intercedió con la ayuda de la Policía Nacional para retirar a los militantes y mantener la distancia reglamentaria.',
    fuente_evidencia: 'Reporte directo de Coordinador de local y toma fotográfica',
    fecha_creacion: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    id_local: 'demo-2',
    nombre_informante: 'Carlos Mendoza Ríos',
    odpe: 'ODPE PUNO',
    distrito: 'Puno / Acora',
    rubro_id: 2,
    categoria: 'CONTEXTO SOCIOPOLÍTICO Y CONFLICTIVIDAD SOCIAL',
    pregunta_texto: 'Conflictos sociales, protestas, paros, movilizaciones, reclamos colectivos, disputas territoriales o bloqueos que podrían afectar el proceso electoral.',
    tiene_problema: true,
    ocurrencia: 'Gremio de agricultores locales inició un paro preventivo de 24 horas y bloqueó el puente Acora arrojando piedras y llantas.',
    consecuencia: 'Riesgo de retraso para el despliegue del personal de oficina de la ODPE y del material electoral destinado a los distritos colindantes.',
    acciones_odpe: 'Se coordinó escolta de seguridad inmediata con las Fuerzas Armadas para trasladar los convoyes de sufragio de madrugada por rutas de desvío.',
    fuente_evidencia: 'Llamada radial de alerta y comunicado de prensa local',
    fecha_creacion: new Date(Date.now() - 3600000 * 6).toISOString() // 6 hours ago
  },
  {
    id_local: 'demo-3',
    nombre_informante: 'Sofía Alatrista',
    odpe: 'ODPE HUANCAYO',
    distrito: 'Chupaca Sector 3',
    rubro_id: 3,
    categoria: 'VIOLENCIA, SEGURIDAD Y ORDEN PÚBLICO',
    pregunta_texto: 'Amenazas, agresiones, delincuencia, disturbios u otras situaciones que comprometan a personal, electores, locales o material electoral.',
    tiene_problema: true,
    ocurrencia: 'Presencia de pandillas y personas en estado etílico en los alrededores del Local Escolar Virgen de Cocharcas amenazando de manera verbal a transeúntes.',
    consecuencia: 'Sensación de inseguridad para los votantes de la tercera edad al ingresar al local electoral.',
    acciones_odpe: 'Coordinación directa con el comisario distrital para enviar patrullero fijo y serenos motorizados al sector afectado.',
    fuente_evidencia: 'Llamada telefónica de vecinos y fiscalizador del JNE',
    fecha_creacion: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
  },
  {
    id_local: 'demo-4',
    nombre_informante: 'Pedro Infante',
    odpe: 'ODPE CHICLAYO',
    distrito: 'Monsefú',
    rubro_id: 4,
    categoria: 'VÍAS, ACCESIBILIDAD Y TRANSPORTE',
    pregunta_texto: 'Bloqueos, interrupciones, problemas de navegabilidad o transporte que puedan dificultar actividades electorales.',
    tiene_problema: true,
    ocurrencia: 'Un pequeño deslizamiento de lodo por lloviznas persistentes cubrió un carril de la trocha carrozable de ingreso a Callanca.',
    consecuencia: 'Congestión vehicular y retraso en el arribo de miembros de mesa.',
    acciones_odpe: 'Se solicitó apoyo urgente a la Municipalidad Distrital de Monsefú para la limpieza de la vía con maquinaria ligera.',
    fuente_evidencia: 'Reporte del chofer del vehículo transportador de material',
    fecha_creacion: new Date(Date.now() - 3600000 * 18).toISOString() // 18 hours ago
  },
  {
    id_local: 'demo-5',
    nombre_informante: 'Clara Ortiz',
    odpe: 'ODPE CUSCO',
    distrito: 'Ocongate',
    rubro_id: 5,
    categoria: 'FENÓMENOS NATURALES E INFRAESTRUCTURA',
    pregunta_texto: 'Lluvias, huaicos, inundaciones, sismos u otros eventos que puedan afectar locales, vías o instalaciones.',
    tiene_problema: true,
    ocurrencia: 'Granizada intensa de invierno acumulada en los techos del patio central del colegio Ocongate.',
    consecuencia: 'Riesgo de caídas para el personal electoral y electores ancianos por piso sumamente resbaladizo.',
    acciones_odpe: 'Personal de limpieza y voluntarios de la ODPE despejaron la granizada con palas y colocaron aserrín en los pasillos de tránsito.',
    fuente_evidencia: 'Fotografía enviada por el Coordinador Técnico de Local',
    fecha_creacion: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    id_local: 'demo-6',
    nombre_informante: 'Clara Ortiz',
    odpe: 'ODPE CUSCO',
    distrito: 'Urcos',
    rubro_id: 6,
    categoria: 'CONECTIVIDAD, COMUNICACIONES Y SERVICIOS ESENCIALES',
    pregunta_texto: 'Problemas de internet, telefonía, energía u otros servicios necesarios para las actividades electorales.',
    tiene_problema: true,
    ocurrencia: 'Corte imprevisto del servicio eléctrico de red pública en la zona donde se ubica el centro de transmisión secundaria.',
    consecuencia: 'Riesgo de corte del servicio de transmisión de actas digitalizadas.',
    acciones_odpe: 'Activación del grupo electrógeno de emergencia provisto en el plan de contingencia de la ODPE.',
    fuente_evidencia: 'Mensaje de alerta del operador de transmisión',
    fecha_creacion: new Date(Date.now() - 3600000 * 30).toISOString() // 1.2 days ago
  }
];

export default function App() {
  const [activeTab, setActiveTabState] = useState<'wizard' | 'dashboard' | 'config'>('wizard');

  const setActiveTab = (tab: 'wizard' | 'dashboard' | 'config') => {
    setActiveTabState(tab);
  };

  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hidden configuration button: strictly false by default
  const [showConfigButton, setShowConfigButton] = useState<boolean>(false);

  // Security Auth Modal state for Excel download and Config unlocking
  const [authModalAction, setAuthModalAction] = useState<'excel' | 'config' | null>(null);
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authPasswordError, setAuthPasswordError] = useState('');

  const [logoClickCount, setLogoClickCount] = useState(0);

  const handleLogoClick = () => {
    setLogoClickCount((prev) => {
      const next = prev + 1;
      
      // Reset the counter after 4 seconds of no clicks to prevent accidental trigger
      setTimeout(() => {
        setLogoClickCount((curr) => (curr === next ? 0 : curr));
      }, 4000);

      if (next >= 5) {
        setAuthModalAction('config');
        setAuthPasswordInput('');
        setAuthPasswordError('');
        return 0; // reset counter
      }
      return next;
    });
  };

  const handleRequestExcelDownload = () => {
    setAuthModalAction('excel');
    setAuthPasswordInput('');
    setAuthPasswordError('');
  };

  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (authPasswordInput.trim() === '2026Mario') {
      const action = authModalAction;
      setAuthModalAction(null);
      setAuthPasswordInput('');
      setAuthPasswordError('');

      if (action === 'excel') {
        exportToExcel(reports);
      } else if (action === 'config') {
        setShowConfigButton(true);
        setActiveTab('config');
      }
    } else {
      setAuthPasswordError('Clave incorrecta. Acceso no autorizado.');
    }
  };

  // Load initial data and global server config
  useEffect(() => {
    async function init() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('MACE_CONFIG_UNLOCKED');
      }
      await initGlobalSupabaseConfig();
      await loadAllReports();
    }
    init();
  }, []);

  // Set up realtime sync if Supabase is connected
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsSupabaseActive(false);
      return;
    }

    setIsSupabaseActive(true);

    // Subscribe to changes in the database
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: SUPABASE_TABLE_NAME
        },
        (payload) => {
          console.log('Cambio detectado en Supabase en tiempo real:', payload);
          // Reload reports from database on changes to maintain perfect sync
          fetchFromSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSupabaseActive]);

  const loadAllReports = async () => {
    setLoading(true);
    let supabase = getSupabaseClient();
    if (!supabase) {
      await initGlobalSupabaseConfig();
      supabase = getSupabaseClient();
    }
    
    let loadedReports: IncidentReport[] = [];
    let fetchedOk = false;

    // 1. Try Supabase client first
    if (supabase) {
      setIsSupabaseActive(true);
      try {
        const { data, error } = await supabase
          .from(SUPABASE_TABLE_NAME)
          .select('*')
          .order('fecha_creacion', { ascending: false });

        if (!error && data) {
          loadedReports = data.map((d: any) => ({
            id: d.id,
            nombre_informante: d.nombre_informante,
            odpe: d.odpe,
            distrito: d.distrito,
            rubro_id: d.rubro_id,
            categoria: d.categoria,
            pregunta_texto: d.pregunta_texto,
            tiene_problema: d.tiene_problema,
            ocurrencia: d.ocurrencia,
            consecuencia: d.consecuencia,
            acciones_odpe: d.acciones_odpe,
            fuente_evidencia: d.fuente_evidencia,
            fecha_creacion: d.fecha_creacion
          }));
          fetchedOk = true;
        }
      } catch (e) {
        console.warn('Error consultando Supabase:', e);
      }
    } else {
      setIsSupabaseActive(false);
    }

    // 2. If Supabase client returned nothing or wasn't available, check server endpoint /api/reports
    if (!fetchedOk || loadedReports.length === 0) {
      try {
        const res = await fetch('/api/reports');
        if (res.ok) {
          const resData = await res.json();
          if (resData.reports && resData.reports.length > 0) {
            loadedReports = resData.reports.map((d: any) => ({
              id: d.id,
              nombre_informante: d.nombre_informante,
              odpe: d.odpe,
              distrito: d.distrito,
              rubro_id: d.rubro_id,
              categoria: d.categoria,
              pregunta_texto: d.pregunta_texto,
              tiene_problema: d.tiene_problema,
              ocurrencia: d.ocurrencia,
              consecuencia: d.consecuencia,
              acciones_odpe: d.acciones_odpe,
              fuente_evidencia: d.fuente_evidencia,
              fecha_creacion: d.fecha_creacion
            }));
            fetchedOk = true;
          }
        }
      } catch (e) {
        console.warn('Error consultando /api/reports:', e);
      }
    }

    // 3. Fallback to localStorage only if server/database had no response
    if (!fetchedOk && loadedReports.length === 0) {
      const stored = localStorage.getItem('MACE_INCIDENTS_LIST');
      if (stored) {
        try {
          loadedReports = JSON.parse(stored);
        } catch (e) {
          loadedReports = [];
        }
      }
    }

    if (loadedReports.length > 0) {
      localStorage.setItem('MACE_INCIDENTS_LIST', JSON.stringify(loadedReports));
    }
    setReports(loadedReports);
    setLoading(false);
  };

  const fetchFromSupabase = async (): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('Error al recuperar datos de Supabase:', error);
        return false;
      }

      if (data) {
        const mapped: IncidentReport[] = data.map((d: any) => ({
          id: d.id,
          nombre_informante: d.nombre_informante,
          odpe: d.odpe,
          distrito: d.distrito,
          rubro_id: d.rubro_id,
          categoria: d.categoria,
          pregunta_texto: d.pregunta_texto,
          tiene_problema: d.tiene_problema,
          ocurrencia: d.ocurrencia,
          consecuencia: d.consecuencia,
          acciones_odpe: d.acciones_odpe,
          fuente_evidencia: d.fuente_evidencia,
          fecha_creacion: d.fecha_creacion
        }));
        setReports(mapped);
        localStorage.setItem('MACE_INCIDENTS_LIST', JSON.stringify(mapped));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error de red al consultar Supabase:', err);
      return false;
    }
  };

  // Submit a batch of new reports (called from Wizard)
  const handleReportsSubmit = async (newReports: IncidentReport[]): Promise<SubmitResult> => {
    let supabase = getSupabaseClient();
    if (!supabase) {
      await initGlobalSupabaseConfig();
      supabase = getSupabaseClient();
    }
    
    // Format payload cleanly ensuring all fields have non-null, valid types
    const nowIso = new Date().toISOString();
    const payload = newReports.map(r => ({
      nombre_informante: r.nombre_informante?.trim() || 'Coordinador ODPE',
      odpe: r.odpe?.trim() || 'ODPE',
      distrito: r.distrito?.trim() || 'Distrito',
      rubro_id: Number(r.rubro_id) || 1,
      categoria: r.categoria?.trim() || 'General',
      pregunta_texto: r.pregunta_texto?.trim() || 'Pregunta de coyuntura',
      tiene_problema: Boolean(r.tiene_problema),
      ocurrencia: r.ocurrencia?.trim() || (r.tiene_problema ? 'Incidencia reportada' : 'Sin novedad / Situación normal'),
      consecuencia: r.consecuencia?.trim() || (r.tiene_problema ? 'En evaluación' : 'Sin afectación reportada'),
      acciones_odpe: r.acciones_odpe?.trim() || (r.tiene_problema ? 'Acción en curso' : 'Monitoreo preventivo de la ODPE'),
      fuente_evidencia: r.fuente_evidencia || 'Reporte de Informante',
      fecha_creacion: r.fecha_creacion || nowIso
    }));

    console.log('[handleReportsSubmit] Guardando en base de datos:', payload);

    // 1. Optimistic Local Update - Instantaneous UI sync
    setReports(prev => {
      const updated = [...newReports, ...prev];
      localStorage.setItem('MACE_INCIDENTS_LIST', JSON.stringify(updated));
      return updated;
    });

    let directSupabaseSuccess = false;
    let serverSuccess = false;
    let errorDetail = '';

    // 2. Perform Network Calls concurrently with Promise.allSettled
    const promises: Promise<any>[] = [];

    // Client-side Supabase write
    if (supabase) {
      const client = supabase;
      promises.push((async () => {
        try {
          const { error, data } = await client
            .from(SUPABASE_TABLE_NAME)
            .insert(payload)
            .select();
          if (!error) {
            directSupabaseSuccess = true;
            console.log('[handleReportsSubmit] Guardado en Supabase SDK:', data);
          } else {
            console.warn('[handleReportsSubmit] Error Supabase:', error);
            errorDetail = error.message;
          }
        } catch (err: any) {
          console.warn('[handleReportsSubmit] Error Supabase:', err);
          errorDetail = err?.message || 'Error de conexión';
        }
      })());
    }

    // Server-side write / backup
    promises.push(
      fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.ok ? res.json() : null)
        .then(resData => {
          if (resData?.success) {
            serverSuccess = true;
            if (resData.supabaseSuccess) directSupabaseSuccess = true;
          }
        })
        .catch(e => console.warn('[handleReportsSubmit] Envío /api/reports falló:', e))
    );

    await Promise.allSettled(promises);

    if (serverSuccess || directSupabaseSuccess) {
      setIsSupabaseActive(true);
      return {
        success: true,
        isOnline: true,
        count: newReports.length
      };
    } else {
      return {
        success: true,
        isOnline: false,
        count: newReports.length,
        error: errorDetail || 'Guardado localmente'
      };
    }
  };

  const saveReportsLocally = (newReportsList: IncidentReport[]) => {
    setReports(prev => {
      const updated = [...newReportsList, ...prev];
      localStorage.setItem('MACE_INCIDENTS_LIST', JSON.stringify(updated));
      return updated;
    });
  };

  // Seeder to insert rich dummy reports for presentation
  const handleLoadDemoData = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from(SUPABASE_TABLE_NAME)
          .insert(
            INITIAL_DEMO_REPORTS.map(r => ({
              nombre_informante: r.nombre_informante,
              odpe: r.odpe,
              distrito: r.distrito,
              rubro_id: r.rubro_id,
              categoria: r.categoria,
              pregunta_texto: r.pregunta_texto,
              tiene_problema: r.tiene_problema,
              ocurrencia: r.ocurrencia,
              consecuencia: r.consecuencia,
              acciones_odpe: r.acciones_odpe,
              fuente_evidencia: r.fuente_evidencia,
              fecha_creacion: r.fecha_creacion
            }))
          );
        
        if (error) {
          alert('Error de Supabase al sembrar: ' + error.message);
        } else {
          fetchFromSupabase();
        }
      } catch (err: any) {
        alert('Error al sembrar en Supabase: ' + err.message);
      }
    } else {
      // Local Seeding with unique local IDs for every item
      const clonedDemo = INITIAL_DEMO_REPORTS.map((r, i) => ({
        ...r,
        id_local: `local-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`
      }));
      const updated = [...clonedDemo, ...reports];
      setReports(updated);
      localStorage.setItem('MACE_INCIDENTS_LIST', JSON.stringify(updated));
    }
  };

  // Delete a single report (requires password '2026Mario')
  const handleDeleteSingleReport = async (report: IncidentReport, passwordAttempt: string): Promise<{ success: boolean; error?: string }> => {
    const key = passwordAttempt?.trim();
    if (key !== '2026Mario') {
      return { success: false, error: 'Clave incorrecta. Solo el personal autorizado con la clave "2026Mario" puede eliminar informes.' };
    }

    const reportId = report.id;

    // 1. Delete from Supabase client
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        if (reportId) {
          const { error } = await supabase.from(SUPABASE_TABLE_NAME).delete().eq('id', reportId);
          if (error) console.warn('Error borrando en Supabase por id:', error);
        } else {
          const { error } = await supabase.from(SUPABASE_TABLE_NAME).delete().match({
            fecha_creacion: report.fecha_creacion,
            rubro_id: report.rubro_id,
            nombre_informante: report.nombre_informante
          });
          if (error) console.warn('Error borrando en Supabase por match:', error);
        }
      } catch (err) {
        console.warn('Excepción al eliminar en Supabase:', err);
      }
    }

    // 2. Call server endpoint /api/reports/:id with auth header
    if (reportId) {
      try {
        await fetch(`/api/reports/${encodeURIComponent(reportId)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': key
          }
        });
      } catch (e) {
        console.warn('Error en servidor /api/reports/:id:', e);
      }
    }

    // 3. Remove from local state and localStorage
    setReports(prev => {
      const filtered = prev.filter(r => {
        if (reportId && r.id) {
          return r.id !== reportId;
        }
        return !(r.fecha_creacion === report.fecha_creacion && r.rubro_id === report.rubro_id && r.distrito === report.distrito);
      });
      localStorage.setItem('MACE_INCIDENTS_LIST', JSON.stringify(filtered));
      return filtered;
    });

    return { success: true };
  };

  // Clear all reports from database (requires password '2026Mario')
  const handleClearAllData = async (passwordAttempt?: string): Promise<boolean> => {
    let key = passwordAttempt?.trim();
    if (!key) {
      const promptVal = window.prompt('Por seguridad, ingrese la clave autorizada para borrar todos los reportes (2026Mario):');
      if (!promptVal) return false;
      key = promptVal.trim();
    }

    if (key !== '2026Mario') {
      alert('Clave incorrecta. Solo el personal autorizado con la clave "2026Mario" puede eliminar reportes.');
      return false;
    }

    setLoading(true);
    // 1. Clear server backup
    try {
      await fetch('/api/reports', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': key
        }
      });
    } catch (e) {
      console.warn('Error al borrar en /api/reports:', e);
    }

    // 2. Clear Supabase client
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from(SUPABASE_TABLE_NAME)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Error de red al borrar en Supabase:', err);
      }
    }

    setReports([]);
    localStorage.removeItem('MACE_INCIDENTS_LIST');
    setLoading(false);
    return true;
  };

  const handleConfigChange = () => {
    loadAllReports();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans antialiased pb-6 sm:pb-10 selection:bg-blue-200">
      
      {/* Official Header with ONPE Logo and adjacent secondary action buttons */}
      <header className="bg-white border-b-2 border-slate-200 px-3 sm:px-4 py-2 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left group: ONPE Logo + adjacent secondary tools (Reportes & Descargar) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Official ONPE Logo component */}
            <OnpeLogo 
              className="h-9 sm:h-11 w-auto cursor-pointer select-none" 
              onClick={handleLogoClick} 
            />

            <div className="h-5 w-px bg-slate-200 hidden xs:block"></div>
            
            {/* Option 2: Compact Reportes Button */}
            <button
              id="btn-reportes-main"
              onClick={() => setActiveTab(activeTab === 'dashboard' ? 'wizard' : 'dashboard')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-800 border-blue-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title="Ver panel de reportes registrados"
            >
              <span className="text-xs">📊</span>
              <span>Reportes</span>
            </button>

            {/* Option 3: Compact Descargar Excel Button (Requiere clave "2026Mario") */}
            <button
              id="btn-download-excel-header"
              onClick={handleRequestExcelDownload}
              className="p-1.5 rounded-lg border bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 text-emerald-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
              title="Descargar todos los reportes en formato Excel (.xls)"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
            </button>

            {/* Option 4: Configuración Supabase (Oculto - Se activa con 5 toques en el logo ONPE + clave) */}
            {showConfigButton && (
              <button
                id="tab-config"
                onClick={() => setActiveTab('config')}
                className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                  activeTab === 'config'
                    ? 'bg-indigo-800 border-indigo-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                }`}
                title="Configuración de Base de Datos Supabase (Admin)"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right group: Return to form if on other tab & subtle connection dot */}
          <div className="flex items-center gap-2">
            {activeTab !== 'wizard' && (
              <button
                id="btn-volver-registro"
                onClick={() => setActiveTab('wizard')}
                className="px-2.5 py-1 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-extrabold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <span>📝</span>
                <span>Llenar Reporte</span>
              </button>
            )}

            {/* Minimalist Connection Indicator */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                isSupabaseActive 
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                  : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}
              title={isSupabaseActive ? 'Base de datos Supabase conectada' : 'Conectando con Supabase'}
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="hidden sm:inline">{isSupabaseActive ? 'En línea' : 'Conectando'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 space-y-3">
        
        {/* Dynamic PWA Installation Prompts */}
        <PWAInstallButton />

        {/* View Layout wrapper with high-quality exit/enter animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="focus:outline-none"
          >
            
            {activeTab === 'wizard' && (
              <div className="space-y-4">
                <DistrictWizard 
                  onReportSubmit={handleReportsSubmit} 
                  onViewReportsClick={() => setActiveTab('dashboard')} 
                  isSupabaseActive={isSupabaseActive}
                  totalReportsCount={reports.length}
                />
              </div>
            )}

            {activeTab === 'dashboard' && (
              <RealTimeDashboard 
                reports={reports} 
                onClearAllData={handleClearAllData}
                onDeleteSingleReport={handleDeleteSingleReport}
              />
            )}

            {activeTab === 'config' && (
              <SupabaseConfig 
                onConfigChange={handleConfigChange}
                onLoadDemoData={handleLoadDemoData}
                onClearAllData={handleClearAllData}
                totalRecords={reports.length}
              />
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Dynamic Offline status detector banner */}
      <OfflineIndicator />

      {/* Security Auth Modal for Excel Download and Secret Admin Config ("2026Mario") */}
      <AnimatePresence>
        {authModalAction && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-slate-200 relative space-y-5 text-left"
            >
              <button
                type="button"
                onClick={() => {
                  setAuthModalAction(null);
                  setAuthPasswordInput('');
                  setAuthPasswordError('');
                }}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                  authModalAction === 'excel' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {authModalAction === 'excel' ? <ArrowDownToLine className="w-6 h-6 text-emerald-600" /> : <Settings className="w-6 h-6 text-blue-700" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {authModalAction === 'excel' ? 'Descargar Reportes Excel' : 'Configuración de Base de Datos'}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Acceso Protegido
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-700">
                <p className="font-bold text-slate-900 leading-relaxed">
                  {authModalAction === 'excel' 
                    ? 'Ingrese la clave de seguridad para autorizar la exportación de todos los reportes a formato Excel (.xls).'
                    : 'Modo Administrador activado tras 5 toques en el logo ONPE. Ingrese la clave de seguridad para acceder a la configuración de Supabase.'
                  }
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                    Clave de Acceso:
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="••••••••"
                    value={authPasswordInput}
                    onChange={(e) => {
                      setAuthPasswordInput(e.target.value);
                      setAuthPasswordError('');
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-blue-600 rounded-xl font-bold text-slate-900 text-center tracking-wider text-base focus:outline-none transition-all placeholder-slate-400"
                  />
                  {authPasswordError && (
                    <p className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center animate-bounce">
                      ⚠️ {authPasswordError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalAction(null);
                      setAuthPasswordInput('');
                      setAuthPasswordError('');
                    }}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 px-4 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                      authModalAction === 'excel' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-800 hover:bg-blue-900'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Confirmar</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
