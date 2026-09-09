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

interface QuestionData {
  hasProblem: boolean;
  ocurrencia: string;
  consecuencia: string;
  accionesOdpe: string;
  fuenteEvidencia: string;
  selectedFile: { name: string; data: string; type: string } | null;
}

export interface SubmitResult {
  success: boolean;
  isOnline: boolean;
  count: number;
  error?: string;
}

interface DistrictWizardProps {
  onReportSubmit: (reports: IncidentReport[]) => Promise<SubmitResult>;
  onViewReportsClick: () => void;
  isSupabaseActive?: boolean;
  totalReportsCount?: number;
}

export default function DistrictWizard({ 
  onReportSubmit, 
  onViewReportsClick, 
  isSupabaseActive = false,
  totalReportsCount = 0 
}: DistrictWizardProps) {
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
  
  // All 9 answers dictionary (key is rubro_id 1 to 9)
  const [answers, setAnswers] = useState<Record<number, QuestionData>>({});

  // Active question form inputs
  const [hasProblem, setHasProblem] = useState<boolean | null>(null);
  const [ocurrencia, setOcurrencia] = useState<string>('');
  const [consecuencia, setConsecuencia] = useState<string>('');
  const [accionesOdpe, setAccionesOdpe] = useState<string>('');
  const [fuenteEvidencia, setFuenteEvidencia] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; data: string; type: string } | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const theme = getCategoryTheme(currentQuestion?.id || 1);

  // Load question data into local form inputs
  const loadQuestionData = (questionId: number, currentAnswersDict: Record<number, QuestionData>) => {
    const saved = currentAnswersDict[questionId];
    if (saved) {
      setHasProblem(saved.hasProblem);
      setOcurrencia(saved.ocurrencia || '');
      setConsecuencia(saved.consecuencia || '');
      setAccionesOdpe(saved.accionesOdpe || '');
      setFuenteEvidencia(saved.fuenteEvidencia || '');
      setSelectedFile(saved.selectedFile || null);
    } else {
      setHasProblem(null);
      setOcurrencia('');
      setConsecuencia('');
      setAccionesOdpe('');
      setFuenteEvidencia('');
      setSelectedFile(null);
    }
  };

  const handleStartReporting = (e: FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim() || !odpe.trim() || !distritoZona.trim()) {
      alert('Por favor complete todos los datos requeridos marcados con asterisco (*)');
      return;
    }
    setStep(2);
    setCurrentQuestionIndex(0);
    setAnswers({});
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
      
      // If it is an image, compress/downscale it with Canvas preserving clarity and aspect ratio
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1024;
          let targetWidth = img.width;
          let targetHeight = img.height;

          if (img.width > MAX_DIM || img.height > MAX_DIM) {
            if (img.width > img.height) {
              targetWidth = MAX_DIM;
              targetHeight = Math.round((img.height * MAX_DIM) / img.width);
            } else {
              targetHeight = MAX_DIM;
              targetWidth = Math.round((img.width * MAX_DIM) / img.height);
            }
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          }
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
          setSelectedFile({
            name: file.name,
            data: compressedDataUrl,
            type: 'image/jpeg'
          });
        };
        img.src = result;
      } else {
        setSelectedFile({
          name: file.name,
          data: result,
          type: file.type
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnswerNoAndAdvance = async () => {
    setHasProblem(false);
    
    const currentData: QuestionData = {
      hasProblem: false,
      ocurrencia: 'Sin novedad / Situación normal',
      consecuencia: 'Sin afectación reportada',
      accionesOdpe: 'Monitoreo preventivo de la ODPE',
      fuenteEvidencia: 'Reporte de informante',
      selectedFile: null,
    };

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: currentData
    };
    setAnswers(updatedAnswers);

    // If not last question, go directly to next question
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      loadQuestionData(QUESTIONS[nextIndex].id, updatedAnswers);
    } else {
      // Last question finished! Submit all 9
      await submitAllNineQuestions(updatedAnswers);
    }
  };

  const handleAnswerSi = () => {
    setHasProblem(true);
  };

  const handleCancelSi = () => {
    setHasProblem(null);
  };

  const handleNext = async () => {
    if (hasProblem === null) return;

    // If answer is SÍ, ensure required details are filled
    if (hasProblem) {
      if (!ocurrencia.trim() || !consecuencia.trim() || !accionesOdpe.trim()) {
        alert('Por favor complete todos los campos obligatorios (*) antes de continuar.');
        return;
      }
    }

    const currentData: QuestionData = {
      hasProblem: hasProblem,
      ocurrencia: hasProblem ? ocurrencia.trim() : 'Sin novedad / Situación normal',
      consecuencia: hasProblem ? consecuencia.trim() : 'Sin afectación reportada',
      accionesOdpe: hasProblem ? accionesOdpe.trim() : 'Monitoreo preventivo de la ODPE',
      fuenteEvidencia: hasProblem ? fuenteEvidencia.trim() : 'Reporte de informante',
      selectedFile: hasProblem ? selectedFile : null,
    };

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: currentData
    };
    setAnswers(updatedAnswers);

    // Go to next rubro or save all
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      loadQuestionData(QUESTIONS[nextIndex].id, updatedAnswers);
    } else {
      // Finished all 9 rubros! Compile and submit all 9
      await submitAllNineQuestions(updatedAnswers);
    }
  };

  const submitAllNineQuestions = async (answersDict: Record<number, QuestionData>) => {
    // Current timestamp guaranteed to be valid ISO string
    const nowIso = new Date().toISOString();

    // Build array of all 9 questions
    const allNineReports: IncidentReport[] = QUESTIONS.map((q) => {
      const ans = answersDict[q.id];
      if (ans && ans.hasProblem) {
        const encodedEvidence = ans.selectedFile 
          ? `${ans.fuenteEvidencia || 'Archivo adjunto'} ||| ${ans.selectedFile.data} ||| ${ans.selectedFile.name}` 
          : ans.fuenteEvidencia;

        return {
          nombre_informante: nombreCompleto.trim() || 'Coordinador ODPE',
          odpe: odpe.trim() || 'ODPE',
          distrito: distritoZona.trim() || 'Distrito',
          rubro_id: q.id,
          categoria: q.titulo,
          pregunta_texto: q.desc,
          tiene_problema: true,
          ocurrencia: ans.ocurrencia || 'Incidencia reportada',
          consecuencia: ans.consecuencia || 'En evaluación',
          acciones_odpe: ans.accionesOdpe || 'Acción en curso',
          fuente_evidencia: encodedEvidence || 'Reporte de Informante',
          fecha_creacion: nowIso
        };
      } else {
        return {
          nombre_informante: nombreCompleto.trim() || 'Coordinador ODPE',
          odpe: odpe.trim() || 'ODPE',
          distrito: distritoZona.trim() || 'Distrito',
          rubro_id: q.id,
          categoria: q.titulo,
          pregunta_texto: q.desc,
          tiene_problema: false,
          ocurrencia: 'Sin novedad / Situación normal',
          consecuencia: 'Sin afectación reportada',
          acciones_odpe: 'Monitoreo preventivo de la ODPE',
          fuente_evidencia: 'Reporte del Informante',
          fecha_creacion: nowIso
        };
      }
    });

    console.log('[DistrictWizard] Enviando 9 reportes a guardar:', allNineReports);
    
    // INSTANT FLUID TRANSITION: Switch to Step 3 immediately with zero lag
    setStep(3);
    setSubmitResult({
      success: true,
      isOnline: isSupabaseActive,
      count: allNineReports.length
    });

    // Fire saving asynchronously in background
    setIsSubmitting(true);
    try {
      const result = await onReportSubmit(allNineReports);
      console.log('[DistrictWizard] Resultado de guardado:', result);
      setSubmitResult(result);
    } catch (err: any) {
      console.error('Error al enviar reporte en segundo plano:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    // If we have an active answer, save it before going back
    if (hasProblem !== null) {
      const currentData: QuestionData = {
        hasProblem: hasProblem,
        ocurrencia: hasProblem ? ocurrencia.trim() : 'Sin novedad / Situación normal',
        consecuencia: hasProblem ? consecuencia.trim() : 'Sin afectación reportada',
        accionesOdpe: hasProblem ? accionesOdpe.trim() : 'Monitoreo preventivo de la ODPE',
        fuenteEvidencia: hasProblem ? fuenteEvidencia.trim() : 'Reporte de informante',
        selectedFile: hasProblem ? selectedFile : null,
      };
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: currentData }));
    }

    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      loadQuestionData(QUESTIONS[prevIndex].id, answers);
    } else {
      // Go back to informant info
      setStep(1);
    }
  };

  const handleRestart = () => {
    setStep(1);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSubmitResult(null);
    setHasProblem(null);
    setOcurrencia('');
    setConsecuencia('');
    setAccionesOdpe('');
    setFuenteEvidencia('');
    setSelectedFile(null);
  };

  return (
    <div id="district-wizard" className="w-full max-w-3xl mx-auto">
      
      {/* STEP 1: DATOS DEL INFORMANTE */}
      {step === 1 && (
        <form onSubmit={handleStartReporting} id="wizard-step-1" className="space-y-3 sm:space-y-4">
          <div className="bg-gradient-to-r from-blue-800 to-blue-950 border-2 border-blue-900 border-b-red-600 rounded-2xl p-3 sm:p-4 text-center shadow-md">
            <h2 className="text-base sm:text-xl font-black text-white flex items-center justify-center gap-2">
              <span>INFORME SEMANAL DE COYUNTURA – ODPE / MACE</span>
            </h2>
          </div>

          <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 sm:p-6 shadow-md space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              
              <div className="space-y-1.5">
                <label className="block text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-700" />
                  Nombres y Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-nombre-completo"
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Juan Pérez López"
                  className="w-full px-3 py-2 text-sm sm:text-base rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none font-bold text-slate-800 bg-slate-50 transition-colors placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-700" />
                  ODPE <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-odpe"
                  type="text"
                  required
                  value={odpe}
                  onChange={(e) => setOdpe(e.target.value)}
                  placeholder="Ej. ODPE ICA"
                  className="w-full px-3 py-2 text-sm sm:text-base rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none font-bold text-slate-800 bg-slate-50 transition-colors placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm sm:text-base font-black text-slate-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-700" />
                  Distrito / Zona <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-distrito-zona"
                  type="text"
                  required
                  value={distritoZona}
                  onChange={(e) => setDistritoZona(e.target.value)}
                  placeholder="Ej. Tinguiña 2"
                  className="w-full px-3 py-2 text-sm sm:text-base rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none font-bold text-slate-800 bg-slate-50 transition-colors placeholder:text-slate-400"
                />
              </div>

            </div>

            <div className="pt-3 flex items-center justify-end border-t border-slate-100">
              <button
                id="btn-start-evaluation"
                type="submit"
                className="w-full sm:w-auto py-2.5 px-6 bg-blue-800 hover:bg-blue-900 text-white font-black text-base rounded-xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: QUESTIONS WIZARD */}
      {step === 2 && currentQuestion && (
        <div id="wizard-step-2" className="space-y-3 sm:space-y-4">
          
          {/* Top Progress bar and informant metadata preview - subtle & compact */}
          <div className="bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-medium truncate max-w-md">
              <span className="text-slate-400">👤</span>
              <span className="font-bold text-slate-800 truncate">{nombreCompleto}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-semibold truncate">{odpe} - {distritoZona}</span>
            </div>

            {/* Subtle mini progress dots */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 mr-1 hidden xs:inline">Rubro {currentQuestionIndex + 1}/9</span>
              {QUESTIONS.map((q, idx) => (
                <div
                  id={`progress-dot-rubro-${q.id}`}
                  key={q.id}
                  className={`w-5 h-5 rounded-full font-black text-[10px] flex items-center justify-center transition-all ${
                    idx === currentQuestionIndex
                      ? 'bg-blue-700 text-white ring-2 ring-blue-300 scale-105'
                      : idx < currentQuestionIndex
                      ? 'bg-blue-200 text-blue-900 font-bold'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                  title={`${q.id}. ${q.titulo}`}
                >
                  {idx < currentQuestionIndex ? '✓' : q.id}
                </div>
              ))}
            </div>
          </div>

          {/* Mode 1: Main Rubro Evaluation (hasProblem !== true) */}
          {hasProblem !== true ? (
            <div className={`border-2 ${theme.border} rounded-2xl p-4 sm:p-6 ${theme.bg} shadow-md space-y-4 transition-all duration-300`}>
              
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-3xl sm:text-4xl bg-white p-2.5 rounded-xl border border-white shadow-2xs shrink-0">
                    {currentQuestion.icon}
                  </span>
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 tracking-wider uppercase mb-0.5">
                      Rubro {currentQuestion.id} de 9
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {currentQuestion.titulo}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 mt-1 max-w-xl leading-snug">
                      {currentQuestion.desc}
                    </p>
                  </div>
                </div>

                {/* Audio Reader */}
                <div className="shrink-0">
                  <AudioReader text={`Rubro número ${currentQuestion.id}. ${currentQuestion.titulo}. ${currentQuestion.desc}. ¿Se ha registrado alguna situación vinculada a este rubro?`} />
                </div>
              </div>

              {/* SÍ / NO BUTTONS - Direct Action Flow */}
              <div className="space-y-2 pt-1">
                <div className="text-slate-800 font-extrabold text-sm sm:text-base text-center sm:text-left">
                  ¿Se ha registrado alguna situación vinculada a este rubro? *
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* NO BUTTON - BLUE COLOR - Instant Advance without scrolling */}
                  <button
                    id="btn-answer-no"
                    type="button"
                    onClick={handleAnswerNoAndAdvance}
                    className="py-3 px-4 rounded-xl border-2 bg-blue-800 hover:bg-blue-900 active:bg-blue-950 border-blue-900 transition-all duration-150 flex items-center justify-center gap-3 text-base sm:text-lg font-black text-white shadow-sm active:scale-95 cursor-pointer"
                    title="Todo normal en este rubro. Pasar al siguiente automáticamente"
                  >
                    <span className="text-lg bg-white text-blue-800 rounded-full p-1 flex items-center justify-center w-7 h-7 font-black shrink-0">
                      ✕
                    </span>
                    <div className="text-left">
                      <span className="block leading-tight">NO se registró</span>
                      <span className="text-[10px] text-blue-200 font-medium block">Todo normal • Pasar al siguiente</span>
                    </div>
                  </button>

                  {/* SÍ BUTTON - GREEN COLOR - Switch to dedicated subquestions screen */}
                  <button
                    id="btn-answer-si"
                    type="button"
                    onClick={handleAnswerSi}
                    className="py-3 px-4 rounded-xl border-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border-emerald-700 transition-all duration-150 flex items-center justify-center gap-3 text-base sm:text-lg font-black text-white shadow-sm active:scale-95 cursor-pointer"
                    title="Registrar los detalles de la incidencia"
                  >
                    <span className="text-lg bg-white text-emerald-600 rounded-full p-1 flex items-center justify-center w-7 h-7 font-black shrink-0">
                      ✓
                    </span>
                    <div className="text-left">
                      <span className="block leading-tight">SÍ se registró</span>
                      <span className="text-[10px] text-emerald-100 font-medium block">Llenar detalle de la incidencia</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-start gap-3 pt-2 border-t border-slate-200/60">
                <button
                  id="btn-wizard-back"
                  disabled={isSubmitting}
                  onClick={handleBack}
                  className="py-1.5 px-3 bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{currentQuestionIndex === 0 ? 'Volver a Datos' : 'Rubro Anterior'}</span>
                </button>
              </div>

            </div>
          ) : (
            /* Mode 2: Dedicated Single-Screen Sub-questions Form (hasProblem === true) */
            <div className="bg-white border-2 border-red-300 rounded-2xl p-3 sm:p-4 shadow-md space-y-3 animate-fadeIn">
              
              {/* Form Header */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-1 bg-red-50 border border-red-200 rounded-lg shrink-0">
                    {currentQuestion.icon}
                  </span>
                  <div>
                    <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-black bg-red-100 text-red-800 uppercase">
                      Incidencia • Rubro {currentQuestion.id}
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      {currentQuestion.titulo}
                    </h4>
                  </div>
                </div>

                <AudioReader text={`Detalle de la incidencia para el rubro ${currentQuestion.id}. ${currentQuestion.titulo}. Por favor complete qué ocurrió, qué actividad podría afectarse y las acciones adoptadas.`} />
              </div>

              {/* 4 Sub-questions Grid - Fits comfortably without page scrolling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* 1. ¿Qué ocurrió y dónde? */}
                <div className="space-y-1">
                  <label className="block text-slate-800 font-bold text-xs">
                    1. ¿Qué ocurrió y dónde? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="textarea-ocurrencia"
                    rows={2}
                    value={ocurrencia}
                    onChange={(e) => setOcurrencia(e.target.value)}
                    placeholder="Hechos ocurridos y ubicación exacta..."
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-red-500 focus:outline-none placeholder-slate-400 bg-slate-50 text-xs"
                    required
                  />
                </div>

                {/* 2. ¿Qué actividad electoral podría afectarse? */}
                <div className="space-y-1">
                  <label className="block text-slate-800 font-bold text-xs">
                    2. ¿Qué actividad electoral podría afectarse? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="textarea-consecuencia"
                    rows={2}
                    value={consecuencia}
                    onChange={(e) => setConsecuencia(e.target.value)}
                    placeholder="Actividad en riesgo e impacto previsto..."
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-red-500 focus:outline-none placeholder-slate-400 bg-slate-50 text-xs"
                    required
                  />
                </div>

                {/* 3. Acciones adoptadas por la ODPE */}
                <div className="space-y-1">
                  <label className="block text-slate-800 font-bold text-xs">
                    3. Acciones adoptadas por la ODPE <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="textarea-acciones-odpe"
                    rows={2}
                    value={accionesOdpe}
                    onChange={(e) => setAccionesOdpe(e.target.value)}
                    placeholder="Medidas tomadas o coordinaciones inmediatas..."
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400 bg-slate-50 text-xs"
                    required
                  />
                </div>

                {/* 4. Fuente o evidencia + Adjunto */}
                <div className="space-y-1">
                  <label className="block text-slate-800 font-bold text-xs">
                    4. Fuente o evidencia (Opcional)
                  </label>
                  <input
                    id="input-fuente-evidencia"
                    type="text"
                    value={fuenteEvidencia}
                    onChange={(e) => setFuenteEvidencia(e.target.value)}
                    placeholder="Ej. Enlace web, llamada, documento..."
                    className="w-full p-1.5 border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-indigo-500 focus:outline-none placeholder-slate-400 bg-slate-50 text-xs mb-1"
                  />

                  {/* File upload compact row */}
                  {selectedFile ? (
                    <div className="flex items-center justify-between bg-blue-50 p-1.5 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {selectedFile.type.startsWith('image/') ? (
                          <img 
                            src={selectedFile.data} 
                            alt="Vista previa" 
                            className="w-6 h-6 rounded object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <File className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <span className="text-[11px] font-bold text-slate-800 truncate max-w-[140px]">{selectedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded cursor-pointer"
                        title="Quitar archivo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-1.5 border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 rounded-lg py-1 px-2 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-blue-700" />
                      <span className="text-[11px] font-bold text-blue-900">Adjuntar Foto o Archivo (Opcional)</span>
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

              {/* Bottom Actions: Cancel / Save & Advance */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelSi}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Cambiar a NO (Sin Novedad)</span>
                </button>

                <button
                  id="btn-wizard-next"
                  disabled={isSubmitting}
                  onClick={handleNext}
                  className="py-2 px-5 bg-blue-800 hover:bg-blue-900 active:scale-95 transition-all rounded-xl font-black text-xs sm:text-sm text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>{currentQuestionIndex === QUESTIONS.length - 1 ? 'Guardar y Finalizar' : 'Guardar y Siguiente'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* STEP 3: SUCCESS STATE - CLEAN & DIRECT CONFIRMATION */}
      {step === 3 && (
        <div id="wizard-step-3" className="bg-white border-2 border-emerald-300 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-fadeIn max-w-2xl mx-auto my-6">
          
          {/* Prominent Visual Success Badge Image / Graphic */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="relative bg-linear-to-b from-emerald-500 to-emerald-700 p-5 rounded-full shadow-lg border-4 border-white text-white">
              <Check className="w-16 h-16 sm:w-20 sm:h-20 stroke-[3.5px]" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black uppercase tracking-wider">
              <span>✓</span> Proceso Completado
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              SUS DATOS FUERON ALMACENADOS CORRECTAMENTE
            </h2>
            
            <p className="text-xl sm:text-2xl text-blue-900 font-black tracking-wide">
              PUEDE CERRAR EL APLICATIVO
            </p>

            <div className="pt-2">
              <div className="inline-block bg-slate-100 border border-slate-200 rounded-2xl px-6 py-3 text-sm sm:text-base text-slate-700 font-bold max-w-lg mx-auto">
                Informante: <span className="text-slate-950 font-black">{nombreCompleto}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

