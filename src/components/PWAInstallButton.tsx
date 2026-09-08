import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, AlertCircle, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, do not show anything
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <div id="pwa-android-install-banner" className="bg-blue-50 border-4 border-blue-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md animate-fadeIn">
        <div className="flex items-center gap-3.5 text-left">
          <div className="bg-blue-600 text-white p-3 rounded-2xl shrink-0">
            <Smartphone className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-black text-blue-950">¡Instala esta Aplicación!</h4>
            <p className="text-sm text-blue-700 font-bold leading-snug">
              Guarda el sistema en tu celular para acceder rápido sin usar el navegador de internet. ¡Es gratis y seguro!
            </p>
          </div>
        </div>
        
        <button
          id="btn-pwa-android-install"
          onClick={install}
          className="w-full md:w-auto py-3.5 px-6 bg-blue-800 text-white rounded-xl font-black text-md hover:bg-blue-900 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 border-2 border-blue-900"
        >
          <Download className="w-5 h-5" />
          <span>Instalar en mi Celular</span>
        </button>
      </div>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit natively)
  if (isIOS) {
    return (
      <>
        <div id="pwa-ios-install-banner" className="bg-blue-50 border-4 border-blue-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3.5 text-left">
            <div className="bg-blue-600 text-white p-3 rounded-2xl shrink-0">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-black text-blue-950">¡Disponible en iPhone / iPad!</h4>
              <p className="text-sm text-blue-700 font-bold leading-snug">
                Instala el sistema de reporte en la pantalla de inicio de tu iPhone para usarlo como una App normal.
              </p>
            </div>
          </div>
          
          <button
            id="btn-pwa-ios-guide-trigger"
            onClick={() => setShowIOSGuide(true)}
            className="w-full md:w-auto py-3.5 px-6 bg-blue-800 text-white rounded-xl font-black text-md hover:bg-blue-900 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 border-2 border-blue-900"
          >
            <Download className="w-5 h-5" />
            <span>Instalar en iPhone</span>
          </button>
        </div>

        {showIOSGuide && (
          <div id="ios-install-guide-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white border-4 border-blue-300 p-6 shadow-2xl space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-6 h-6 text-blue-800" />
                  <span>Instalar en iPhone / iPad</span>
                </h3>
                <button
                  id="btn-ios-guide-close"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 text-left">
                <p className="text-slate-700 font-bold leading-relaxed">
                  Sigue estos sencillos pasos para agregar el sistema a tu celular de forma directa:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border-2 border-slate-200">
                    <span className="bg-blue-100 text-blue-800 font-black text-lg w-7 h-7 rounded-full flex items-center justify-center shrink-0">1</span>
                    <p className="text-slate-800 text-sm font-bold leading-snug">
                      Presiona el botón de <strong className="text-blue-800 font-extrabold">Compartir</strong> (el icono de un cuadro con una flecha hacia arriba <span className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">⎋</span>) en la barra inferior de Safari.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border-2 border-slate-200">
                    <span className="bg-blue-100 text-blue-800 font-black text-lg w-7 h-7 rounded-full flex items-center justify-center shrink-0">2</span>
                    <p className="text-slate-800 text-sm font-bold leading-snug">
                      Desliza el menú hacia abajo y selecciona la opción <strong className="text-blue-800 font-extrabold">"Agregar a Inicio"</strong> (o <strong className="text-blue-800 font-extrabold">"Add to Home Screen"</strong>).
                    </p>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border-2 border-slate-200">
                    <span className="bg-blue-100 text-blue-800 font-black text-lg w-7 h-7 rounded-full flex items-center justify-center shrink-0">3</span>
                    <p className="text-slate-800 text-sm font-bold leading-snug">
                      Presiona <strong className="text-blue-800 font-extrabold">"Agregar"</strong> (o <strong className="text-blue-800 font-extrabold">"Add"</strong>) en la esquina superior derecha y listo. ¡Ya tendrás el acceso directo en tu pantalla!
                    </p>
                  </div>
                </div>
              </div>

              <button
                id="btn-ios-guide-done"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-3.5 px-6 bg-blue-800 hover:bg-blue-900 border-2 border-blue-900 text-white font-black text-md rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>Entendido, ¡gracias!</span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Retirar esa informacion por completo si no aplica para Android o iOS para mantener la pantalla despejada
  return null;
};
