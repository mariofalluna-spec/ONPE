import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      id="pwa-offline-indicator" 
      className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 z-50 flex items-center gap-3.5 rounded-2xl bg-amber-600 px-5 py-4 text-white shadow-2xl border-2 border-amber-500 animate-slideUp"
    >
      <div className="bg-amber-700 p-2 rounded-xl shrink-0">
        <WifiOff className="w-5 h-5 text-white animate-pulse" />
      </div>
      <div>
        <h5 className="font-black text-sm">Modo Fuera de Línea (Offline)</h5>
        <p className="text-xs text-amber-100 font-bold leading-normal">
          No tienes conexión a internet. Se usarán datos guardados hasta que vuelva la red.
        </p>
      </div>
    </div>
  );
};
