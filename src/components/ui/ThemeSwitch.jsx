'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeSwitch() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Initialize theme based on localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
      document.documentElement.classList.toggle('light', !prefersDark);
    }
  }, []);
  
  // Toggle theme
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark', !isDarkMode);
    document.documentElement.classList.toggle('light', isDarkMode);
    localStorage.setItem('theme', newTheme);
  };
  
  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-full overflow-hidden transition-colors
        ${isDarkMode ? 'bg-primary-700 text-yellow-300' : 'bg-blue-100 text-blue-800'}
      `}
      whileTap={{ scale: 0.95 }}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDarkMode ? 0 : 180,
          scale: isDarkMode ? 1 : 0
        }}
        transition={{ duration: 0.5 }}
        style={{ display: isDarkMode ? 'block' : 'none' }}
      >
        <FiMoon size={18} />
      </motion.div>
      
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDarkMode ? 180 : 0,
          scale: isDarkMode ? 0 : 1
        }}
        transition={{ duration: 0.5 }}
        style={{ 
          display: isDarkMode ? 'none' : 'block',
          position: isDarkMode ? 'absolute' : 'static',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <FiSun size={18} />
      </motion.div>
    </motion.button>
  );
}
