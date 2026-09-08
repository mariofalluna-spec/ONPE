import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  BarChart3, 
  Database, 
  Sparkles, 
  Volume2,
  Settings,
  Download
} from 'lucide-react';
import { IncidentReport } from './types';
import DistrictWizard from './components/DistrictWizard';
import RealTimeDashboard from './components/RealTimeDashboard';
import SupabaseConfig from './components/SupabaseConfig';
import AudioReader from './components/AudioReader';
import { getSupabaseClient, SUPABASE_TABLE_NAME } from './supabaseClient';
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
  const [activeTab, setActiveTab] = useState<'wizard' | 'dashboard' | 'config'>('wizard');
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password protection for Reports & Excel ("mario")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'dashboard' | 'excel' | null>(null);

  // Hidden configuration access (accessible only via secret gesture)
  const [showConfigAccess, setShowConfigAccess] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  const handleAccessAttempt = (action: 'dashboard' | 'excel') => {
    if (isAuthenticated) {
      if (action === 'dashboard') {
        setActiveTab('dashboard');
      } else if (action === 'excel') {
        exportToExcel(reports);
      }
    } else {
      setPendingAction(action);
      setPasswordError('');
      setPasswordInput('');
      setShowPasswordModal(true);
    }
  };

  const handleVerifyPassword = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'mario') {
      setIsAuthenticated(true);
      setShowPasswordModal(false);
      setPasswordError('');
      
      // Perform the pending action
      if (pendingAction === 'dashboard') {
        setActiveTab('dashboard');
      } else if (pendingAction === 'excel') {
        exportToExcel(reports);
      }
      setPendingAction(null);
    } else {
      setPasswordError('Clave incorrecta. Intente de nuevo.');
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    if (activeTab === 'dashboard') {
      setActiveTab('wizard');
    }
  };

  const handleLogoClick = () => {
    setLogoClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowConfigAccess((show) => {
          const newState = !show;
          if (!newState && activeTab === 'config') {
            setActiveTab('wizard');
          }
          return newState;
        });
        return 0; // reset counter
      }
      return next;
    });
  };

  // Load initial data and clear legacy demo data for a pristine empty start
  useEffect(() => {
    // Unconditionally reset localStorage to guarantee a clean start from scratch as requested
    localStorage.setItem('MACE_INCIDENTS_LIST', JSON.stringify([]));
    loadAllReports();
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
    const supabase = getSupabaseClient();
    
    if (supabase) {
      setIsSupabaseActive(true);
      const success = await fetchFromSupabase();
      if (!success) {
        // Fallback to localStorage if Supabase read fails
        loadFromLocalStorage();
      }
    } else {
      setIsSupabaseActive(false);
      loadFromLocalStorage();
    }
    setLoading(false);
  };

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('MACE_INCIDENTS_LIST');
    if (stored) {
      try {
        setReports(JSON.parse(stored));
      } catch (e) {
        setReports([]);
      }
    } else {
      // Default to empty list to start entirely from scratch as requested
      setReports([]);
      localStorage.setItem('MACE_INCIDENTS_LIST', JSON.stringify([]));
    }
  };

  const fetchFromSupabase = async (): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .select('*');

      if (error) {
        console.error('Error al recuperar datos de Supabase:', error);
        return false;
      }

      if (data) {
        // Map database columns to our client-side keys
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
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error de red al consultar Supabase:', err);
      return false;
    }
  };

  // Submit a batch of new reports (called from Wizard)
  const handleReportsSubmit = async (newReports: IncidentReport[]) => {
    const supabase = getSupabaseClient();
    
    // Add unique local IDs for client references
    const reportsWithId = newReports.map(report => ({
      ...report,
      id_local: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    if (supabase) {
      try {
        // Insert into Supabase table in a single batch
        const { error } = await supabase
          .from(SUPABASE_TABLE_NAME)
          .insert(
            newReports.map(r => ({
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
          console.error('No se pudo insertar en Supabase, guardando en local:', error);
          saveReportsLocally(reportsWithId);
        } else {
          console.log('Reportes guardados exitosamente en Supabase en lote!');
          // Refresh list to pull latest from server
          fetchFromSupabase();
        }
      } catch (err) {
        console.error('Excepción al guardar en Supabase, usando local:', err);
        saveReportsLocally(reportsWithId);
      }
    } else {
      // No Supabase, save to localStorage
      saveReportsLocally(reportsWithId);
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

  const handleClearAllData = async () => {
    const confirmAction = window.confirm('¿Estás seguro de que quieres borrar todos los reportes de incidencias? Esta acción no se puede deshacer.');
    if (!confirmAction) return;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from(SUPABASE_TABLE_NAME)
          .delete()
          .neq('distrito', 'placeholder-value-to-delete-all'); // delete all records trick
        
        if (error) {
          alert('Error de Supabase al borrar: ' + error.message);
        } else {
          setReports([]);
        }
      } catch (err: any) {
        alert('Error de red al borrar en Supabase: ' + err.message);
      }
    } else {
      setReports([]);
      localStorage.removeItem('MACE_INCIDENTS_LIST');
    }
  };

  const handleConfigChange = () => {
    loadAllReports();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans antialiased pb-20 selection:bg-blue-200">
      
      {/* Official Header with ONPE Logo on the left and compact options on the extreme right */}
      <header className="bg-white border-b-4 border-blue-100 px-4 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Official ONPE Logo component */}
          <OnpeLogo 
            className="h-14 sm:h-18 md:h-20 w-auto" 
            onClick={handleLogoClick} 
          />
          
          {/* Extreme Right Navigation & Download Options */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-2.5">
            {/* Option 1: Registrar */}
            <button
              id="tab-wizard"
              onClick={() => setActiveTab('wizard')}
              className={`px-3.5 py-2 sm:px-4.5 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 border-2 ${
                activeTab === 'wizard'
                  ? 'bg-blue-800 border-blue-800 text-white shadow-md shadow-blue-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-sm sm:text-base">📝</span>
              <span>Registrar</span>
            </button>

            {/* Option 2: Ver Reportes */}
            <button
              id="tab-dashboard"
              onClick={() => handleAccessAttempt('dashboard')}
              className={`px-3.5 py-2 sm:px-4.5 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 border-2 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-800 border-blue-800 text-white shadow-md shadow-blue-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-sm sm:text-base">📊</span>
              <span>Reportes</span>
            </button>

            {/* Option 3: Descargar Excel */}
            <button
              id="btn-download-excel-header"
              onClick={() => handleAccessAttempt('excel')}
              className="px-3.5 py-2 sm:px-4.5 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 border-2 bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800 shadow-md shadow-emerald-50"
              title="Descargar todos los reportes en formato Excel (.xls)"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Excel</span>
            </button>

            {/* Lock / Close session button */}
            {isAuthenticated && (
              <button
                id="btn-signout"
                onClick={handleSignOut}
                className="px-3.5 py-2 sm:px-4.5 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm bg-rose-50 border-2 border-rose-100 text-rose-700 hover:bg-rose-100 transition-all active:scale-95 flex items-center gap-1.5"
                title="Cerrar sesión protegida"
              >
                <span className="text-sm sm:text-base">🔒</span>
                <span>Bloquear</span>
              </button>
            )}

            {/* Hidden Config Button - Activated by secret gesture */}
            {showConfigAccess && (
              <button
                id="tab-config"
                onClick={() => setActiveTab('config')}
                className={`p-2 rounded-xl transition-all border-2 shadow-sm ${
                  activeTab === 'config'
                    ? 'bg-blue-50 border-blue-600 text-blue-950 scale-105'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Opciones de Conexión de Datos (Supabase)"
              >
                <Settings className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Dynamic PWA Installation Prompts */}
        <PWAInstallButton />

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-700 border-t-transparent"></div>
            <p className="text-slate-600 font-bold mt-2">Cargando base de datos en tiempo real...</p>
          </div>
        )}

        {/* View Layout wrapper with high-quality exit/enter animations */}
        <AnimatePresence mode="wait">
          {!loading && (
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
                    onViewReportsClick={() => handleAccessAttempt('dashboard')} 
                  />
                </div>
              )}

              {activeTab === 'dashboard' && (
                <RealTimeDashboard reports={reports} />
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
          )}
        </AnimatePresence>

        {/* Password Modal protection for access to reports or excel */}
        <AnimatePresence>
          {showPasswordModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border-2 border-slate-150 relative text-center space-y-6"
              >
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all active:scale-95"
                >
                  ✕
                </button>

                <div className="mx-auto w-14 h-14 bg-blue-50 text-blue-800 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                  🔐
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight animate-pulse">Acceso Restringido</h3>
                  <p className="text-sm font-bold text-slate-500">Ingrese la clave de seguridad para visualizar o descargar los reportes MACE.</p>
                </div>

                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Clave de Acceso</label>
                    <input
                      type="password"
                      autoFocus
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setPasswordError('');
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-700 rounded-xl font-bold text-center text-slate-900 focus:outline-none placeholder-slate-300 text-lg transition-all"
                    />
                    {passwordError && (
                      <p className="text-xs font-black text-rose-600 text-center animate-bounce mt-1">
                        ⚠️ {passwordError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 active:scale-98 transition-all rounded-xl font-extrabold text-sm text-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-blue-800 hover:bg-blue-900 active:scale-98 transition-all text-white rounded-xl font-extrabold text-sm shadow-md shadow-blue-100"
                    >
                      Ingresar
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Dynamic Offline status detector banner */}
      <OfflineIndicator />

    </div>
  );
}
