'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

export default function Hero() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [typeText, setTypeText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const fullText = "AI adalah masa depan";
  
  // Simulated loading screen
  useEffect(() => {
    const loadingInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(loadingInterval);
          setTimeout(() => setIsLoaded(true), 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    return () => clearInterval(loadingInterval);
  }, []);
  
  // Typing effect after loading
  useEffect(() => {
    if (inView && isLoaded) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < fullText.length) {
          setTypeText(fullText.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 80);
      
      return () => clearInterval(typingInterval);
    }
  }, [inView, isLoaded]);

  // Loading Screen
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900">
        <div className="text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center"
          >
            <Image 
              src="/images/logo.svg" 
              alt="AI Peter Logo"
              width={50}
              height={50}
              className="animate-pulse"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-lg font-medium text-primary-50"
          >
            AI Peter
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-primary-300 mb-6"
          >
            Loading your super modern chatbot...
          </motion.div>
          
          {/* Progress bar */}
          <div className="w-60 mx-auto bg-primary-800 rounded-full h-1.5 mb-1 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              className="h-full bg-accent"
            />
          </div>
          
          <div className="text-xs text-primary-400">
            {loadingProgress}%
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-primary-900" ref={ref}>
      {/* Background - simplified for better performance */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl"
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -30, 0],
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl"
          animate={{ 
            x: [0, -20, 0], 
            y: [0, 20, 0],
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      </div>

      <div className="container mx-auto px-4 text-center z-10 py-16">
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div className="mb-4">
            <Image 
              src="/images/logo.svg" 
              alt="AI Peter Logo"
              width={100}
              height={100}
              className="mx-auto"
            />
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-50 via-primary-50 to-accent-light leading-tight"
          >
            AI Peter
            <span className="block text-xl md:text-2xl lg:text-3xl mt-2 text-primary-200 font-normal">
              Super Modern AI Chatbot
            </span>
          </motion.h1>

          <motion.div className="h-8 mb-10">
            <div className="text-md md:text-lg text-primary-300 font-mono inline-block border-r-2 border-accent overflow-hidden whitespace-nowrap">
              {typeText}
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-3 mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link href="/chat">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3 bg-accent hover:bg-accent-light text-white rounded-lg font-medium transition-all duration-300 text-lg shadow-glow"
              >
                Start Chatting Now
              </motion.button>
            </Link>
            
            {/* Tombol Daftar baru */}
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3 bg-primary-700/90 border border-accent/30 text-primary-50 rounded-lg font-medium hover:bg-primary-700 hover:border-accent/50 transition-all duration-300 text-lg"
              >
                Daftar
              </motion.button>
            </Link>
            
            <Link href="#features">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3 bg-primary-700 border border-primary-600 text-primary-50 rounded-lg font-medium hover:bg-primary-800 transition-all duration-300 text-lg"
              >
                Discover Features
              </motion.button>
            </Link>
          </motion.div>
          
          {/* Link untuk login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 text-primary-300 text-sm"
          >
            Sudah punya akun? <Link href="/login" className="text-accent hover:text-accent-light hover:underline">Login di sini</Link>
          </motion.div>
        </motion.div>

        {/* AI Assistant Preview */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 relative max-w-2xl mx-auto"
        >
          <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden border border-primary-600/50 shadow-lg bg-primary-800/70 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-6 py-3 rounded-lg max-w-md w-full">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-medium mr-3 overflow-hidden">
                    <Image 
                      src="/images/avatar.svg" 
                      alt="AI Peter" 
                      width={32} 
                      height={32} 
                      className="w-full h-full"
                    />
                  </div>
                  <div>
                    <div className="text-primary-50 font-medium">AI Peter</div>
                    <div className="text-xs text-primary-300">Online now</div>
                  </div>
                </div>
                <div className="text-primary-50 p-3 bg-primary-700/70 rounded-lg">
                  Hello there! I'm Peter, your AI assistant. How can I help you today?
                </div>
                
                <div className="mt-3 flex justify-end">
                  <div className="flex items-center bg-accent/10 text-primary-50 p-3 rounded-lg ml-auto max-w-[70%]">
                    Can you help me with some information?
                  </div>
                </div>
                
                <div className="mt-3 flex items-start">
                  <div className="w-8 h-8 rounded-full bg-accent flex-shrink-0 flex items-center justify-center text-white font-medium mr-3 overflow-hidden">
                    <Image 
                      src="/images/avatar.svg" 
                      alt="AI Peter" 
                      width={32} 
                      height={32} 
                      className="w-full h-full"
                    />
                  </div>
                  <div className="typing-animation bg-primary-700/70 p-3 rounded-lg inline-block">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
            className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-10 h-10 text-primary-300"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            >
              <path d="M7 13l5 5 5-5"></path>
              <path d="M7 6l5 5 5-5"></path>
            </svg>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Tambahkan CSS untuk shadow-glow jika belum ada */}
      <style jsx global>{`
        .shadow-glow {
          box-shadow: 0 0 15px rgba(0, 120, 255, 0.3);
        }
        
        .typing-animation span {
          width: 8px;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          display: inline-block;
          margin: 0 2px;
        }
        
        .typing-animation span:nth-child(1) {
          animation: bounce 1s infinite 0.2s;
        }
        
        .typing-animation span:nth-child(2) {
          animation: bounce 1s infinite 0.4s;
        }
        
        .typing-animation span:nth-child(3) {
          animation: bounce 1s infinite 0.6s;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </section>
  );
}
