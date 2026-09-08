import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioReaderProps {
  text: string;
  id?: string;
}

export default function AudioReader({ text, id }: AudioReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
    
    // Stop speaking when component unmounts
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card selection click handlers
    if (!synth) return;

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    // Cancel anything currently playing first
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set default standard Latin American Spanish language code
    utterance.lang = 'es-MX';
    
    const voices = synth.getVoices();
    
    // Find best Latin American female voice
    let bestVoice = voices.find(v => 
      v.lang.toLowerCase().includes('es-mx') && 
      (v.name.toLowerCase().includes('sabina') || v.name.toLowerCase().includes('daria') || v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('mujer'))
    );

    if (!bestVoice) {
      // Fallback 1: Any Mexican Spanish voice
      bestVoice = voices.find(v => v.lang.toLowerCase().includes('es-mx'));
    }

    if (!bestVoice) {
      // Fallback 2: Other Latin Spanish female voices (es-US, es-CO, es-PE, etc.)
      bestVoice = voices.find(v => 
        (v.lang.toLowerCase().includes('es-us') || v.lang.toLowerCase().includes('es-co') || v.lang.toLowerCase().includes('es-pe') || v.lang.toLowerCase().includes('es-cl')) &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('mujer') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('monica') || v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('sabrina'))
      );
    }

    if (!bestVoice) {
      // Fallback 3: Any Latin American voice
      bestVoice = voices.find(v => 
        v.lang.toLowerCase().includes('es-us') || 
        v.lang.toLowerCase().includes('es-co') || 
        v.lang.toLowerCase().includes('es-pe') || 
        v.lang.toLowerCase().includes('es-cl') || 
        v.lang.toLowerCase().includes('es-ar')
      );
    }

    if (!bestVoice) {
      // Fallback 4: Any Spanish Female Voice
      bestVoice = voices.find(v => 
        v.lang.toLowerCase().startsWith('es') && 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('mujer') || v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('helena') || v.name.toLowerCase().includes('sabina') || v.name.toLowerCase().includes('monica'))
      );
    }

    if (!bestVoice) {
      // Final fallback: Any Spanish voice
      bestVoice = voices.find(v => v.lang.toLowerCase().startsWith('es'));
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    }

    // Set pitch to 1.15 to generate a warm, friendly feminine tone
    utterance.pitch = 1.15;
    utterance.rate = 0.95; // Slower rate for maximum clarity

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    synth.speak(utterance);
  };

  if (!synth) return null;

  return (
    <button
      id={id || `btn-audio-${text.substring(0, 10).replace(/\s+/g, '-')}`}
      onClick={speak}
      className={`p-3 rounded-full transition-all duration-300 transform active:scale-95 ${
        isPlaying
          ? 'bg-amber-500 text-white shadow-md animate-pulse'
          : 'bg-white text-amber-600 border-2 border-amber-300 hover:bg-amber-50'
      } flex items-center justify-center gap-2`}
      title={isPlaying ? 'Detener lectura' : 'Escuchar en voz alta'}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-6 h-6 animate-bounce" />
          <span className="text-sm font-bold pr-1">Detener</span>
        </>
      ) : (
        <>
          <Volume2 className="w-6 h-6" />
          <span className="text-sm font-bold pr-1">Escuchar</span>
        </>
      )}
    </button>
  );
}
