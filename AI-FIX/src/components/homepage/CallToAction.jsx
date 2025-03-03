'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

export default function CallToAction() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section 
      className="py-20 relative overflow-hidden bg-primary-900"
      ref={ref}
    >
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <motion.div 
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.4) 0%, transparent 25%), radial-gradient(circle at 85% 30%, rgba(99, 102, 241, 0.4) 0%, transparent 25%)',
            backgroundSize: '80% 80%',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="mb-6 mx-auto"
          >
            <Image 
              src="/images/logo.svg" 
              alt="AI Peter Logo"
              width={80}
              height={80}
              className="mx-auto"
            />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-50 to-accent-light bg-clip-text text-transparent"
          >
            Ready to experience next-gen AI conversation?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-primary-300 mb-10 text-lg leading-relaxed"
          >
            Start chatting with AI Peter today and discover the future of intelligent conversation assistants.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/chat">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-accent hover:bg-accent-light text-white rounded-lg font-medium text-lg transition-all duration-300 shadow-glow"
              >
                Try AI Peter Now
              </motion.button>
            </Link>
            
            <p className="mt-4 text-sm text-primary-400">
              No sign-up required. Start chatting immediately.
            </p>
          </motion.div>
        </div>
        
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 grid md:grid-cols-3 gap-6"
        >
          <div className="bg-primary-800 rounded-xl p-6 text-center border border-primary-700/30 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className="text-4xl font-bold text-primary-50 mb-2"
            >
              1000+
            </motion.div>
            <div className="text-primary-300">Conversations Daily</div>
          </div>
          
          <div className="bg-primary-800 rounded-xl p-6 text-center border border-primary-700/30 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className="text-4xl font-bold text-primary-50 mb-2"
            >
              95%
            </motion.div>
            <div className="text-primary-300">Satisfaction Rate</div>
          </div>
          
          <div className="bg-primary-800 rounded-xl p-6 text-center border border-primary-700/30 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className="text-4xl font-bold text-primary-50 mb-2"
            >
              24/7
            </motion.div>
            <div className="text-primary-300">Always Available</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
