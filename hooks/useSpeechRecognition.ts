
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTranslations } from '../hooks/useTranslations'; // Import useTranslations

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
  error: string | null;
}

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const { language } = useLanguage();
  const t = useTranslations(); // Use translations hook
  const [transcript, setTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const finalTranscriptRef = useRef<string>(''); // To store accumulated final transcript for the current session

  const browserSupportsSpeechRecognition = !!SpeechRecognition;

  const getLangCode = useCallback((appLanguage: string): string => {
    switch (appLanguage) {
      case 'ru':
        return 'ru-RU';
      case 'uk':
        return 'uk-UA';
      case 'en':
      default:
        return 'en-US';
    }
  }, []);

  const startListening = useCallback(() => {
    if (browserSupportsSpeechRecognition) {
      if (recognitionRef.current) {
        // Stop any active session first to ensure a clean restart
        if (isListening) {
            recognitionRef.current.stop();
        }
        
        // No explicit reset of transcript/finalTranscriptRef.current here.
        // This will be handled reliably in the `onstart` event handler.
        
        recognitionRef.current.start();
        setIsListening(true);
        setError(null); // Clear error on start
      }
    } else {
      setError(t.voiceInputNotSupported); // Use translated message
    }
  }, [browserSupportsSpeechRecognition, isListening, t]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = ''; // Reset the internal final transcript
  }, []);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      return;
    }

    if (recognitionRef.current) {
        recognitionRef.current.stop(); // Stop previous instance if it exists
        recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getLangCode(language);

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      // CRITICAL FIX: Reset the internal transcript states reliably when recognition actually starts.
      setTranscript('');
      finalTranscriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript((finalTranscriptRef.current + interimTranscript).trim());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setError(t.speechRecognitionErrorNoSpeech); // Use specific translation for no-speech
      } else {
        setError(`${t.speechRecognitionError}: ${event.error}`); // Generic error translation
      }
      setIsListening(false);
      // Ensure the current transcript reflects the final state up to the error
      setTranscript(finalTranscriptRef.current.trim());
    };

    recognition.onend = () => {
      setIsListening(false);
      // When recognition ends, make sure the final transcript is set.
      setTranscript(finalTranscriptRef.current.trim());
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [browserSupportsSpeechRecognition, language, getLangCode, t]); // Add t to dependency array

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error,
  };
};