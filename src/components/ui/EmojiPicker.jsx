'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSmile } from 'react-icons/fi';

// Common emojis for reactions
const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😍', '🎉', '🤔', '😱', 
  '🙌', '🔥', '👀', '💯', '👏', '🙏', '😊', '🤓', 
  '😎', '😢', '😡', '🤯', '💪', '✅', '❌', '⭐'
];

export default function EmojiPicker({ onSelectEmoji }) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  
  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Handle emoji selection
  const handleEmojiClick = (emoji) => {
    onSelectEmoji(emoji);
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={pickerRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-primary-400 hover:text-primary-200 rounded-full hover:bg-primary-700/50 transition-colors"
        aria-label="Add reaction"
      >
        <FiSmile size={18} />
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="absolute bottom-full right-0 mb-2 p-2 bg-primary-800 border border-primary-700 rounded-lg shadow-lg z-10 w-64"
          >
            <div className="grid grid-cols-8 gap-1">
              {COMMON_EMOJIS.map((emoji, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-7 h-7 flex items-center justify-center text-lg hover:bg-primary-700 rounded transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
            <div className="text-xs text-primary-400 mt-2 text-center">
              Click to add reaction
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
