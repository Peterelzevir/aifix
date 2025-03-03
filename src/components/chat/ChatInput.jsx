'use client';

import { useState, useRef, useEffect } from 'react';
import { FiSend, FiChevronDown } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useChatContext } from '@/context/ChatContext';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const { sendMessage, isProcessing } = useChatContext();
  const inputRef = useRef(null);
  const [rows, setRows] = useState(1);
  const [isFocused, setIsFocused] = useState(false);

  // Focus the input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isProcessing) return;
    
    await sendMessage(message);
    setMessage('');
    setRows(1);
    
    // Re-focus input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Automatically adjust rows based on content
    const textareaLineHeight = 24; // approximate line height in pixels
    const minRows = 1;
    const maxRows = 5;
    
    const previousRows = e.target.rows;
    e.target.rows = minRows; // reset rows
    
    const currentRows = Math.floor(e.target.scrollHeight / textareaLineHeight);
    
    if (currentRows === previousRows) {
      e.target.rows = currentRows;
    }
    
    if (currentRows >= maxRows) {
      e.target.rows = maxRows;
      e.target.scrollTop = e.target.scrollHeight;
    }
    
    setRows(currentRows < maxRows ? currentRows : maxRows);
  };

  // Handle keyboard shortcut (Ctrl/Cmd + Enter)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full relative">
      <form 
        onSubmit={handleSubmit} 
        className={`
          flex items-end gap-2 rounded-xl
          ${isFocused ? 'shadow-glow border-accent' : 'border-primary-600/50'}
          p-1 border bg-primary-700 transition-all duration-200
        `}
      >
        <div className="relative flex-grow">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isProcessing}
            placeholder="Message AI Peter..."
            rows={rows}
            className="w-full py-3 px-4 bg-transparent text-primary-50 placeholder-primary-400 focus:outline-none resize-none text-sm leading-6"
            style={{
              minHeight: '44px',
              maxHeight: '150px',
            }}
          />
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!message.trim() || isProcessing}
          className={`
            p-2 h-10 w-10 rounded-lg flex items-center justify-center transition-colors
            ${!message.trim() || isProcessing
              ? 'text-primary-400 cursor-not-allowed'
              : 'bg-accent text-white hover:bg-accent-light'
            }
          `}
          aria-label="Send message"
        >
          <FiSend size={18} />
        </motion.button>
      </form>
      
      {/* Keyboard shortcuts */}
      <div className="absolute right-0 bottom-0 transform translate-y-6 text-xs text-primary-400 flex items-center opacity-70">
        <span>
          {isProcessing ? 'Processing...' : 'Press Enter to send, Shift+Enter for new line'}
        </span>
        <FiChevronDown size={12} className="ml-1" />
      </div>
    </div>
  );
}
