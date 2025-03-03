/**
 * Web Speech API utilities for speech-to-text and text-to-speech
 * Complete optimization with natural voice and accurate recognition
 * @version 2.0.0
 */

// ===== SPEECH RECOGNITION =====

/**
 * Start speech recognition with enhanced accuracy and silence detection
 * @param {Function} onResult - Callback triggered when results are available
 * @param {Function} onEnd - Callback triggered when recognition ends
 * @returns {Object|null} - Recognition controller or null if not supported
 */
export const startSpeechRecognition = (onResult, onEnd) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Speech recognition is not supported in this browser');
    onEnd({ error: 'Speech recognition not supported' });
    return null;
  }

  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configuration for optimal Indonesian recognition
    recognition.lang = 'id-ID';
    recognition.continuous = true;
    recognition.interimResults = true; 
    recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy

    // State tracking
    let finalTranscript = '';
    let lastSpeechTimestamp = Date.now();
    let silenceTimeout = null;
    let isNewSession = true;
    let confidenceThreshold = 0.75; // Minimum confidence to accept a result

    recognition.onstart = () => {
      isNewSession = true;
      finalTranscript = '';
      console.log('Speech recognition started');
    };

    // Core recognition handler
    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      // Clear final transcript at the start of a new utterance
      if (isNewSession) {
        finalTranscript = '';
        isNewSession = false;
      }
      
      // Find the most confident result
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        // Find the alternative with highest confidence
        let bestAlternative = 0;
        let bestConfidence = 0;
        
        for (let j = 0; j < event.results[i].length; j++) {
          if (event.results[i][j].confidence > bestConfidence) {
            bestConfidence = event.results[i][j].confidence;
            bestAlternative = j;
          }
        }
        
        const transcript = event.results[i][bestAlternative].transcript;
        const confidence = event.results[i][bestAlternative].confidence;
        
        // Use the result only if confidence is above threshold
        if (event.results[i].isFinal) {
          if (confidence >= confidenceThreshold) {
            // Replace entire final transcript instead of appending
            finalTranscript = transcript;
          }
        } else {
          interimTranscript = transcript;
        }
      }
      
      // Reset silence detection
      lastSpeechTimestamp = Date.now();
      
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
      
      // Adaptive silence timeout (3-5 seconds)
      const silenceDuration = 4000;
      silenceTimeout = setTimeout(() => {
        console.log(`Silence detected for ${silenceDuration/1000} seconds, stopping recording`);
        recognition.stop();
      }, silenceDuration);
      
      // Send results to callback
      if (interimTranscript) {
        onResult(interimTranscript, false);
      } else if (finalTranscript) {
        onResult(finalTranscript, true);
      }
    };

    // Enhanced error handling
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'Error with speech recognition';
      let recoverable = false;
      
      switch(event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please check permissions.';
          recoverable = false;
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found or microphone is busy.';
          recoverable = false;
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          recoverable = true;
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          recoverable = true;
          break;
        case 'no-speech':
          errorMessage = 'No speech was detected.';
          recoverable = true;
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech service is not allowed.';
          recoverable = false;
          break;
      }
      
      // Clear silence timeout
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
      
      onEnd({ error: errorMessage, recoverable });
      
      // Auto-restart if error is recoverable
      if (recoverable) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition after error:', e);
          }
        }, 1000);
      }
    };

    // End of recognition session
    recognition.onend = () => {
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
      
      // Ensure we have a clean final transcript
      const cleanTranscript = finalTranscript.trim();
      
      // Notify that recognition has ended with final transcript
      onEnd({ transcript: cleanTranscript, status: 'complete' });
      
      // Reset for next session
      isNewSession = true;
    };

    // Start listening
    recognition.start();
    
    // Return controller object with additional methods
    return { 
      recognition,
      stop: () => {
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
        }
        recognition.stop();
      },
      restart: () => {
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
        }
        recognition.abort();
        setTimeout(() => recognition.start(), 300);
        finalTranscript = '';
        isNewSession = true;
      },
      adjustThreshold: (newThreshold) => {
        if (newThreshold >= 0 && newThreshold <= 1) {
          confidenceThreshold = newThreshold;
          return true;
        }
        return false;
      }
    };
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
    onEnd({ error: error.message, recoverable: false });
    return null;
  }
};

// ===== TEXT TO SPEECH =====

// Cache for found voices to improve performance
let cachedVoices = null;

/**
 * Speak text with the most natural-sounding voice available
 * @param {string} text - Text to speak
 * @param {Object} options - Optional settings
 * @returns {Promise} - Resolves when speech is complete
 */
export const speakText = (text, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Text-to-speech is not supported in your browser'));
      return;
    }

    // Default options
    const defaultOptions = {
      rate: 1.0,         // Speech rate (0.1 to 10)
      pitch: 1.0,        // Pitch (0 to 2)
      volume: 1.0,       // Volume (0 to 1)
      voiceType: 'auto', // 'auto', 'male', 'female', or specific voice name
      cleanSpecialChars: true // Whether to clean special characters
    };
    
    const settings = { ...defaultOptions, ...options };

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean the text if required
    let processedText = text;
    
    if (settings.cleanSpecialChars) {
      processedText = text
        // Remove markdown symbols and code blocks
        .replace(/\*\*|__|~~|\*|_/g, '')
        .replace(/```[\s\S]*?```/g, 'kode program')
        .replace(/`([^`]+)`/g, '$1')
        
        // Remove source indicators and citations
        .replace(/\[source\]|\[citation\]/gi, '')
        .replace(/\(source:.*?\)/g, '')
        
        // Remove special characters that shouldn't be read out loud
        .replace(/\*":/g, '')
        .replace(/([*":#])+/g, ' ')
        .replace(/\\/g, ' ')
        
        // Replace abbreviations with full words
        .replace(/(\w+)\.(\w+)/g, '$1 $2') // example.com -> example com
        
        // Clean up extra whitespace
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Chunk the text for better reliability
    const chunkLength = 160; // Smaller chunks for better performance
    const chunks = [];
    
    if (processedText.length > chunkLength) {
      let startIndex = 0;
      
      while (startIndex < processedText.length) {
        // Find breakpoints: sentence > comma > space
        let endIndex = Math.min(startIndex + chunkLength, processedText.length);
        const searchWindow = processedText.substring(startIndex, endIndex + 30);
        
        // Priority to sentence breaks
        const sentenceBreaks = [...searchWindow.matchAll(/[.!?]\s+/g)];
        if (sentenceBreaks.length > 0) {
          const firstBreak = sentenceBreaks[0];
          if (firstBreak.index < chunkLength) {
            endIndex = startIndex + firstBreak.index + 1;
          }
        } 
        // Next priority: commas
        else {
          const commaBreak = searchWindow.indexOf(', ');
          if (commaBreak > 0 && commaBreak < chunkLength) {
            endIndex = startIndex + commaBreak + 1;
          } 
          // Last resort: spaces
          else {
            const lastSpace = processedText.lastIndexOf(' ', startIndex + chunkLength);
            if (lastSpace > startIndex) {
              endIndex = lastSpace;
            }
          }
        }
        
        chunks.push(processedText.substring(startIndex, endIndex).trim());
        startIndex = endIndex;
      }
    } else {
      chunks.push(processedText);
    }
    
    // State tracking
    let currentChunk = 0;
    let utterances = [];
    let isSpeaking = false;
    
    // Get available voices
    const getVoices = async () => {
      // Use cached voices if available
      if (cachedVoices && cachedVoices.length > 0) {
        return cachedVoices;
      }
      
      return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        
        if (voices && voices.length > 0) {
          cachedVoices = voices;
          resolve(voices);
        } else {
          // Wait for voices to be loaded
          window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            cachedVoices = voices;
            resolve(voices);
          };
          
          // Fallback in case onvoiceschanged never fires
          setTimeout(() => {
            voices = window.speechSynthesis.getVoices();
            if (voices && voices.length > 0) {
              cachedVoices = voices;
              resolve(voices);
            } else {
              resolve([]);
            }
          }, 1000);
        }
      });
    };
    
    // Find best voice based on quality and language
    const findBestVoice = async (voicePreference) => {
      const voices = await getVoices();
      
      // Log all available voices for debugging
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      
      // If a specific voice name is provided, try to find it
      if (voicePreference !== 'auto' && voicePreference !== 'male' && voicePreference !== 'female') {
        const requestedVoice = voices.find(v => 
          v.name.toLowerCase().includes(voicePreference.toLowerCase())
        );
        
        if (requestedVoice) {
          return requestedVoice;
        }
        // If specific voice not found, continue with auto selection
      }
      
      // Setup voice matcher based on preference
      const genderMatch = (voicePreference === 'male') 
        ? (name) => /\b(male|guy|boy|man)\b/i.test(name) || !/\b(female|girl|woman)\b/i.test(name)
        : (voicePreference === 'female')
          ? (name) => /\b(female|girl|woman)\b/i.test(name) || !/\b(male|guy|boy|man)\b/i.test(name)
          : () => true; // Auto mode - accept any gender
      
      // Priority list for natural-sounding voices
      const naturalVoiceKeywords = [
        // Indonesian voices (highest priority)
        { match: v => v.lang.includes('id') && genderMatch(v.name), score: 100 },
        
        // Modern natural voice technologies (very high priority)
        { match: v => (v.name.includes('Neural') || v.name.includes('Wavenet')) && genderMatch(v.name), score: 90 },
        { match: v => v.name.includes('Premium') && genderMatch(v.name), score: 85 },
        { match: v => v.name.includes('Natural') && genderMatch(v.name), score: 82 },
        
        // Microsoft/Apple voices (often higher quality)
        { match: v => v.name.includes('Microsoft') && genderMatch(v.name), score: 80 },
        { match: v => v.name.includes('Siri') && genderMatch(v.name), score: 78 },
        
        // Samsung/Google/Mobile voices
        { match: v => v.name.includes('Samsung') && genderMatch(v.name), score: 75 },
        { match: v => v.name.includes('Google') && genderMatch(v.name), score: 73 },
        
        // Fallback to good voices for close languages
        { match: v => v.lang.includes('ms') && genderMatch(v.name), score: 70 }, // Malay
        { match: v => v.lang.includes('en') && genderMatch(v.name), score: 60 }, // English
        
        // Any voice as last resort (low score = low priority)
        { match: () => true, score: 10 }
      ];
      
      // Score each voice based on our priorities
      const scoredVoices = voices.map(voice => {
        let score = 0;
        for (const rule of naturalVoiceKeywords) {
          if (rule.match(voice)) {
            score = Math.max(score, rule.score);
          }
        }
        return { voice, score };
      });
      
      // Sort by score (descending) and select best voice
      scoredVoices.sort((a, b) => b.score - a.score);
      
      // Log top voices with scores for debugging
      console.log('Top 3 voices by score:', 
        scoredVoices.slice(0, 3).map(v => 
          `${v.voice.name} (${v.voice.lang}): ${v.score}`
        )
      );
      
      return scoredVoices.length > 0 ? scoredVoices[0].voice : null;
    };
    
    // Function to speak the next chunk
    const speakNextChunk = async () => {
      if (currentChunk >= chunks.length) {
        isSpeaking = false;
        resolve();
        return;
      }
      
      isSpeaking = true;
      const chunk = chunks[currentChunk];
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterances.push(utterance);
      
      // Find the best voice if not yet cached
      const bestVoice = await findBestVoice(settings.voiceType);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      
      // Apply speech settings
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;
      
      // Setup event handlers
      utterance.onend = () => {
        currentChunk++;
        setTimeout(() => speakNextChunk(), 50); // Small pause between chunks
      };
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        currentChunk++;
        setTimeout(() => speakNextChunk(), 100);
      };
      
      // Safari/iOS bug workaround
      const safariWorkaround = () => {
        if (isSpeaking && !window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        }
      };
      
      const resumeInterval = setInterval(safariWorkaround, 250);
      utterance.onend = () => {
        clearInterval(resumeInterval);
        currentChunk++;
        setTimeout(() => speakNextChunk(), 50);
      };
      
      // Start speaking
      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error speaking chunk:', error);
        clearInterval(resumeInterval);
        currentChunk++;
        setTimeout(() => speakNextChunk(), 500);
      }
    };
    
    // Start speaking
    speakNextChunk();
    
    // Return control methods
    return {
      pause: () => {
        window.speechSynthesis.pause();
      },
      resume: () => {
        window.speechSynthesis.resume();
      },
      cancel: () => {
        window.speechSynthesis.cancel();
        resolve({ cancelled: true });
      }
    };
  });
};

// ===== UTILITY FUNCTIONS =====

/**
 * List all available speech synthesis voices
 * @returns {Promise<Array>} - List of available voices
 */
export const listAvailableVoices = () => {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      resolve(voices.map(v => ({
        name: v.name,
        lang: v.lang,
        default: v.default,
        localService: v.localService,
        voiceURI: v.voiceURI
      })));
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(voices.map(v => ({
          name: v.name,
          lang: v.lang,
          default: v.default,
          localService: v.localService,
          voiceURI: v.voiceURI
        })));
      };
    }
  });
};

/**
 * Test a specific voice by name
 * @param {string} voiceName - Part of the voice name to search for
 * @param {string} text - Text to speak for testing
 * @returns {Promise<Object>} - Voice details or false if not found
 */
export const testVoice = async (voiceName, text = "Halo, ini adalah tes suara. Bagaimana kualitas suara ini?") => {
  const voices = await new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(voices);
      };
    }
  });
  
  const selectedVoice = voices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()));
  
  if (!selectedVoice) {
    console.error(`Voice containing "${voiceName}" not found`);
    return false;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = selectedVoice;
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  
  window.speechSynthesis.speak(utterance);
  
  return {
    name: selectedVoice.name,
    lang: selectedVoice.lang,
    default: selectedVoice.default,
    localService: selectedVoice.localService
  };
};
