import { useState, useMemo } from 'react';
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
  File
} from 'lucide-react';
import { IncidentReport } from '../types';
import AudioReader from './AudioReader';

interface RealTimeDashboardProps {
  reports: IncidentReport[];
}

export default function RealTimeDashboard({ reports }: RealTimeDashboardProps) {
  const [filterDistrict, setFilterDistrict] = useState<string>('Todos');
  const [filterRubro, setFilterRubro] = useState<string>('Todos');
  const [filterTipo, setFilterTipo] = useState<string>('Todos'); // Todos, Con Incidencia, Sin Incidencia

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
      <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-950 border-4 border-blue-900 border-b-red-600 rounded-3xl p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-950 font-black text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              SISTEMA MACE EN TIEMPO REAL • CONECTADO A SUPABASE
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              📊 Tablero de Control de Coyuntura ODPE
            </h2>
            <p className="text-lg text-blue-100 font-bold max-w-2xl leading-relaxed">
              Monitoreo permanente de los 9 rubros críticos de seguridad, acceso, desinformación y actividades electorales para toma de decisiones rápidas.
            </p>
          </div>

          <div className="shrink-0 bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg border-2 border-blue-200">
            <AudioReader text={dashboardSpeechText} />
          </div>
        </div>

        {/* 4 Large Highlight Metric Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 text-center space-y-1">
            <span className="text-sm font-black tracking-widest text-blue-100 uppercase block">Total Evaluaciones</span>
            <span className="text-4xl font-black block text-yellow-300">{reports.length}</span>
            <span className="text-xs font-bold text-blue-100 block">Registros totales en base de datos</span>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 text-center space-y-1">
            <span className="text-sm font-black tracking-widest text-blue-100 uppercase block">🚨 Con Incidencias</span>
            <span className="text-4xl font-black block text-rose-300">{incidentCount}</span>
            <span className="text-xs font-bold text-blue-100 block">Problemas que requieren atención</span>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 text-center space-y-1">
            <span className="text-sm font-black tracking-widest text-blue-100 uppercase block">✅ Sin Novedad</span>
            <span className="text-4xl font-black block text-emerald-300">{cleanCount}</span>
            <span className="text-xs font-bold text-blue-100 block">Situaciones normales reportadas</span>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 text-center space-y-1">
            <span className="text-sm font-black tracking-widest text-blue-100 uppercase block">ODPE Activas</span>
            <span className="text-4xl font-black block text-amber-300">
              {new Set(reports.map(r => r.odpe)).size}
            </span>
            <span className="text-xs font-bold text-blue-100 block">Oficinas que han reportado</span>
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
              <option value="Todos">⚖️ Todos los Estados</option>
              <option value="con_incidencia">🚨 Solo Con Incidencia</option>
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

                  {/* Status Tag */}
                  <div>
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
                                <div className="mt-2.5 p-3 rounded-2xl border-2 border-blue-100 bg-blue-50/20 flex items-center justify-between gap-3 max-w-sm shadow-sm">
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    {fileData.startsWith('data:image/') ? (
                                      <a href={fileData} target="_blank" rel="noopener noreferrer" className="block shrink-0">
                                        <img 
                                          src={fileData} 
                                          alt="Evidencia adjunta" 
                                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 cursor-zoom-in hover:opacity-90 shadow-sm"
                                          referrerPolicy="no-referrer"
                                        />
                                      </a>
                                    ) : (
                                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
                                        <File className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div className="text-left overflow-hidden">
                                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Archivo Adjunto</span>
                                      <a 
                                        href={fileData} 
                                        download={fileName || 'evidencia'} 
                                        className="text-xs font-black text-blue-800 hover:underline truncate block max-w-[180px]"
                                      >
                                        {fileName || 'Descargar archivo'}
                                      </a>
                                    </div>
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
        ) : (
          <div className="p-10 text-center bg-slate-50 border-4 border-dashed border-slate-200 rounded-3xl text-slate-400 font-black text-lg">
            No se encontraron reportes con los criterios de filtración seleccionados. ¡Intente cambiando los filtros de arriba!
          </div>
        )}

      </div>

    </div>
  );
}
