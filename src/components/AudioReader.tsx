import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioReaderProps {
  text: string;
  id?: string;
  autoPlay?: boolean;
}

export default function AudioReader({ text, id, autoPlay = false }: AudioReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
      
      // Ensure voices are loaded
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  const getBestFemaleSpanishVoice = (synthInstance: SpeechSynthesis) => {
    const voices = synthInstance.getVoices();
    if (!voices || voices.length === 0) return null;

    const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
    if (spanishVoices.length === 0) return null;

    const femaleKeywords = [
      'female', 'mujer', 'sabina', 'paulina', 'dalia', 'monica', 'mónica',
      'lucia', 'lucía', 'laura', 'helena', 'soledad', 'penelope', 'penélope',
      'rosa', 'camila', 'sofia', 'sofía', 'carmen', 'alva', 'elvira',
      'victoria', 'zira', 'marta', 'elena', 'maria', 'maría', 'juana',
      'conchita', 'luisa', 'francisca', 'ximena', 'isabel', 'google español'
    ];

    const maleKeywords = [
      'male', 'hombre', 'raul', 'raúl', 'jorge', 'diego', 'pablo', 'gonzalo',
      'carlos', 'miguel', 'antonio', 'manuel', 'alvaro', 'álvaro', 'enrique',
      'pedro', 'david', 'fernando', 'jose', 'josé', 'juan', 'julio', 'sergio'
    ];

    // 1. High priority: Latin American Spanish female voice
    const latamLocales = ['es-419', 'es-mx', 'es-pe', 'es-co', 'es-us', 'es-cl', 'es-ar'];
    for (const locale of latamLocales) {
      const match = spanishVoices.find(v => {
        const nameLower = v.name.toLowerCase();
        const langLower = v.lang.toLowerCase().replace('_', '-');
        const isLatam = langLower.startsWith(locale);
        const isFemale = femaleKeywords.some(k => nameLower.includes(k)) && !maleKeywords.some(k => nameLower.includes(k));
        return isLatam && isFemale;
      });
      if (match) return match;
    }

    // 2. Any Spanish female voice (Spain or general)
    const anyFemale = spanishVoices.find(v => {
      const nameLower = v.name.toLowerCase();
      return femaleKeywords.some(k => nameLower.includes(k)) && !maleKeywords.some(k => nameLower.includes(k));
    });
    if (anyFemale) return anyFemale;

    // 3. Any Spanish voice that is NOT explicitly male
    const nonMale = spanishVoices.find(v => {
      const nameLower = v.name.toLowerCase();
      return !maleKeywords.some(k => nameLower.includes(k));
    });
    if (nonMale) return nonMale;

    // 4. Default fallback Spanish voice
    return spanishVoices[0] || null;
  };

  const speak = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!synth) return;

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-419'; // Standard Latin American Spanish
    
    const voice = getBestFemaleSpanishVoice(synth);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    // Natural female voice pitch and conversational pace
    utterance.pitch = 1.15; // Natural female pitch
    utterance.rate = 0.95; // Clear, well-articulated pace

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    synth.speak(utterance);
  };

  // Optional autoPlay trigger on mount (user-initiated steps)
  useEffect(() => {
    if (autoPlay && synth && text) {
      const timer = setTimeout(() => {
        speak();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, synth, text]);

  if (!synth) return null;

  return (
    <button
      id={id || `btn-audio-${text.substring(0, 10).replace(/\s+/g, '-')}`}
      onClick={speak}
      className={`p-3 rounded-full transition-all duration-300 transform active:scale-95 cursor-pointer ${
        isPlaying
          ? 'bg-amber-500 text-white shadow-md animate-pulse'
          : 'bg-white text-amber-600 border-2 border-amber-300 hover:bg-amber-50'
      } flex items-center justify-center gap-2`}
      title={isPlaying ? 'Detener lectura' : 'Escuchar en voz alta (Voz fluida LATAM)'}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-5 h-5 animate-bounce" />
          <span className="text-xs sm:text-sm font-bold pr-1">Detener</span>
        </>
      ) : (
        <>
          <Volume2 className="w-5 h-5" />
          <span className="text-xs sm:text-sm font-bold pr-1">Escuchar</span>
        </>
      )}
    </button>
  );
}
