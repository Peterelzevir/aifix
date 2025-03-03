'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Avatar({
  src = '',
  alt = 'Avatar',
  size = 'md',
  text = '',
  status = '',
  className = '',
  animate = false,
}) {
  // Size variants
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
  };
  
  const sizeClass = sizes[size] || sizes.md;
  
  // Status indicator styles
  const statusStyles = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  };
  
  const statusClass = statusStyles[status] || '';
  
  // Extract initials from text if no src is provided
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const initials = getInitials(text);
  
  // Animation props
  const motionProps = animate
    ? {
        initial: { rotate: -5 },
        animate: { rotate: 5 },
        transition: { 
          repeat: Infinity, 
          repeatType: 'reverse', 
          duration: 2 
        },
      }
    : {};

  return (
    <motion.div 
      className={`relative flex-shrink-0 ${className}`}
      {...motionProps}
    >
      <div 
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center text-white font-medium bg-accent`}
      >
        {src ? (
          <Image 
            src={src} 
            alt={alt} 
            width={64} 
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials || 'AI'}</span>
        )}
      </div>
      
      {status && (
        <span 
          className={`absolute bottom-0 right-0 block rounded-full ${statusClass} ring-2 ring-white`}
          style={{ width: '30%', height: '30%' }}
        />
      )}
    </motion.div>
  );
}