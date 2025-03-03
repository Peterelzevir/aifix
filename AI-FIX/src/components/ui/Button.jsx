'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-light',
  secondary: 'bg-dark-800 text-white hover:bg-dark-700 border border-white/10',
  outline: 'bg-transparent border border-accent text-accent hover:bg-accent/10',
  ghost: 'bg-transparent text-white hover:bg-white/10',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizes = {
  sm: 'py-1 px-3 text-sm',
  md: 'py-2 px-4 text-sm',
  lg: 'py-3 px-6 text-base',
  xl: 'py-4 px-8 text-lg',
};

const shapes = {
  default: 'rounded-md',
  rounded: 'rounded-full',
  square: 'rounded-none',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'default',
  className = '',
  href,
  disabled = false,
  isLoading = false,
  onClick,
  type = 'button',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  animate = true,
  ...props
}) {
  const baseClasses = `
    inline-flex items-center justify-center font-medium transition-all duration-200
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${shapes[shape] || shapes.default}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''}
    ${className}
  `;

  const content = (
    <>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      
      {icon && iconPosition === 'left' && !isLoading && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  // Motion button props
  const motionProps = animate
    ? {
        whileHover: disabled ? {} : { scale: 1.02 },
        whileTap: disabled ? {} : { scale: 0.98 },
        transition: { duration: 0.2 },
      }
    : {};

  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} passHref={true}>
        <motion.a
          className={baseClasses}
          {...motionProps}
          {...props}
        >
          {content}
        </motion.a>
      </Link>
    );
  }

  // Otherwise render as button
  return (
    <motion.button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...motionProps}
      {...props}
    >
      {content}
    </motion.button>
  );
}