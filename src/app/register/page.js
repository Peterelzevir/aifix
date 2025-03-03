'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, 
  FiArrowLeft, FiUser, FiCheck, FiX, FiShield
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const router = useRouter();
  const { register, isAuthenticated, login } = useAuth();

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  // Password strength validation
  const passwordStrength = {
    length: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const passwordScore = Object.values(passwordStrength).filter(Boolean).length;
  
  const passwordLevels = [
    { label: 'Sangat Lemah', color: 'bg-red-500' },
    { label: 'Lemah', color: 'bg-orange-500' },
    { label: 'Sedang', color: 'bg-yellow-500' },
    { label: 'Kuat', color: 'bg-green-500' },
    { label: 'Sangat Kuat', color: 'bg-green-600' }
  ];

  // Particles animation setup
  const totalParticles = 30;
  const particles = Array.from({ length: totalParticles }).map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10
  }));

  // Floating bubbles for the animation
  const bubbles = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    size: Math.random() * 80 + 40,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 30 + 15
  }));

  const nextStep = () => {
    if (step === 1) {
      // Validate first step
      if (!name || !email) {
        setError('Mohon lengkapi nama dan email Anda');
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Alamat email tidak valid');
        return;
      }
      
      setError('');
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
    setError('');
  };

  // Direct API registration function that matches the API route implementation
  const registerWithAPI = async (userData) => {
    try {
      // Validasi input data
      if (!userData?.email || !userData?.password || !userData?.name) {
        return { 
          success: false, 
          error: 'Semua data diperlukan (nama, email, dan password)' 
        };
      }

      // Format body request dengan konsisten
      const requestBody = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(), // Normalisasi email
        password: userData.password
      };

      // Request dengan header yang jelas
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // Identifikasi AJAX request
          'Cache-Control': 'no-cache, no-store' // Hindari caching
        },
        body: JSON.stringify(requestBody),
        credentials: 'include', // Pastikan cookie disertakan
        cache: 'no-store' // Hindari caching
      });
      
      // Parse response dengan penanganan error
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        return { 
          success: false, 
          error: 'Format response tidak valid' 
        };
      }
      
      // Periksa apakah request berhasil
      if (!response.ok) {
        const errorMessage = data?.message || 
          data?.error || 
          `Error ${response.status}: ${response.statusText}`;
        
        console.error('Registration failed:', { 
          status: response.status, 
          message: errorMessage,
          details: data?.details || 'No additional details'
        });
        
        throw new Error(errorMessage);
      }
      
      // Jika berhasil dan token tersedia
      if (data.token) {
        // Simpan token jika diperlukan
        localStorage.setItem('authToken', data.token);
        sessionStorage.setItem('userLoggedIn', 'true');
        
        // Gunakan login dari context jika tersedia (untuk auto-login)
        if (typeof login === 'function') {
          try {
            await login(userData.email, userData.password);
          } catch (loginError) {
            console.warn('Auto-login after registration failed:', loginError);
            // Tetap lanjutkan meskipun auto-login gagal
          }
        }
      }
      
      return { 
        success: true, 
        data,
        user: data.user
      };
    } catch (error) {
      console.error('Registration API error:', error);
      
      // Pesan error yang lebih spesifik
      let errorMessage = 'Terjadi kesalahan saat mendaftar';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
      } else if (error.message.includes('409') || error.message.toLowerCase().includes('conflict')) {
        errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Format permintaan tidak valid. Pastikan data yang dimasukkan benar.';
      }
      
      return { 
        success: false, 
        error: error.message || errorMessage
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validasi second step
    if (!password || !confirmPassword) {
      setError('Mohon lengkapi semua kolom password');
      return;
    }
    
    // Validasi minimal panjang password
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    // Validasi kecocokan password
    if (password !== confirmPassword) {
      setError('Password tidak cocok. Mohon periksa kembali');
      return;
    }
    
    // Validasi persetujuan syarat dan ketentuan
    if (!agreedToTerms) {
      setError('Anda harus menyetujui syarat dan ketentuan untuk mendaftar');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Siapkan data user dengan format yang konsisten
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
      };
      
      // Coba gunakan register dari AuthContext jika tersedia
      let result;
      
      if (typeof register === 'function') {
        try {
          result = await register(userData);
        } catch (contextError) {
          console.warn('Context register failed, using direct API', contextError);
          result = await registerWithAPI(userData);
        }
      } else {
        // Jika register tidak tersedia di context, gunakan direct API call
        result = await registerWithAPI(userData);
      }
      
      if (!result.success) {
        setError(result.error || 'Gagal mendaftar. Silakan coba lagi.');
        setIsLoading(false);
        return;
      }
      
      // Tampilkan animasi sukses
      setRegisterSuccess(true);
      
      // Log registrasi berhasil (opsional)
      console.log('Registration successful', { 
        email: userData.email, 
        name: userData.name,
        timestamp: new Date().toISOString() 
      });
      
      // Redirect setelah animasi sukses
      setTimeout(() => {
        router.push('/chat');
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-primary-900 relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-accent/20"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -500, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              delay: Math.random() * 20
            }}
          />
        ))}
        
        {/* Floating decorative bubbles */}
        {bubbles.map((bubble) => (
          <motion.div
            key={`bubble-${bubble.id}`}
            className="absolute rounded-full bg-accent/5 backdrop-blur-md"
            style={{
              width: bubble.size,
              height: bubble.size,
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
            }}
            animate={{
              x: [0, 20, 0, -20, 0],
              y: [0, -20, 0, 20, 0],
              scale: [1, 1.05, 1, 0.95, 1],
            }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Left Panel - Registration Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
        {/* Back to home link */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-6 left-6"
        >
          <Link href="/" className="flex items-center text-primary-300 hover:text-primary-200 gap-1 transition-colors">
            <FiArrowLeft size={16} />
            <span>Kembali ke beranda</span>
          </Link>
        </motion.div>
        
        <div className="w-full max-w-md">
          {/* Registration success animation */}
          <AnimatePresence>
            {registerSuccess ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="mb-10 flex flex-col items-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 1],
                    rotate: [0, 10, 0]
                  }}
                  transition={{ duration: 0.8, times: [0, 0.7, 1] }}
                  className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <FiCheck className="text-green-500" size={50} />
                  </motion.div>
                </motion.div>
                <h2 className="text-2xl font-bold text-primary-50 mb-2">Pendaftaran Berhasil!</h2>
                <p className="text-primary-300 text-center">Akun Anda telah dibuat. Mengalihkan ke halaman chat...</p>
                
                {/* Confetti effect */}
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={`confetti-${i}`}
                    initial={{ 
                      x: 0, 
                      y: 0,
                      opacity: 1,
                      scale: 0
                    }}
                    animate={{ 
                      x: Math.random() * 500 * (Math.random() > 0.5 ? 1 : -1), 
                      y: Math.random() * 500,
                      opacity: [1, 1, 0],
                      scale: [0, 1, 1],
                      rotate: Math.random() * 360
                    }}
                    transition={{ duration: 1.5 + Math.random() }}
                    className={`absolute w-2 ${Math.random() > 0.5 ? 'h-4' : 'h-6'} rounded-sm ${
                      ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'][Math.floor(Math.random() * 6)]
                    }`}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Registration header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-primary-50 mb-2">Daftar Akun Baru</h1>
                  <p className="text-primary-300">
                    Buat akun untuk mengakses fitur lengkap AI Peter
                  </p>
                </div>
                
                {/* Progress steps */}
                <div className="mb-8">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= 1 ? 'bg-accent text-white' : 'bg-primary-700 text-primary-400'
                      }`}>
                        <span>1</span>
                      </div>
                      <span className="text-xs mt-1 text-primary-300">Profil</span>
                    </div>
                    
                    <div className={`flex-1 h-1 mx-2 ${
                      step > 1 ? 'bg-accent' : 'bg-primary-700'
                    }`}></div>
                    
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= 2 ? 'bg-accent text-white' : 'bg-primary-700 text-primary-400'
                      }`}>
                        <span>2</span>
                      </div>
                      <span className="text-xs mt-1 text-primary-300">Keamanan</span>
                    </div>
                  </div>
                </div>
                
                {/* Registration form */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="bg-primary-800/40 backdrop-blur-sm border border-primary-700/50 rounded-xl p-6 shadow-xl"
                >
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center text-red-300 text-sm"
                    >
                      <FiAlertCircle className="flex-shrink-0 mr-2" size={18} />
                      <span>{error}</span>
                      <button 
                        onClick={() => setError('')}
                        className="ml-auto text-red-300 hover:text-red-200"
                      >
                        <FiX size={16} />
                      </button>
                    </motion.div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                      {step === 1 ? (
                        <motion.div
                          key="step1"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -20, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-5"
                        >
                          {/* Name Field */}
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-primary-200 mb-1">
                              Nama Lengkap
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUser className="text-primary-400" size={18} />
                              </div>
                              <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full bg-primary-700/40 border border-primary-600 rounded-lg py-3 pl-10 pr-3 text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                                placeholder="John Doe"
                                required
                              />
                            </div>
                          </div>
                          
                          {/* Email Field */}
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-primary-200 mb-1">
                              Alamat Email
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiMail className="text-primary-400" size={18} />
                              </div>
                              <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full bg-primary-700/40 border border-primary-600 rounded-lg py-3 pl-10 pr-3 text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                                placeholder="email@example.com"
                                required
                              />
                            </div>
                          </div>
                          
                          {/* Next Button */}
                          <div className="pt-2">
                            <motion.button
                              type="button"
                              onClick={nextStep}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-accent hover:bg-accent-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all"
                            >
                              Lanjut
                            </motion.button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="step2"
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 20, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-5"
                        >
                          {/* Password Field */}
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-primary-200 mb-1">
                              Password
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="text-primary-400" size={18} />
                              </div>
                              <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full bg-primary-700/40 border border-primary-600 rounded-lg py-3 pl-10 pr-10 text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                                placeholder="••••••••"
                                required
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <FiEyeOff className="text-primary-400 hover:text-primary-200" size={18} />
                                ) : (
                                  <FiEye className="text-primary-400 hover:text-primary-200" size={18} />
                                )}
                              </button>
                            </div>
                            
                            {/* Password strength indicator */}
                            {password && (
                              <div className="mt-2">
                                <div className="flex space-x-1 mb-1">
                                  {[...Array(4)].map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`h-1.5 flex-1 rounded-full ${
                                        i < passwordScore 
                                          ? passwordLevels[passwordScore - 1].color
                                          : 'bg-primary-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className={passwordScore > 0 ? passwordLevels[passwordScore - 1].color.replace('bg-', 'text-') : 'text-primary-400'}>
                                    {passwordScore > 0 ? passwordLevels[passwordScore - 1].label : 'Masukkan password'}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                  <div className={`flex items-center ${passwordStrength.length ? 'text-green-400' : 'text-primary-400'}`}>
                                    {passwordStrength.length ? (
                                      <FiCheck size={12} className="mr-1" />
                                    ) : (
                                      <span className="w-3 h-3 mr-1">·</span>
                                    )}
                                    Min. 8 karakter
                                  </div>
                                  <div className={`flex items-center ${passwordStrength.hasLetter ? 'text-green-400' : 'text-primary-400'}`}>
                                    {passwordStrength.hasLetter ? (
                                      <FiCheck size={12} className="mr-1" />
                                    ) : (
                                      <span className="w-3 h-3 mr-1">·</span>
                                    )}
                                    Huruf
                                  </div>
                                  <div className={`flex items-center ${passwordStrength.hasNumber ? 'text-green-400' : 'text-primary-400'}`}>
                                    {passwordStrength.hasNumber ? (
                                      <FiCheck size={12} className="mr-1" />
                                    ) : (
                                      <span className="w-3 h-3 mr-1">·</span>
                                    )}
                                    Angka
                                  </div>
                                  <div className={`flex items-center ${passwordStrength.hasSpecial ? 'text-green-400' : 'text-primary-400'}`}>
                                    {passwordStrength.hasSpecial ? (
                                      <FiCheck size={12} className="mr-1" />
                                    ) : (
                                      <span className="w-3 h-3 mr-1">·</span>
                                    )}
                                    Karakter khusus
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Confirm Password Field */}
                          <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-primary-200 mb-1">
                              Konfirmasi Password
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiShield className="text-primary-400" size={18} />
                              </div>
                              <input
                                id="confirm-password"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`block w-full bg-primary-700/40 border ${
                                  confirmPassword && password !== confirmPassword
                                    ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50'
                                    : 'border-primary-600 focus:ring-accent/50 focus:border-accent/50'
                                } rounded-lg py-3 pl-10 pr-3 text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 transition-all`}
                                placeholder="••••••••"
                                required
                              />
                              
                              {confirmPassword && password !== confirmPassword && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                  <FiAlertCircle className="text-red-500" size={18} />
                                </div>
                              )}
                            </div>
                            
                            {confirmPassword && password !== confirmPassword && (
                              <p className="mt-1 text-xs text-red-400">Password tidak cocok</p>
                            )}
                          </div>
                          
                          {/* Terms and Conditions */}
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="terms"
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="h-4 w-4 rounded border-primary-600 text-accent focus:ring-accent/30 bg-primary-700"
                                required
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="terms" className="text-primary-300">
                                Saya menyetujui <a href="#" className="text-accent hover:text-accent-light hover:underline">Syarat dan Ketentuan</a> serta <a href="#" className="text-accent hover:text-accent-light hover:underline">Kebijakan Privasi</a>
                              </label>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="pt-2 flex gap-3">
                            <motion.button
                              type="button"
                              onClick={prevStep}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex-1 py-3 px-4 border border-primary-600 rounded-lg text-base font-medium text-primary-200 bg-primary-700/40 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                            >
                              Kembali
                            </motion.button>
                            
                            <motion.button
                              type="submit"
                              disabled={isLoading}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-accent hover:bg-accent-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all
                              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isLoading ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </>
                              ) : 'Daftar'}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </motion.div>
                
                {/* Login link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mt-6 text-center"
                >
                  <p className="text-primary-300">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="text-accent hover:text-accent-light font-medium transition-colors">
                      Login sekarang
                    </Link>
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel - Decorative for larger screens */}
      <div className="hidden md:flex md:w-2/5 bg-primary-800/40 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-10"
          >
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-full bg-accent/20 blur-xl"></div>
              <Image 
                src="/images/logo.svg" 
                alt="AI Peter Logo"
                width={100}
                height={100}
                className="relative z-10"
              />
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-6 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-50 to-accent"
            >
              Gabung Sekarang
            </motion.h2>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="mt-2 text-primary-300 text-center max-w-xs"
            >
              Daftarkan diri Anda untuk mendapatkan pengalaman chat AI yang lebih personal dan powerful
            </motion.p>
            
            <div className="mt-12 space-y-6 w-full max-w-xs">
              {/* Feature bullets */}
              {[
                "Simpan semua riwayat percakapan",
                "Personalisasi preferensi AI Anda",
                "Akses ke fitur premium",
                "Prioritas layanan tanpa antrian"
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.1 + (i * 0.2), duration: 0.5 }}
                  className="flex items-center"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mr-3">
                    <FiCheck className="text-accent" />
                  </div>
                  <p className="text-primary-200">{feature}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Decorative elements */}
          <motion.div 
            className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full bg-accent/5 blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.7, 0.5] 
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          />
        </div>
      </div>
    </div>
  );
}