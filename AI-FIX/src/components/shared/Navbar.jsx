'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import Image from 'next/image';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle link click with transition
  const handleLinkClick = () => {
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
    setIsOpen(false);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Chat with AI Peter', path: '/chat' },
  ];

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
        ? 'py-2 bg-black/80 shadow-md backdrop-blur-md' 
        : 'py-3 sm:py-4 bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-white font-bold text-lg sm:text-xl flex items-center" onClick={handleLinkClick}>
          <motion.div
            initial={{ rotate: -5 }}
            animate={{ rotate: 5 }}
            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
            className="w-7 h-7 sm:w-8 sm:h-8 mr-2 rounded-full overflow-hidden flex-shrink-0"
          >
            <Image 
              src="/images/logo.svg" 
              alt="AI Peter Logo"
              width={32}
              height={32}
              className="w-full h-full"
            />
          </motion.div>
          <span className="bg-gradient-to-r from-white to-accent-light bg-clip-text text-transparent">
            Peter
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              className={`
                relative text-sm font-medium transition-colors duration-300
                ${pathname === item.path ? 'text-accent' : 'text-white/80 hover:text-white'}
              `}
              onClick={handleLinkClick}
            >
              {item.name}
              {pathname === item.path && (
                <motion.div
                  layoutId="underline"
                  className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent"
                  initial={false}
                />
              )}
            </Link>
          ))}
          
          <Link href="/chat" onClick={handleLinkClick}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="ml-2 px-4 py-2 bg-accent text-white rounded-full text-sm font-medium transition-all hover:shadow-glow"
            >
              Try AI Peter Now
            </motion.button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-black/95 overflow-hidden border-b border-white/10"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  href={item.path}
                  onClick={handleLinkClick}
                  className={`
                    text-sm font-medium py-2 px-2 rounded-lg transition-colors duration-300
                    ${pathname === item.path 
                      ? 'text-white bg-accent/10 border border-accent/30' 
                      : 'text-white/80 hover:bg-white/5'
                    }
                  `}
                >
                  {item.name}
                </Link>
              ))}
              <Link href="/chat" onClick={handleLinkClick}>
                <button className="w-full py-3 bg-accent text-white rounded-md text-sm font-medium transition-all mt-2">
                  Try AI Peter Now
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </nav>
  );
}
