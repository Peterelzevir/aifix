'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiLoader, FiAlertTriangle, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { useChatContext } from '@/context/ChatContext';
import { startSpeechRecognition, speakText } from '@/lib/voice';

export default function VoiceInput() {
  const { sendMessage, isProcessing } = useChatContext();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [speakingVolume, setSpeakingVolume] = useState(0);
  
  // Use refs to prevent cleanup issues
  const recognitionRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const speakingAnimationRef = useRef(null);
  const speechControllerRef = useRef(null);
  
  // Check if browser supports speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isRecognitionSupported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
      const isSynthesisSupported = 'speechSynthesis' in window;
      setIsSupported(isRecognitionSupported && isSynthesisSupported);
    }
  }, []);

  // Handle page close/unload - stop all speech
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopSpeech();
      return null; // No message needed
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Also handle visibility change (user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopSpeech();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopSpeech();
    };
  }, []);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      stopRecordingTimer();
      stopSpeakingAnimation();
      stopSpeech();
      
      if (recognitionRef.current && recognitionRef.current.stop) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error stopping speech recognition:', err);
        }
      }
    };
  }, []);

  // Function to stop speech
  const stopSpeech = () => {
    // Cancel any ongoing speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Use the controller if available
    if (speechControllerRef.current && speechControllerRef.current.cancel) {
      speechControllerRef.current.cancel();
    }
    
    setIsSpeaking(false);
    stopSpeakingAnimation();
  };

  // Update recording timer
  const startRecordingTimer = () => {
    setRecordingTime(0);
    stopRecordingTimer();
    
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        // Auto stop at 30 seconds if still recording
        if (prev >= 30) {
          stopVoiceRecording();
          return 0;
        }
        return prev + 0.1;
      });
    }, 100);
  };
  
  // Stop recording timer
  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };
  
  // Animate speaking
  const startSpeakingAnimation = () => {
    stopSpeakingAnimation();
    
    speakingAnimationRef.current = setInterval(() => {
      setSpeakingVolume(Math.random() * 0.6 + 0.2); // Random value between 0.2 and 0.8
    }, 150);
  };
  
  // Stop speaking animation
  const stopSpeakingAnimation = () => {
    if (speakingAnimationRef.current) {
      clearInterval(speakingAnimationRef.current);
      speakingAnimationRef.current = null;
      setSpeakingVolume(0);
    }
  };

  // Start voice recording
  const handleStartListening = () => {
    if (isProcessing || isSpeaking || !isSupported) return;
    
    // If bot is currently speaking, stop it first
    if (isSpeaking) {
      stopSpeech();
      return;
    }
    
    setError(null);
    setIsListening(true);
    setTranscript('');
    startRecordingTimer();
    
    try {
      // Handle speech recognition results
      const onResultCallback = (text, isFinal) => {
        console.log("Speech recognition result:", text, "Final:", isFinal);
        setTranscript(text);
      };
      
      // Handle end of recognition
      const onEndCallback = (result) => {
        console.log("Speech recognition ended", result);
        setIsListening(false);
        stopRecordingTimer();
        
        if (result.error) {
          setError(result.error);
          return;
        }
        
        // If we have text, process it
        if (result.transcript && result.transcript.trim().length > 2) {
          handleSendVoiceMessage(result.transcript);
        } else if (transcript && transcript.trim().length > 2) {
          // Use the latest transcript if final wasn't provided
          handleSendVoiceMessage(transcript);
        } else {
          setError("I couldn't detect any speech. Please try again.");
        }
      };
      
      // Start enhanced speech recognition
      const recognition = startSpeechRecognition(
        onResultCallback,
        onEndCallback
      );
      
      if (!recognition) {
        setError("Speech recognition couldn't start. Please check browser permissions.");
        setIsListening(false);
        stopRecordingTimer();
        return;
      }
      
      recognitionRef.current = recognition;
      
      // Set maximum recording time (10 seconds)
      setTimeout(() => {
        if (isListening && recognitionRef.current) {
          stopVoiceRecording();
        }
      }, 10000);
      
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError(`Couldn't access microphone. ${err.message || 'Please check permissions.'}`);
      setIsListening(false);
      stopRecordingTimer();
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (recognitionRef.current && recognitionRef.current.stop) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        setIsListening(false);
        stopRecordingTimer();
      }
    }
  };

  // Send voice message and process response
  const handleSendVoiceMessage = async (text) => {
    if (!text || !text.trim() || isProcessing) return;
    
    const trimmedText = text.trim();
    console.log("Sending voice message:", trimmedText);
    
    try {
      // Send message to AI
      const response = await sendMessage(trimmedText);
      
      // If we have a response, speak it
      if (response && response.content) {
        setIsSpeaking(true);
        startSpeakingAnimation();
        
        try {
          // Store the controller for later cancellation
          speechControllerRef.current = await speakText(response.content);
          setIsSpeaking(false);
          stopSpeakingAnimation();
        } catch (error) {
          console.error('Speech synthesis error:', error);
          setError('Could not play audio response. Please check your audio settings.');
          setIsSpeaking(false);
          stopSpeakingAnimation();
        }
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  // Modern UI for unsupported browsers
  if (!isSupported) {
    return (
      <div className="flex flex-col space-y-3 p-4 bg-primary-700 rounded-lg border border-primary-400/20">
        <div className="flex items-center text-yellow-500">
          <FiAlertTriangle className="mr-2" />
          <span className="text-sm">Voice mode is not supported in this browser.</span>
        </div>
        <button
          onClick={() => document.querySelector('[title="Switch to Text Mode"]').click()}
          className="py-2 px-4 bg-accent text-white rounded-md text-sm w-full"
        >
          Switch to Text Mode
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-white text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Transcript display */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-3 py-2 bg-primary-600 border border-primary-400/20 rounded-lg text-white text-sm shadow-inner"
          >
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-primary-300">
          {isListening 
            ? `🎤 Listening... (${recordingTime.toFixed(1)}s)`
            : isSpeaking
              ? '🔊 Speaking... (tap to stop)'
              : isProcessing
                ? '⏳ Processing...'
                : '👉 Tap the microphone to speak'}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Voice status indicators */}
          {isListening && (
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1
              }}
              className="w-2 h-2 rounded-full bg-red-500"
            />
          )}
          
          {/* Speaking indicator - now clickable to stop speech */}
          {isSpeaking && (
            <motion.button
              onClick={stopSpeech}
              style={{ 
                height: `${(speakingVolume * 16) + 16}px`,
                opacity: 0.8 + (speakingVolume * 0.2)
              }}
              className="min-w-6 px-2 rounded-full bg-accent transition-all duration-100 flex items-center justify-center hover:bg-red-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title="Click to stop speaking"
            >
              <FiVolumeX size={14} className="text-white" />
            </motion.button>
          )}
          
          {/* Voice button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isListening ? stopVoiceRecording : isSpeaking ? stopSpeech : handleStartListening}
            disabled={isProcessing && !isSpeaking}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
              ${isListening 
                ? 'bg-red-500 text-white' 
                : isSpeaking
                  ? 'bg-accent text-white hover:bg-red-500'
                  : isProcessing
                    ? 'bg-primary-600 text-primary-300 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent-light'
              }
              ${isListening ? 'shadow-glow' : ''}
            `}
          >
            {isProcessing && !isSpeaking ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <FiLoader size={24} />
              </motion.div>
            ) : isSpeaking ? (
              <FiVolumeX size={24} />
            ) : isListening ? (
              <FiMicOff size={24} />
            ) : (
              <FiMic size={24} />
            )}
          </motion.button>
        </div>
      </div>
      
      {/* Recording progress bar */}
      {isListening && (
        <div className="w-full bg-primary-700/50 h-1 rounded-full overflow-hidden mt-1">
          <motion.div 
            className="h-full bg-red-500"
            style={{ width: `${(recordingTime / 30) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
