'use client';

import { motion } from 'framer-motion';

export default function LoadingAnimation({
  type = 'dots',
  size = 'md',
  color = 'accent',
  text = '',
  className = '',
}) {
  // Size variants
  const sizes = {
    sm: {
      container: 'h-4',
      dot: 'w-1 h-1',
      spinner: 'w-4 h-4 border-2',
      bar: 'h-1',
    },
    md: {
      container: 'h-8',
      dot: 'w-2 h-2',
      spinner: 'w-8 h-8 border-2',
      bar: 'h-2',
    },
    lg: {
      container: 'h-12',
      dot: 'w-3 h-3',
      spinner: 'w-12 h-12 border-3',
      bar: 'h-3',
    },
  };
  
  // Color variants
  const colors = {
    accent: 'bg-accent',
    white: 'bg-white',
    gray: 'bg-gray-400',
  };
  
  const spinnerColors = {
    accent: 'border-accent',
    white: 'border-white',
    gray: 'border-gray-400',
  };
  
  const sizeObj = sizes[size] || sizes.md;
  const colorClass = colors[color] || colors.accent;
  const spinnerColorClass = spinnerColors[color] || spinnerColors.accent;

  // Dot loading animation
  if (type === 'dots') {
    return (
      <div className={`flex items-center justify-center ${sizeObj.container} ${className}`}>
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`${sizeObj.dot} rounded-full ${colorClass}`}
              animate={{
                y: ['0%', '-100%', '0%'],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
        {text && <span className="ml-3 text-sm text-gray-400">{text}</span>}
      </div>
    );
  }

  // Spinner loading animation
  if (type === 'spinner') {
    return (
      <div className={`flex items-center justify-center ${sizeObj.container} ${className}`}>
        <motion.div
          className={`${sizeObj.spinner} rounded-full ${spinnerColorClass} border-t-transparent`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {text && <span className="ml-3 text-sm text-gray-400">{text}</span>}
      </div>
    );
  }

  // Typing indicator animation
  if (type === 'typing') {
    return (
      <div className={`flex items-center ${sizeObj.container} ${className}`}>
        <div className="typing-animation">
          <span className={`inline-block ${sizeObj.dot} rounded-full ${colorClass}`}></span>
          <span className={`inline-block ${sizeObj.dot} rounded-full ${colorClass}`}></span>
          <span className={`inline-block ${sizeObj.dot} rounded-full ${colorClass}`}></span>
        </div>
        {text && <span className="ml-3 text-sm text-gray-400">{text}</span>}
      </div>
    );
  }

  // Progress bar animation
  if (type === 'bar') {
    return (
      <div className={`w-full overflow-hidden bg-dark-800 rounded-full ${sizeObj.bar} ${className}`}>
        <motion.div
          className={`${sizeObj.bar} ${colorClass}`}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        {text && <div className="mt-1 text-xs text-gray-400 text-center">{text}</div>}
      </div>
    );
  }

  // AI thinking animation
  if (type === 'ai-thinking') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="ai-thinking">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        {text && <div className="mt-2 text-sm text-gray-400">{text}</div>}
      </div>
    );
  }

  // Pulse animation
  if (type === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <motion.div
          className={`${sizeObj.spinner} rounded-full ${colorClass}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
        {text && <span className="ml-3 text-sm text-gray-400">{text}</span>}
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg className="animate-spin h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {text && <span className="ml-3 text-sm text-gray-400">{text}</span>}
    </div>
  );
}