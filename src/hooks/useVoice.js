'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { startSpeechRecognition, speakText } from '@/lib/voice';

export default function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  // Cleanup function for speech recognition
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          console.error('Error stopping speech recognition:', err);
        }
      }
    };
  }, []);

  // Start listening for speech
  const startListening = useCallback(() => {
    if (isSpeaking) return;
    
    setError(null);
    setTranscript('');
    setFinalTranscript('');
    setIsListening(true);
    
    try {
      const recognition = startSpeechRecognition(
        // Result callback
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            setFinalTranscript(text);
          }
        },
        // End callback
        () => {
          setIsListening(false);
          recognitionRef.current = null;
        }
      );
      
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Could not start speech recognition. Please check your browser permissions.');
      setIsListening(false);
    }
  }, [isSpeaking]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Speak text
  const speak = useCallback(async (text) => {
    if (!text || isListening) return;
    
    setError(null);
    setIsSpeaking(true);
    
    try {
      await speakText(text);
    } catch (err) {
      console.error('Error speaking text:', err);
      setError('Could not speak the text. Text-to-speech may not be supported in your browser.');
    } finally {
      setIsSpeaking(false);
    }
  }, [isListening]);

  // Cancel speaking
  const cancelSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    speak,
    cancelSpeech
  };
}