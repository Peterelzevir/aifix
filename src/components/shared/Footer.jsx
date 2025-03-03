'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-white/10 py-6 sm:py-8 bg-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1">
            <Link href="/" className="text-white font-bold text-xl flex items-center">
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
            <p className="mt-3 text-sm text-gray-400 max-w-md">
              AI Peter is a super modern AI chatbot designed to provide natural conversations through text and voice interfaces.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-base font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  Try AI Peter
                </Link>
              </li>
              <li>
                <Link href="/#features" className="text-gray-400 hover:text-accent text-sm transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="col-span-1">
            <h3 className="text-base font-semibold text-white mb-3">Connect</h3>
            <div className="flex space-x-3">
              <motion.a 
                href="https://github.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-accent transition-colors"
              >
                <FiGithub size={16} />
              </motion.a>
              <motion.a 
                href="https://t.me/hiyaok" 
                target="_blank" 
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-accent transition-colors"
              >
                <FiTwitter size={16} />
              </motion.a>
              <motion.a 
                href="https://t.me/hiyaok" 
                target="_blank" 
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-accent transition-colors"
              >
                <FiLinkedin size={16} />
              </motion.a>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-xs text-gray-500">
            © {currentYear} AI Peter. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
