import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  AlertTriangle, 
  Sparkles,
  User,
  Building,
  Calendar,
  MapPin,
  HelpCircle,
  Upload,
  X,
  File,
  Image as ImageIcon
} from 'lucide-react';
import { Question, IncidentReport } from '../types';
import AudioReader from './AudioReader';

// The 9 rubros from the MACE Coyuntura Report
export const QUESTIONS: Question[] = [
  {
    id: 1,
    titulo: "ACTUACIONES DE ACTORES ELECTORALES E INSTITUCIONALES",
    desc: "Actuaciones, denuncias, confrontaciones, amenazas, presiones o controversias vinculadas con candidatos, organizaciones políticas, personeros, autoridades, funcionarios u organismos electorales.",
    icon: "👥"
  },
  {
    id: 2,
    titulo: "CONTEXTO SOCIOPOLÍTICO Y CONFLICTIVIDAD SOCIAL",
    desc: "Conflictos sociales, protestas, paros, movilizaciones, reclamos colectivos, disputas territoriales o bloqueos que podrían afectar el proceso electoral.",
    icon: "📣"
  },
  {
    id: 3,
    titulo: "VIOLENCIA, SEGURIDAD Y ORDEN PÚBLICO",
    desc: "Amenazas, agresiones, delincuencia, disturbios u otras situaciones que comprometan a personal, electores, locales o material electoral.",
    icon: "🚨"
  },
  {
    id: 4,
    titulo: "VÍAS, ACCESIBILIDAD Y TRANSPORTE",
    desc: "Bloqueos, interrupciones, problemas de navegabilidad o transporte que puedan dificultar actividades electorales.",
    icon: "🚧"
  },
  {
    id: 5,
    titulo: "FENÓMENOS NATURALES E INFRAESTRUCTURA",
    desc: "Lluvias, huaicos, inundaciones, sismos u otros eventos que puedan afectar locales, vías o instalaciones.",
    icon: "⛈️"
  },
  {
    id: 6,
    titulo: "CONECTIVIDAD, COMUNICACIONES Y SERVICIOS ESENCIALES",
    desc: "Problemas de internet, telefonía, energía u otros servicios necesarios para las actividades electorales.",
    icon: "📶"
  },
  {
    id: 7,
    titulo: "PERSONAL Y CAPACIDAD OPERATIVA DE LA ODPE",
    desc: "Plazas sin cubrir, demoras de contratación, renuncias, ausencias o limitaciones que puedan afectar actividades o plazos.",
    icon: "👔"
  },
  {
    id: 8,
    titulo: "CUMPLIMIENTO DE ACTIVIDADES CRÍTICAS DEL PROCESO",
    desc: "Retrasos o dificultades en actividades programadas, indicando avance, plazo y consecuencia posible.",
    icon: "📅"
  },
  {
    id: 9,
    titulo: "INFORMACIÓN Y POSIBLE DESINFORMACIÓN ELECTORAL",
    desc: "Información presuntamente falsa, engañosa o descontextualizada que pueda afectar la confianza o generar conflictividad.",
    icon: "📰"
  }
];

// Premium high-contrast ONPE corporate color themes (Blue, White, Red) to keep older users engaged and awake
export function getCategoryTheme(id: number) {
  return {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    accent: 'bg-blue-800',
    hover: 'hover:bg-blue-900',
    text: 'text-blue-950',
    primaryText: 'text-blue-800'
  };
}

interface DistrictWizardProps {
  onReportSubmit: (reports: IncidentReport[]) => void;
  onViewReportsClick: () => void;
}

export default function DistrictWizard({ onReportSubmit, onViewReportsClick }: DistrictWizardProps) {
  // Navigation states
  const [step, setStep] = useState<number>(1); // 1: Datos del Informante, 2: Questions, 3: Success
  
  // Informant inputs (saved in state)
  const [nombreCompleto, setNombreCompleto] = useState<string>('');
  const [odpe, setOdpe] = useState<string>('');
  const [distritoZona, setDistritoZona] = useState<string>('');
  const [fechaReporte, setFechaReporte] = useState<string>('');

  useEffect(() => {
    // Set default current time
    setFechaReporte(new Date().toISOString().slice(0, 16));
  }, []);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  
  // Active question answers
  const [hasProblem, setHasProblem] = useState<boolean | null>(null);
  const [ocurrencia, setOcurrencia] = useState<string>('');
  const [consecuencia, setConsecuencia] = useState<string>('');
  const [accionesOdpe, setAccionesOdpe] = useState<string>('');
  const [fuenteEvidencia, setFuenteEvidencia] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; data: string; type: string } | null>(null);

  // Accumulator of affirmative incident reports in this session
  const [savedReportsInSession, setSavedReportsInSession] = useState<IncidentReport[]>([]);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const theme = getCategoryTheme(currentQuestion?.id || 1);

  const handleStartReporting = (e: FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto || !odpe || !distritoZona) {
      alert('Por favor complete todos los datos requeridos marcados con asterisco (*)');
      return;
    }
    setStep(2);
    setCurrentQuestionIndex(0);
    setSavedReportsInSession([]);
    resetQuestionState();
  };

  const resetQuestionState = () => {
    setHasProblem(null);
    setOcurrencia('');
    setConsecuencia('');
    setAccionesOdpe('');
    setFuenteEvidencia('');
    setSelectedFile(null);
  };

  const handleAnswerProblem = (answer: boolean) => {
    setHasProblem(answer);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      
      // If it is an image, compress/downscale it with Canvas
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; // Optimal size for high readability and small footprint
          const scale = MAX_WIDTH / img.width;
          
          if (img.width > MAX_WIDTH) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Compressed format (0.7 quality)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setSelectedFile({
            name: file.name,
            data: compressedDataUrl,
            type: 'image/jpeg'
          });
        };
        img.src = result;
      } else {
        // Normal file
        setSelectedFile({
          name: file.name,
          data: result,
          type: file.type
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (hasProblem === null) return;

    // If answer is SÍ, ensure required details are filled
    if (hasProblem) {
      if (!ocurrencia.trim() || !consecuencia.trim() || !accionesOdpe.trim()) {
        alert('Por favor complete todos los detalles obligatorios (*) del problema antes de continuar.');
        return;
      }

      const encodedEvidence = selectedFile 
        ? `${fuenteEvidencia || 'Archivo adjunto cargado'} ||| ${selectedFile.data} ||| ${selectedFile.name}` 
        : fuenteEvidencia;

      const activeReport: IncidentReport = {
        nombre_informante: nombreCompleto,
        odpe: odpe,
        distrito: distritoZona,
        rubro_id: currentQuestion.id,
        categoria: currentQuestion.titulo,
        pregunta_texto: currentQuestion.desc,
        tiene_problema: true,
        ocurrencia: ocurrencia,
        consecuencia: consecuencia,
        acciones_odpe: accionesOdpe,
        fuente_evidencia: encodedEvidence,
        fecha_creacion: new Date(fechaReporte).toISOString()
      };

      // Add to session list
      setSavedReportsInSession(prev => [...prev, activeReport]);
    }

    // Go to next rubro or save all
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuestionState();
    } else {
      // Finished all 9 rubros! Save all accumulated affirmative reports
      const encodedEvidence = selectedFile 
        ? `${fuenteEvidencia || 'Archivo adjunto cargado'} ||| ${selectedFile.data} ||| ${selectedFile.name}` 
        : fuenteEvidencia;

      const finalReports = hasProblem 
        ? [...savedReportsInSession, {
            nombre_informante: nombreCompleto,
            odpe: odpe,
            distrito: distritoZona,
            rubro_id: currentQuestion.id,
            categoria: currentQuestion.titulo,
            pregunta_texto: currentQuestion.desc,
            tiene_problema: true,
            ocurrencia: ocurrencia,
            consecuencia: consecuencia,
            acciones_odpe: accionesOdpe,
            fuente_evidencia: encodedEvidence,
            fecha_creacion: new Date(fechaReporte).toISOString()
          }]
        : savedReportsInSession;

      // Submit all reports as an array batch to prevent stale state issues
      if (finalReports.length > 0) {
        onReportSubmit(finalReports);
      } else {
        // If there were no issues in any of the 9 rubros, we can submit a clean placeholder report as an array
        onReportSubmit([{
          nombre_informante: nombreCompleto,
          odpe: odpe,
          distrito: distritoZona,
          rubro_id: 0,
          categoria: 'Sin Ocurrencias',
          pregunta_texto: 'Situación normal en todos los 9 rubros.',
          tiene_problema: false,
          ocurrencia: 'Sin novedad',
          consecuencia: 'Ninguna',
          acciones_odpe: 'Monitoreo constante',
          fuente_evidencia: 'Reporte del Coordinador',
          fecha_creacion: new Date(fechaReporte).toISOString()
        }]);
      }

      setStep(3);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      // Remove last saved report from session list if going back
      setSavedReportsInSession(prev => prev.slice(0, -1));
      resetQuestionState();
    } else {
      // Go back to informant info
      setStep(1);
    }
  };

  const handleRestart = () => {
    setStep(1);
    setCurrentQuestionIndex(0);
    setSavedReportsInSession([]);
    resetQuestionState();
  };

  return (
    <div id="district-wizard" className="w-full max-w-4xl mx-auto">
      
      {/* STEP 1: DATOS DEL INFORMANTE */}
      {step === 1 && (
        <form onSubmit={handleStartReporting} id="wizard-step-1" className="space-y-6">
          <div className="bg-gradient-to-r from-blue-800 to-blue-950 border-4 border-blue-900 border-b-red-600 rounded-3xl p-6 text-center shadow-lg space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center justify-center gap-2">
              <span>INFORME SEMANAL DE COYUNTURA – ODPE / MACE</span>
            </h2>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl border-4 border-blue-200 p-5 sm:p-8 shadow-xl space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              
              <div className="space-y-2">
                <label className="block text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
                  <User className="w-5.5 h-5.5 text-blue-700" />
                  Nombres y Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-nombre-completo"
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Juan Pérez López"
                  className="w-full px-4 py-3.5 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 sm:border-4 border-slate-200 focus:border-blue-600 focus:outline-none font-bold text-slate-800 bg-slate-50 transition-colors placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
                  <Building className="w-5.5 h-5.5 text-blue-700" />
                  ODPE <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-odpe"
                  type="text"
                  required
                  value={odpe}
                  onChange={(e) => setOdpe(e.target.value)}
                  placeholder="Ej. ODPE ICA"
                  className="w-full px-4 py-3.5 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 sm:border-4 border-slate-200 focus:border-blue-600 focus:outline-none font-bold text-slate-800 bg-slate-50 transition-colors placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-lg sm:text-xl font-black text-slate-950 flex items-center gap-2">
                  <MapPin className="w-5.5 h-5.5 text-blue-700" />
                  Distrito / Zona a cargo <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-distrito-zona"
                  type="text"
                  required
                  value={distritoZona}
                  onChange={(e) => setDistritoZona(e.target.value)}
                  placeholder="Ej. Ica 2, Tinguiña 2"
                  className="w-full px-4 py-3.5 text-base sm:text-lg rounded-xl sm:rounded-2xl border-2 sm:border-4 border-slate-200 focus:border-blue-600 focus:outline-none font-bold text-slate-800 bg-slate-50 transition-colors placeholder:text-slate-400"
                />
              </div>

              </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-end border-t-2 border-slate-100">
              <button
                id="btn-start-evaluation"
                type="submit"
                className="w-full sm:w-auto py-3.5 sm:py-4 px-6 sm:px-8 bg-blue-800 hover:bg-blue-900 text-white font-black text-base sm:text-xl rounded-xl sm:rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Siguiente: Evaluar Rubros</span>
                <ChevronRight className="w-5.5 h-5.5" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: QUESTIONS WIZARD */}
      {step === 2 && currentQuestion && (
        <div id="wizard-step-2" className="space-y-6">
          
          {/* Top Progress bar and informant metadata preview */}
          <div className="bg-white rounded-3xl p-5 border-4 border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="text-4xl">📋</div>
              <div>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">Informante actual</span>
                <span className="text-xl font-black text-slate-900 leading-tight block">{nombreCompleto} ({odpe})</span>
                <span className="text-xs font-bold text-blue-700 block">Zona: {distritoZona}</span>
              </div>
            </div>

            {/* Step circles */}
            <div className="flex flex-wrap items-center gap-2">
              {QUESTIONS.map((q, idx) => (
                <div
                  id={`progress-dot-rubro-${q.id}`}
                  key={q.id}
                  className={`w-9 h-9 rounded-full font-black text-md flex items-center justify-center transition-all ${
                    idx === currentQuestionIndex
                      ? `${theme.accent} text-white scale-110 shadow-md ring-4 ring-offset-2 ring-blue-300`
                      : idx < currentQuestionIndex
                      ? 'bg-blue-800 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                  title={q.titulo}
                >
                  {idx < currentQuestionIndex ? '✓' : q.id}
                </div>
              ))}
            </div>
          </div>

          {/* Active Question Box */}
          <div className={`border-4 ${theme.border} rounded-3xl p-6 ${theme.bg} shadow-lg space-y-6 transition-all duration-300`}>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left justify-between">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <span className="text-6xl bg-white p-4 rounded-2xl border-4 border-white shadow-sm shrink-0">
                  {currentQuestion.icon}
                </span>
                <div>
                  <span className={`text-sm font-extrabold ${theme.primaryText} uppercase tracking-widest block`}>
                    RUBRO {currentQuestion.id} de 9 • {currentQuestion.titulo}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mt-1">
                    {currentQuestion.titulo}
                  </h3>
                  <p className="text-sm font-bold text-slate-700 italic mt-1.5 max-w-2xl leading-relaxed">
                    {currentQuestion.desc}
                  </p>
                </div>
              </div>

              {/* Audio Reader */}
              <div className="shrink-0">
                <AudioReader text={`Rubro número ${currentQuestion.id}. ${currentQuestion.titulo}. ${currentQuestion.desc}. ¿Se ha registrado alguna situación vinculada a este rubro? Marca SÍ si se presentó algún problema, o marca NO si todo está normal.`} />
              </div>
            </div>

            {/* BIG SÍ / NO BUTTONS FOR ELDERLY */}
            <div className="space-y-2">
              <div className="text-slate-800 font-extrabold text-lg text-center sm:text-left">
                ¿Se ha registrado alguna situación vinculada a este rubro? *
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* SÍ BUTTON */}
                <button
                  id="btn-answer-si"
                  type="button"
                  onClick={() => handleAnswerProblem(true)}
                  className={`p-6 rounded-3xl border-4 transition-all duration-200 flex items-center justify-center gap-4 text-2xl font-black text-white shadow-md active:scale-95 ${
                    hasProblem === true
                      ? 'bg-red-600 border-red-700 ring-4 ring-offset-2 ring-red-300 scale-[1.02]'
                      : 'bg-red-500 border-red-600 hover:bg-red-600'
                  }`}
                >
                  <span className="text-4xl bg-white text-red-600 rounded-full p-1.5 flex items-center justify-center w-12 h-12">
                    ✓
                  </span>
                  <span>SÍ se registró</span>
                </button>

                {/* NO BUTTON */}
                <button
                  id="btn-answer-no"
                  type="button"
                  onClick={() => handleAnswerProblem(false)}
                  className={`p-6 rounded-3xl border-4 transition-all duration-200 flex items-center justify-center gap-4 text-2xl font-black text-white shadow-md active:scale-95 ${
                    hasProblem === false
                      ? 'bg-blue-850 border-blue-950 ring-4 ring-offset-2 ring-blue-300 scale-[1.02]'
                      : 'bg-blue-700 border-blue-800 hover:bg-blue-800'
                  }`}
                >
                  <span className="text-4xl bg-white text-blue-700 rounded-full p-1.5 flex items-center justify-center w-12 h-12">
                    ✕
                  </span>
                  <span>NO se registró</span>
                </button>
              </div>
            </div>

            {/* SUB-QUESTIONS DROPDOWN/COLLAPSIBLE IF "SÍ" CLICKED */}
            {hasProblem === true && (
              <div id="subquestions-dropdown" className="bg-white border-4 border-blue-200 rounded-2xl p-6 space-y-5 animate-slideDown">
                <div className="border-b-2 border-blue-100 pb-2">
                  <h4 className="text-xl font-black text-blue-950 flex items-center gap-2">
                    <span>✍️ Detalle de la Incidencia</span>
                  </h4>
                  <p className="text-sm text-blue-500 font-bold">Por favor responda las siguientes 4 sub-preguntas con calma:</p>
                </div>

                {/* Sub-question 1: ¿Qué ocurrió y dónde? */}
                <div className="space-y-1">
                  <label className="block text-slate-800 font-black text-lg">
                    1. ¿Qué ocurrió y dónde? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                     id="textarea-ocurrencia"
                     rows={2}
                     value={ocurrencia}
                     onChange={(e) => setOcurrencia(e.target.value)}
                     placeholder="Escriba los hechos ocurridos y la ubicación exacta (Ej. Avenida principal cruce con Jirón Lima)..."
                     className="w-full p-4 border-2 border-slate-300 rounded-xl font-bold text-slate-800 focus:border-blue-600 focus:outline-none placeholder-slate-400 bg-slate-50 text-base"
                     required
                  />
                </div>

                {/* Sub-question 2: ¿Qué actividad electoral podría afectarse? */}
                <div className="space-y-1">
                  <label className="block text-slate-800 font-black text-lg">
                    2. ¿Qué actividad electoral podría afectarse y cuál sería la consecuencia? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="textarea-consecuencia"
                    rows={2}
                    value={consecuencia}
                    onChange={(e) => setConsecuencia(e.target.value)}
                    placeholder="Describa la actividad en riesgo y el impacto previsto (Ej. Retraso del camión de material, ausentismo de miembros de mesa)..."
                    className="w-full p-4 border-2 border-slate-300 rounded-xl font-bold text-slate-800 focus:border-blue-600 focus:outline-none placeholder-slate-400 bg-slate-50 text-base"
                    required
                  />
                </div>

                {/* Sub-question 3: Acciones adoptadas por la ODPE */}
                <div className="space-y-1">
                  <label className="block text-slate-800 font-black text-lg">
                    3. Acciones adoptadas por la ODPE <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="textarea-acciones-odpe"
                    rows={2}
                    value={accionesOdpe}
                    onChange={(e) => setAccionesOdpe(e.target.value)}
                    placeholder="Medidas tomadas o coordinaciones realizadas de inmediato..."
                    className="w-full p-4 border-2 border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400 bg-slate-50 text-base"
                    required
                  />
                </div>

                {/* Sub-question 4: Fuente o evidencia */}
                <div className="space-y-3">
                  <label className="block text-slate-800 font-black text-lg">
                    4. Fuente o evidencia (Opcional)
                  </label>
                  
                  {/* Text input for description */}
                  <input
                    id="input-fuente-evidencia"
                    type="text"
                    value={fuenteEvidencia}
                    onChange={(e) => setFuenteEvidencia(e.target.value)}
                    placeholder="Ej. Detalle del informante, enlace web, llamada telefónica..."
                    className="w-full p-4 border-2 border-slate-300 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400 bg-slate-50 text-base"
                  />

                  {/* File and Image Upload block (for PC & Cell phones) */}
                  <div className="border-4 border-dashed border-blue-200 rounded-2xl p-4 bg-blue-50/50 flex flex-col items-center justify-center transition-all hover:bg-blue-50">
                    {selectedFile ? (
                      <div className="w-full space-y-3">
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border-2 border-blue-100 shadow-sm">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {selectedFile.type.startsWith('image/') ? (
                              <img 
                                src={selectedFile.data} 
                                alt="Vista previa" 
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
                                <File className="w-6 h-6" />
                              </div>
                            )}
                            <div className="text-left overflow-hidden">
                              <p className="text-sm font-extrabold text-slate-900 truncate max-w-[180px] sm:max-w-xs">{selectedFile.name}</p>
                              <p className="text-xs text-slate-400 font-semibold uppercase">Archivo cargado exitosamente</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="p-1.5 bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all active:scale-95"
                            title="Quitar archivo"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="w-full flex flex-col items-center justify-center cursor-pointer py-4 space-y-2">
                        <div className="p-3 bg-blue-100 text-blue-800 rounded-full animate-bounce">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <span className="text-blue-950 font-black text-sm block">Subir Foto o Documento</span>
                          <span className="text-blue-500 font-bold text-xs">Soporta cámara de celular o archivos del PC</span>
                        </div>
                        <input
                           type="file"
                           accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                           onChange={handleFileChange}
                           className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              id="btn-wizard-back"
              onClick={handleBack}
              className="py-4 px-6 bg-white border-4 border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all rounded-2xl font-black text-lg flex items-center gap-2 shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" /> Atrás
            </button>

            {/* Next button ONLY enabled if question is answered (either SÍ or NO) */}
            <button
              id="btn-wizard-next"
              disabled={hasProblem === null}
              onClick={handleNext}
              className={`py-4 px-8 rounded-2xl font-black text-xl flex items-center gap-2 shadow-lg transition-all transform active:scale-95 ${
                hasProblem !== null
                  ? 'bg-blue-800 text-white cursor-pointer hover:bg-blue-900 ring-4 ring-blue-200'
                  : 'bg-slate-200 text-slate-400 border-2 border-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              {currentQuestionIndex === QUESTIONS.length - 1 ? 'Terminar Reporte' : 'Siguiente Rubro'}
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SUCCESS STATE */}
      {step === 3 && (
        <div id="wizard-step-3" className="bg-blue-50 border-4 border-blue-300 rounded-3xl p-8 text-center space-y-6 shadow-xl animate-fadeIn">
          <div className="inline-flex items-center justify-center bg-blue-100 border-4 border-blue-300 rounded-full w-24 h-24 text-blue-800 animate-bounce">
            <Check className="w-14 h-14 stroke-[4px]" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-blue-950 flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-red-500 animate-pulse" />
              <span>¡Muchas Gracias, Coordinador!</span>
              <Sparkles className="w-8 h-8 text-red-500 animate-pulse" />
            </h2>
            <p className="text-xl text-blue-900 font-bold max-w-xl mx-auto">
              El informe de coyuntura de la <span className="text-blue-950 font-black">{odpe}</span> para <span className="text-blue-950 font-black underline">{distritoZona}</span> ha sido guardado exitosamente y transmitido en tiempo real.
            </p>
            <div className="flex justify-center pt-2">
              <AudioReader text={`¡Muchas gracias, coordinador! Tu informe de coyuntura ha sido guardado exitosamente y transmitido en tiempo real en la base de datos de Supabase. ¡Has hecho un gran trabajo de recopilación!`} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
