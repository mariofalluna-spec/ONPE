import { useState, useMemo, FormEvent } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Calendar, 
  MapPin, 
  Filter, 
  FileSpreadsheet,
  User,
  Building,
  CheckCircle2,
  AlertOctagon,
  BookOpen,
  Flame,
  Info,
  File,
  Trash2,
  KeyRound,
  Lock,
  Eye,
  ExternalLink,
  Download,
  X,
  Maximize2
} from 'lucide-react';
import { IncidentReport } from '../types';
import AudioReader from './AudioReader';

interface RealTimeDashboardProps {
  reports: IncidentReport[];
  onClearAllData?: (password: string) => Promise<boolean>;
  onDeleteSingleReport?: (report: IncidentReport, password: string) => Promise<{ success: boolean; error?: string }>;
}

export default function RealTimeDashboard({ reports, onClearAllData, onDeleteSingleReport }: RealTimeDashboardProps) {
  const [filterDistrict, setFilterDistrict] = useState<string>('Todos');
  const [filterRubro, setFilterRubro] = useState<string>('Todos');
  const [filterTipo, setFilterTipo] = useState<string>('con_incidencia'); // Default: Solo con Incidencia

  // Modal for previewing images / documents in full resolution
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; isImage: boolean } | null>(null);

  // Password-protected deletion states ("2026Mario")
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single'; report: IncidentReport } | { type: 'all' } | null>(null);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);

  const handleOpenDeleteSingle = (report: IncidentReport) => {
    setDeleteTarget({ type: 'single', report });
    setDeletePassword('');
    setDeleteError('');
  };

  const handleOpenClearAll = () => {
    setDeleteTarget({ type: 'all' });
    setDeletePassword('');
    setDeleteError('');
  };

  const handleOpenDirectLink = (fileData: string, fileName?: string) => {
    try {
      if (fileData.startsWith('data:')) {
        const arr = fileData.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        if (!win) {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.click();
        }
      } else {
        window.open(fileData, '_blank');
      }
    } catch (e) {
      console.error('Error opening link:', e);
      const a = document.createElement('a');
      a.href = fileData;
      a.download = fileName || 'evidencia';
      a.click();
    }
  };

  const handleConfirmDelete = async (e: FormEvent) => {
    e.preventDefault();
    const entered = deletePassword.trim();
    if (entered !== '2026Mario') {
      setDeleteError('Clave incorrecta. No tiene autorización para realizar esta acción.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      if (deleteTarget?.type === 'single') {
        if (onDeleteSingleReport) {
          const res = await onDeleteSingleReport(deleteTarget.report, entered);
          if (!res.success) {
            setDeleteError(res.error || 'Error al eliminar el reporte.');
            setIsDeleting(false);
            return;
          }
        }
        setDeleteSuccessToast(`Informe de "${deleteTarget.report.distrito}" (Rubro ${deleteTarget.report.rubro_id}) eliminado con éxito.`);
      } else if (deleteTarget?.type === 'all') {
        if (onClearAllData) {
          const success = await onClearAllData(entered);
          if (!success) {
            setDeleteError('Error al eliminar los reportes.');
            setIsDeleting(false);
            return;
          }
        }
        setDeleteSuccessToast('Todos los reportes han sido eliminados de la base de datos.');
      }

      setDeleteTarget(null);
      setDeletePassword('');
      setDeleteError('');
      setTimeout(() => setDeleteSuccessToast(null), 4000);
    } catch (err: any) {
      setDeleteError(err?.message || 'Ocurrió un error al procesar la eliminación.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryIcon = (rubroId: number) => {
    switch (rubroId) {
      case 1: return '👥';
      case 2: return '📣';
      case 3: return '🚨';
      case 4: return '🚧';
      case 5: return '⛈️';
      case 6: return '📶';
      case 7: return '👔';
      case 8: return '📅';
      case 9: return '📰';
      default: return '✅';
    }
  };

  const getCategoryColor = (rubroId: number) => {
    switch (rubroId) {
      case 1: return '#10B981'; // Emerald
      case 2: return '#F59E0B'; // Amber
      case 3: return '#EF4444'; // Rose
      case 4: return '#F97316'; // Orange
      case 5: return '#0EA5E9'; // Sky
      case 6: return '#3B82F6'; // Blue
      case 7: return '#8B5CF6'; // Violet
      case 8: return '#14B8A6'; // Teal
      case 9: return '#6366F1'; // Indigo
      default: return '#10B981';
    }
  };

  // Get unique list of districts present in reports
  const availableDistricts = useMemo(() => {
    const districts = new Set(reports.map(r => r.distrito));
    return ['Todos', ...Array.from(districts)];
  }, [reports]);

  // The 9 rubros list for filtering
  const rubrosList = [
    { id: 'Todos', label: 'Todos los Rubros' },
    { id: '1', label: '1. Actores Electorales' },
    { id: '2', label: '2. Contexto Sociopolítico' },
    { id: '3', label: '3. Violencia y Seguridad' },
    { id: '4', label: '4. Vías y Accesos' },
    { id: '5', label: '5. Fenómenos Naturales' },
    { id: '6', label: '6. Conectividad y Servicios' },
    { id: '7', label: '7. Personal ODPE' },
    { id: '8', label: '8. Actividades Críticas' },
    { id: '9', label: '9. Desinformación' }
  ];

  // Filtered reports sorted from newest to oldest
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchDist = filterDistrict === 'Todos' || r.distrito === filterDistrict;
      const matchRubro = filterRubro === 'Todos' || String(r.rubro_id) === filterRubro;
      const matchTipo = filterTipo === 'Todos' || 
        (filterTipo === 'con_incidencia' && r.tiene_problema) || 
        (filterTipo === 'sin_incidencia' && !r.tiene_problema);
      return matchDist && matchRubro && matchTipo;
    }).sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
  }, [reports, filterDistrict, filterRubro, filterTipo]);

  // Statistics by Rubro (for Chart 1)
  const rubroStats = useMemo(() => {
    const stats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    
    reports.forEach(r => {
      if (r.tiene_problema && stats[r.rubro_id] !== undefined) {
        stats[r.rubro_id]++;
      }
    });

    return Object.keys(stats).map(key => {
      const id = Number(key);
      return {
        id,
        name: `R${id}`,
        fullName: rubrosList.find(x => x.id === key)?.label || `Rubro ${id}`,
        cantidad: stats[id],
        fill: getCategoryColor(id)
      };
    });
  }, [reports]);

  // Statistics by District (for Chart 2)
  const districtStats = useMemo(() => {
    const stats: Record<string, number> = {};
    reports.forEach(r => {
      if (r.tiene_problema) {
        stats[r.distrito] = (stats[r.distrito] || 0) + 1;
      }
    });
    return Object.keys(stats).map(key => ({
      distrito: key,
      cantidad: stats[key]
    })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
  }, [reports]);

  // Total incidents vs clean reports
  const incidentCount = useMemo(() => reports.filter(r => r.tiene_problema).length, [reports]);
  const cleanCount = useMemo(() => reports.filter(r => !r.tiene_problema).length, [reports]);

  // Speech helper text
  const dashboardSpeechText = useMemo(() => {
    if (reports.length === 0) {
      return "El panel de control está listo. Aún no se han registrado informes de coyuntura por parte de las ODPE.";
    }
    return `Reporte del panel en tiempo real de MACE. Contamos con ${reports.length} rubros evaluados en total. De ellos, ${incidentCount} registran incidencias de coyuntura crítica y ${cleanCount} se encuentran en situación normal de control. ¡Sigamos registrando reportes para el monitoreo de elecciones!`;
  }, [reports, incidentCount, cleanCount]);

  return (
    <div id="real-time-dashboard" className="space-y-8">
      
      {/* Top Welcome Title Card */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-950 border-4 border-blue-900 border-b-red-600 rounded-3xl p-5 text-white shadow-xl space-y-4">
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <span>📊 Tablero de Control de Coyuntura ODPE</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onClearAllData && reports.length > 0 && (
              <button
                type="button"
                id="btn-clear-test-data-top"
                onClick={handleOpenClearAll}
                className="p-2 bg-rose-600/90 hover:bg-rose-600 active:scale-90 text-white rounded-xl shadow border border-rose-400/80 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title={`Eliminar todos los reportes (${reports.length})`}
                aria-label="Eliminar todos los reportes"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="shrink-0 bg-white p-1.5 rounded-xl flex items-center justify-center shadow-md border border-blue-200">
              <AudioReader text={dashboardSpeechText} />
            </div>
          </div>
        </div>

        {/* Compact Highlight Metric Widgets */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          
          {/* 1. Distritos Activos */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 sm:p-3 border border-white/20 text-center space-y-0.5">
            <span className="text-[10px] sm:text-xs font-black tracking-wider text-blue-200 uppercase block truncate">
              Distritos Activos
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-black block text-amber-300">
              {new Set(reports.map(r => r.distrito)).size}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-blue-100 hidden sm:block">
              Con reportes recibidos
            </span>
          </div>

          {/* 2. Con Incidencias */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 sm:p-3 border border-white/20 text-center space-y-0.5">
            <span className="text-[10px] sm:text-xs font-black tracking-wider text-rose-200 uppercase block truncate">
              🚨 Con Incidencias
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-black block text-rose-300">
              {incidentCount}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-rose-100 hidden sm:block">
              Requieren atención
            </span>
          </div>

          {/* 3. Sin Novedad */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-2.5 sm:p-3 border border-white/20 text-center space-y-0.5">
            <span className="text-[10px] sm:text-xs font-black tracking-wider text-emerald-200 uppercase block truncate">
              ✅ Sin Novedad
            </span>
            <span className="text-xl sm:text-2xl md:text-3xl font-black block text-emerald-300">
              {cleanCount}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-100 hidden sm:block">
              Situación normal
            </span>
          </div>

        </div>
      </div>

      {/* Charts & Graphs Grid */}
      {reports.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Category Bar Chart */}
          <div className="bg-white rounded-3xl border-4 border-blue-100 p-6 shadow-md space-y-4">
            <h3 className="text-xl font-black text-blue-950 flex items-center gap-2">
              <span>📊 Cantidad de Incidencias por Rubro MACE</span>
            </h3>
            <p className="text-sm font-bold text-blue-600">Visualiza cuáles de los 9 rubros de coyuntura tienen mayor cantidad de incidentes reportados.</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rubroStats} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#1E293B', fontWeight: 'bold' }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 font-bold text-xs space-y-1">
                            <p className="text-indigo-300 font-black">{data.fullName}</p>
                            <p>Incidencias: <span className="text-yellow-400 text-sm">{data.cantidad}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="cantidad" radius={[10, 10, 0, 0]}>
                    {rubroStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
              {rubrosList.filter(x => x.id !== 'Todos').map(rub => (
                <div key={rub.id} className="text-[10px] font-black text-slate-600 text-center flex flex-col items-center">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-extrabold text-[10px]" style={{ backgroundColor: getCategoryColor(Number(rub.id)) }}>
                    {rub.id}
                  </span>
                  <span className="truncate w-full mt-1">{rub.label.split('.')[1]?.trim()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: District Bar Chart */}
          <div className="bg-white rounded-3xl border-4 border-blue-100 p-6 shadow-md space-y-4">
            <h3 className="text-xl font-black text-blue-950 flex items-center gap-2">
              <span>📍 Zonas / Distritos con Más Incidencias</span>
            </h3>
            <p className="text-sm font-bold text-blue-600">Muestra los 10 distritos o ámbitos geográficos con mayor cantidad de alertas registradas.</p>
            {districtStats.length > 0 ? (
              <div className="h-72 w-full flex flex-col justify-between">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtStats} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="distrito" tick={{ fill: '#1E293B', fontSize: 11, fontWeight: 'bold' }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#2563EB" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] font-black text-blue-500 text-center italic">Solo se muestran zonas con al menos una incidencia activa.</p>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 font-bold bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce mb-2" />
                <p>¡No hay incidencias reportadas en ninguna zona!</p>
                <p className="text-xs font-semibold text-slate-400">Todo el panorama está limpio y en calma.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="bg-blue-50 border-4 border-blue-200 rounded-3xl p-10 text-center space-y-3 shadow-sm">
          <div className="text-6xl animate-bounce">📋</div>
          <h3 className="text-2xl font-black text-blue-950">¡No hay reportes cargados!</h3>
          <p className="text-md text-blue-700 max-w-lg mx-auto font-bold">
            No se han registrado reportes en la base de datos de Supabase todavía. Por favor presiona "Nuevo Reporte" en el menú para registrar el primero de ellos.
          </p>
        </div>
      )}

      {/* FILTER & DETAILED REPORTS SECTION */}
      <div className="bg-white rounded-3xl border-4 border-blue-100 p-6 shadow-md space-y-6">
        
        {/* Title and Filter Trigger */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
          <div>
            <h3 className="text-2xl font-black text-blue-950 flex items-center gap-2">
              <FileSpreadsheet className="w-7 h-7 text-blue-600" />
              <span>Lista de Evaluaciones de Coyuntura</span>
            </h3>
            <p className="text-sm text-blue-500 font-bold">Filtrados: {filteredReports.length} de {reports.length} evaluaciones registradas</p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            <div className="flex items-center gap-1.5 shrink-0 bg-blue-50 text-blue-950 py-1.5 px-3 rounded-xl font-black text-sm">
              <Filter className="w-4 h-4" /> Filtrar por:
            </div>

            {/* District Filter */}
            <select
              id="select-filter-district"
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="py-2.5 px-3 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-850 bg-slate-50 focus:border-blue-600 focus:outline-none"
            >
              <option value="Todos">🏡 Todas las Zonas</option>
              {availableDistricts.filter(d => d !== 'Todos').map(d => (
                <option key={d} value={d}>📍 {d}</option>
              ))}
            </select>

            {/* Rubro Filter */}
            <select
              id="select-filter-rubro"
              value={filterRubro}
              onChange={(e) => setFilterRubro(e.target.value)}
              className="py-2.5 px-3 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-850 bg-slate-50 focus:border-blue-600 focus:outline-none"
            >
              {rubrosList.map(rub => (
                <option key={rub.id} value={rub.id}>{rub.label}</option>
              ))}
            </select>

            {/* Tipo (Incidencia / Clean) Filter */}
            <select
              id="select-filter-tipo"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="py-2.5 px-3 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-850 bg-slate-50 focus:border-blue-600 focus:outline-none"
            >
              <option value="con_incidencia">🚨 Solo Con Incidencia (Por defecto)</option>
              <option value="Todos">⚖️ Todos los Estados</option>
              <option value="sin_incidencia">✅ Solo Sin Novedad (Clean)</option>
            </select>
          </div>
        </div>

        {/* Reports Detailed List */}
        {filteredReports.length > 0 ? (
          <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2">
            {filteredReports.map((r, index) => (
              <div 
                id={`report-item-${r.id || r.id_local || ''}-${index}`}
                key={`${r.id || ''}-${r.id_local || ''}-${r.rubro_id}-${index}`}
                className={`p-6 border-4 rounded-3xl hover:shadow-lg transition-all flex flex-col gap-4 ${
                  r.tiene_problema 
                    ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400' 
                    : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400'
                }`}
              >
                
                {/* Header: Reporter Meta and Rubro */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-3 border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl bg-white border-2 border-slate-100 p-2 rounded-2xl shadow-sm shrink-0">
                      {getCategoryIcon(r.rubro_id)}
                    </span>
                    <div>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                        RUBRO {r.rubro_id > 0 ? r.rubro_id : '•'} {r.categoria}
                      </span>
                      <h4 className="text-lg font-black text-slate-900 leading-tight">
                        {r.rubro_id > 0 ? r.categoria : 'Evaluación Limpia de Coyuntura'}
                      </h4>
                    </div>
                  </div>

                  {/* Status Tag and Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                    {r.tiene_problema ? (
                      <span className="px-3 py-1.5 rounded-full bg-rose-500 text-white font-black text-xs flex items-center gap-1 shadow-sm">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        CON INCIDENCIA REGISTRADA
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        SIN INCIDENCIA / NORMAL
                      </span>
                    )}

                    <button
                      type="button"
                      id={`btn-delete-report-${r.id || r.id_local || index}`}
                      onClick={() => handleOpenDeleteSingle(r)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-black text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 transition-all flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer shadow-2xs"
                      title="Eliminar este reporte (requiere clave autorizada 2026Mario)"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500 hover:text-white" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </button>
                  </div>
                </div>

                {/* Sub-form Fields / Report content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  
                  {/* Left Column: Reporter Metadata (4/12 width) */}
                  <div className="lg:col-span-4 bg-white/70 rounded-2xl p-4 border border-slate-100 space-y-3 text-sm font-bold text-slate-700">
                    <div className="text-xs font-black text-blue-950 uppercase tracking-wider border-b pb-1">
                      👤 Datos del Informante
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold">Nombres</span>
                        <span className="text-slate-900 font-extrabold">{r.nombre_informante}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold">ODPE</span>
                        <span className="text-slate-900 font-extrabold">{r.odpe}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold">Zona / Distrito a cargo</span>
                        <span className="text-blue-900 font-black">{r.distrito}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold">Fecha y Hora de Reporte</span>
                        <span className="text-slate-900 font-extrabold">
                          {new Date(r.fecha_creacion).toLocaleString('es-PE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 4 Sub-questions detail (8/12 width) */}
                  <div className="lg:col-span-8 bg-white rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-between gap-4">
                    
                    {r.tiene_problema ? (
                      <div className="space-y-3.5">
                        <div className="text-xs font-black text-rose-850 uppercase tracking-wider flex items-center gap-1 text-rose-700">
                          <Flame className="w-4 h-4" /> Respuestas a Sub-preguntas de Coyuntura
                        </div>

                        {/* 1. Ocurrencia */}
                        <div className="space-y-0.5 pl-2 border-l-4 border-blue-500">
                          <span className="text-xs text-blue-900 font-black uppercase tracking-wider block">1. ¿Qué ocurrió y dónde?</span>
                          <p className="text-slate-800 font-bold text-sm">{r.ocurrencia}</p>
                        </div>

                        {/* 2. Consecuencia */}
                        <div className="space-y-0.5 pl-2 border-l-4 border-amber-400">
                          <span className="text-xs text-amber-900 font-black uppercase tracking-wider block">2. Actividad afectada y consecuencia</span>
                          <p className="text-slate-800 font-bold text-sm">{r.consecuencia}</p>
                        </div>

                        {/* 3. Acciones ODPE */}
                        <div className="space-y-0.5 pl-2 border-l-4 border-emerald-400">
                          <span className="text-xs text-emerald-950 font-black uppercase tracking-wider block">3. Acciones adoptadas por la ODPE</span>
                          <p className="text-slate-800 font-bold text-sm">{r.acciones_odpe}</p>
                        </div>

                        {/* 4. Fuente */}
                        {r.fuente_evidencia && (() => {
                          const parts = r.fuente_evidencia.split('|||');
                          const hasAttachment = parts.length > 1;
                          const evidenceText = parts[0]?.trim() || '';
                          const fileData = hasAttachment ? parts[1]?.trim() : null;
                          const fileName = hasAttachment ? parts[2]?.trim() : null;

                          return (
                            <div className="space-y-2 pl-2 border-l-4 border-slate-400">
                              <span className="text-xs text-slate-500 font-black uppercase tracking-wider block">4. Fuente o evidencia registrada</span>
                              {evidenceText && <p className="text-slate-700 font-extrabold text-sm">{evidenceText}</p>}
                              
                              {fileData && (
                                <div className="mt-2.5 p-3 rounded-2xl border-2 border-blue-200 bg-blue-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-md shadow-xs">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    {fileData.startsWith('data:image/') ? (
                                      <button 
                                        type="button"
                                        onClick={() => setPreviewFile({ url: fileData, name: fileName || 'Foto de evidencia', isImage: true })}
                                        className="relative group block shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-blue-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="Haga clic para ver la foto en tamaño completo"
                                      >
                                        <img 
                                          src={fileData} 
                                          alt="Evidencia adjunta" 
                                          className="w-14 h-14 object-cover group-hover:scale-110 transition-transform duration-200"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                          <Eye className="w-5 h-5" />
                                        </div>
                                      </button>
                                    ) : (
                                      <div className="bg-blue-100 p-3 rounded-xl text-blue-700 shrink-0 shadow-inner">
                                        <File className="w-6 h-6" />
                                      </div>
                                    )}
                                    
                                    <div className="text-left overflow-hidden">
                                      <span className="text-[10px] text-blue-900 font-extrabold uppercase tracking-wider block">
                                        {fileData.startsWith('data:image/') ? '📷 Fotografía / Imagen' : '📄 Documento Adjunto'}
                                      </span>
                                      <span className="text-xs font-black text-slate-900 truncate block max-w-[180px]">
                                        {fileName || 'Archivo de evidencia'}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-semibold block">
                                        Toque la foto o los botones para verla
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-blue-100">
                                    {fileData.startsWith('data:image/') ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewFile({ url: fileData, name: fileName || 'Foto de evidencia', isImage: true })}
                                        className="px-2.5 py-1.5 bg-blue-800 hover:bg-blue-900 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                                        title="Ver en pantalla completa"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                        <span>Ver</span>
                                      </button>
                                    ) : null}

                                    <button
                                      type="button"
                                      onClick={() => handleOpenDirectLink(fileData, fileName)}
                                      className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-800 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                                      title="Abrir en enlace directo"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Abrir</span>
                                    </button>

                                    <a 
                                      href={fileData} 
                                      download={fileName || 'evidencia'} 
                                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                      title="Descargar archivo original"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center h-full py-6 text-slate-500 space-y-2">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-pulse" />
                        <h5 className="font-black text-emerald-900 text-lg">Situación Normal de Control</h5>
                        <p className="text-sm font-bold text-slate-600 max-w-md">
                          El coordinador reportó que no existen novedades, retrasos ni amenazas de coyuntura crítica vinculadas a este rubro de evaluación.
                        </p>
                      </div>
                    )}

                    {/* Audio read-aloud control at footer */}
                    <div className="border-t pt-3 flex items-center justify-between gap-2 mt-2">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        Escuchar reporte narrado por voz
                      </span>
                      <AudioReader 
                        text={
                          r.tiene_problema
                            ? `Informe de coyuntura del rubro ${r.categoria}. Informante: ${r.nombre_informante}. En el distrito o zona de ${r.distrito}. El detalle de lo que ocurrió indica: ${r.ocurrencia}. Consecuencia estimada: ${r.consecuencia}. Acciones tomadas por la ODPE: ${r.acciones_odpe}. Fuente: ${r.fuente_evidencia || 'No registrada'}.`
                            : `Informe de coyuntura del rubro ${r.categoria} con resultado normal. Informante: ${r.nombre_informante}. En el distrito de ${r.distrito}. Se reportó situación sin novedades ni problemas.`
                        } 
                      />
                    </div>

                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center bg-gradient-to-b from-blue-50/60 to-slate-50 border-4 border-dashed border-blue-200 rounded-3xl space-y-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-900">
                🟢 Base de Datos Limpia y Lista para Operar
              </h4>
              <p className="text-sm font-bold text-slate-600 max-w-lg mx-auto">
                No hay registros de prueba. Cada nuevo informe enviado desde el cuestionario de 9 rubros se guardará de forma inmediata en Supabase y aparecerá aquí en tiempo real.
              </p>
            </div>
          </div>
        ) : filterTipo === 'con_incidencia' && incidentCount === 0 ? (
          <div className="p-10 text-center bg-emerald-50 border-4 border-dashed border-emerald-200 rounded-3xl space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-black text-emerald-950">
              ¡Excelente! No hay incidencias críticas reportadas
            </h4>
            <p className="text-sm font-medium text-emerald-800 max-w-md mx-auto">
              Todas las evaluaciones registradas se encuentran en situación normal ("Sin Novedad").
            </p>
            <button
              type="button"
              onClick={() => setFilterTipo('Todos')}
              className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Ver las {reports.length} Evaluaciones Normales
            </button>
          </div>
        ) : (
          <div className="p-10 text-center bg-slate-50 border-4 border-dashed border-slate-200 rounded-3xl space-y-3">
            <p className="text-slate-600 font-bold text-base">
              No se encontraron reportes con los criterios de filtración seleccionados.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterDistrict('Todos');
                setFilterRubro('Todos');
                setFilterTipo('Todos');
              }}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Restablecer todos los filtros
            </button>
          </div>
        )}

      </div>

      {/* Security Password Deletion Modal ("2026Mario") */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-slate-200 relative space-y-5 animate-in fade-in zoom-in-95 duration-150 text-left">
            <button
              type="button"
              onClick={() => {
                setDeleteTarget(null);
                setDeletePassword('');
                setDeleteError('');
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                <KeyRound className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  Clave de Seguridad Requerida
                </h3>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Acción Protegida • Eliminación
                </span>
              </div>
            </div>

            <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 space-y-1.5">
              <p className="font-extrabold text-rose-950">
                {deleteTarget.type === 'single'
                  ? `¿Desea eliminar el reporte de "${deleteTarget.report.distrito}" (Rubro ${deleteTarget.report.rubro_id}: ${deleteTarget.report.categoria}) registrado por ${deleteTarget.report.nombre_informante}?`
                  : `¿Desea eliminar todos los ${reports.length} reportes registrados en la base de datos?`}
              </p>
              <p className="text-slate-600 text-xs">
                Esta acción es irreversible y requiere autorización administrativa.
              </p>
            </div>

            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                  Ingrese Clave de Autorización:
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="••••••••"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-rose-600 rounded-xl font-bold text-slate-900 text-center tracking-wider text-base focus:outline-none transition-all placeholder-slate-400"
                />
                {deleteError && (
                  <p className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center animate-bounce">
                    ⚠️ {deleteError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Verificando...' : 'Eliminar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Image / Document Lightbox Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setPreviewFile(null)}
        >
          <div 
            className="bg-slate-900 border-2 border-slate-700 text-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="text-xl">📷</span>
                <div className="overflow-hidden">
                  <h3 className="font-black text-sm sm:text-base text-white truncate">
                    {previewFile.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-bold block">
                    Visor de Evidencia en Alta Resolución
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDirectLink(previewFile.url, previewFile.name)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
                  title="Abrir imagen en pestaña nueva del navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Enlace Directo</span>
                </button>

                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
                  title="Descargar archivo original"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Descargar</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Image / Doc display */}
            <div className="flex-1 p-3 sm:p-6 overflow-auto flex items-center justify-center bg-black/40 min-h-[300px] max-h-[68vh]">
              {previewFile.isImage ? (
                <img 
                  src={previewFile.url} 
                  alt={previewFile.name}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-slate-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center p-8 space-y-4">
                  <File className="w-20 h-20 text-blue-400 mx-auto animate-bounce" />
                  <div>
                    <h4 className="font-black text-lg text-white">{previewFile.name}</h4>
                    <p className="text-sm text-slate-400 font-medium">Documento adjunto listo para abrir o descargar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenDirectLink(previewFile.url, previewFile.name)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-lg transition-all"
                  >
                    Abrir Documento Directamente
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">
                ℹ️ Si desea ver la imagen a su 100% de tamaño o imprimirla, use el botón "Enlace Directo".
              </span>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {deleteSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-400 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="font-extrabold text-sm">{deleteSuccessToast}</span>
        </div>
      )}

    </div>
  );
}
