'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiAlertTriangle, FiUser, FiX } from 'react-icons/fi';
import Link from 'next/link';
import ChatInterface from '@/components/chat/ChatInterface';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function ChatPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  // Handle window size safely in client-side
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    
    // Set initial size
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated()) {
        setShowWarning(true);
      }
    }
  }, [isAuthenticated, loading]);

  // Countdown effect
  useEffect(() => {
    if (showWarning && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (showWarning && countdown === 0) {
      router.push('/login');
    }
  }, [countdown, router, showWarning]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-primary-900">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-accent border-solid rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-primary-100 text-lg font-medium">Memeriksa status login...</p>
          <p className="text-primary-400 text-sm mt-2">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated() ? (
        <ChatInterface />
      ) : (
        <AnimatePresence>
          {showWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/80 backdrop-blur-sm"
            >
              {/* Particles animation background - fixed to use windowSize safely */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {windowSize.width > 0 && [...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * windowSize.width, 
                      y: Math.random() * windowSize.height,
                      opacity: 0 
                    }}
                    animate={{ 
                      y: [Math.random() * windowSize.height, Math.random() * windowSize.height],
                      opacity: [0, 0.3, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 4 + Math.random() * 6,
                      delay: Math.random() * 2
                    }}
                    className="absolute w-2 h-2 rounded-full bg-accent/30"
                  />
                ))}
              </div>
              
              {/* Modal content */}
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-primary-800/90 backdrop-blur-md border border-primary-700/50 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                {/* Top border with animation */}
                <motion.div 
                  className="h-1 bg-gradient-to-r from-red-500 via-accent to-red-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                />
                
                {/* Warning content */}
                <div className="p-6">
                  <div className="flex items-start">
                    {/* Animated icon */}
                    <motion.div 
                      initial={{ rotate: -10, scale: 0.9 }}
                      animate={{ 
                        rotate: [0, -5, 0, 5, 0],
                        scale: [0.9, 1.1, 0.9, 1.1, 0.9]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 3
                      }}
                      className="flex-shrink-0 text-red-500 mr-4"
                    >
                      <FiAlertTriangle size={36} />
                    </motion.div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-primary-50 mb-2">Akses Dibatasi</h3>
                      <p className="text-primary-300 mb-4">
                        Anda harus login terlebih dahulu untuk mengakses fitur chat AI Peter.
                      </p>
                    </div>
                  </div>
                  
                  {/* Countdown timer */}
                  <div className="mt-4 mb-6">
                    <div className="relative h-2 bg-primary-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: `${(countdown / 5) * 100}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                        className="absolute h-full bg-accent"
                      />
                    </div>
                    <div className="mt-2 text-sm text-primary-400 text-center">
                      Mengalihkan ke halaman login dalam {countdown} detik...
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/login" className="flex-1">
                      <motion.button
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-3 flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-white rounded-lg font-medium transition-all"
                      >
                        <FiUser size={18} />
                        Login Sekarang
                      </motion.button>
                    </Link>
                    <Link href="/register" className="flex-1">
                      <motion.button
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-3 flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-600 border border-primary-600 text-primary-50 rounded-lg font-medium transition-all"
                      >
                        <FiLock size={18} />
                        Buat Akun
                      </motion.button>
                    </Link>
                  </div>
                  
                  {/* Cancel button */}
                  <div className="mt-4 text-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/')}
                      className="text-primary-400 hover:text-primary-200 text-sm flex items-center justify-center mx-auto gap-1"
                    >
                      <FiX size={14} />
                      Kembali ke beranda
                    </motion.button>
                  </div>
                </div>
                
                {/* Wave decoration at bottom */}
                <div className="h-8 bg-primary-700/30 relative overflow-hidden">
                  <motion.div
                    initial={{ backgroundPositionX: '0px' }}
                    animate={{ backgroundPositionX: '200px' }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' opacity='.25' fill='%233b82f6'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundSize: '1200px 100%'
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
