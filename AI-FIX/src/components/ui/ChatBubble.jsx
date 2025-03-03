'use client';

import { motion } from 'framer-motion';

export default function ChatBubble({
  content,
  isUser = false,
  isError = false,
  timestamp,
  avatar,
  className = '',
  animate = true,
}) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Animation variants
  const animation = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
      {...animation}
    >
      <div className={`max-w-[80%] md:max-w-[70%] flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
        {/* Avatar - only show for non-user */}
        {!isUser && avatar && (
          <div className="flex-shrink-0">
            {typeof avatar === 'string' ? (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs">
                {avatar}
              </div>
            ) : (
              avatar
            )}
          </div>
        )}
        
        {/* Message content */}
        <div>
          <div 
            className={`
              px-4 py-3 rounded-2xl
              ${isUser 
                ? 'bg-accent text-white rounded-tr-none' 
                : isError
                  ? 'bg-red-500/20 text-white border border-red-500/40 rounded-tl-none'
                  : 'bg-dark-800 text-white border border-white/10 rounded-tl-none'
              }
            `}
          >
            {content}
          </div>
          
          {/* Timestamp */}
          {timestamp && (
            <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {formatTime(timestamp)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}