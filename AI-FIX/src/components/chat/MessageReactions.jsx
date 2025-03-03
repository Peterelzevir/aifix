'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSmile, FiPlus } from 'react-icons/fi';
import EmojiPicker from '@/components/ui/EmojiPicker';

export default function MessageReactions({ messageId, initialReactions = {} }) {
  const [reactions, setReactions] = useState(initialReactions);
  const [showPicker, setShowPicker] = useState(false);
  
  // Add a reaction
  const handleAddReaction = (emoji) => {
    setReactions(prev => {
      const updatedReactions = { ...prev };
      
      if (updatedReactions[emoji]) {
        updatedReactions[emoji] += 1;
      } else {
        updatedReactions[emoji] = 1;
      }
      
      return updatedReactions;
    });
    
    setShowPicker(false);
  };
  
  // Remove a reaction (if clicking on your own)
  const handleRemoveReaction = (emoji) => {
    setReactions(prev => {
      const updatedReactions = { ...prev };
      
      if (updatedReactions[emoji] > 1) {
        updatedReactions[emoji] -= 1;
      } else {
        delete updatedReactions[emoji];
      }
      
      return updatedReactions;
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {/* Display existing reactions */}
      {Object.entries(reactions).map(([emoji, count]) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleRemoveReaction(emoji)}
          className="flex items-center space-x-1 px-1.5 py-0.5 bg-primary-800/80 hover:bg-primary-700 rounded-full text-xs"
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-primary-400">{count}</span>}
        </motion.button>
      ))}
      
      {/* Add reaction button */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 text-primary-400 hover:text-primary-200 rounded-full hover:bg-primary-800/80"
          aria-label="Add reaction"
        >
          <FiPlus size={14} />
        </motion.button>
        
        {/* Emoji picker */}
        <AnimatePresence>
          {showPicker && (
            <div className="absolute bottom-full mb-1 right-0">
              <EmojiPicker onSelectEmoji={handleAddReaction} />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
