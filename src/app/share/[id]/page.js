'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FiArrowLeft, FiMessageCircle, FiLoader } from 'react-icons/fi';
import { getSharedConversation } from '@/lib/api';
import Image from 'next/image';

export default function ChatPreviewPage() {
  const { id: conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const conversationData = await getSharedConversation(conversationId);
        
        if (conversationData) {
          setMessages(conversationData);
        } else {
          setError('Conversation not found');
        }
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError('Failed to load the conversation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId]);

  // Format timestamp for display
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 p-3 flex items-center justify-between">
        <Link href="/" className="flex items-center text-white hover:text-accent transition-colors">
          <FiArrowLeft className="mr-2" />
          <span className="text-sm md:text-base">Back to Home</span>
        </Link>
        
        <Link href="/chat">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 md:px-4 md:py-2 bg-accent text-white rounded-full text-xs md:text-sm flex items-center"
          >
            <FiMessageCircle className="mr-1 md:mr-2" />
            <span>Try AI Peter Now</span>
          </motion.button>
        </Link>
      </div>
      
      <div className="flex-grow container mx-auto px-4 py-20 max-w-3xl">
        {/* Shared Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-dark-900/80 border border-white/10 rounded-xl overflow-hidden shadow-xl"
        >
          {/* Preview Header */}
          <div className="border-b border-white/10 p-4 bg-black/60">
            <div className="flex items-center">
              <motion.div
                initial={{ rotate: -5 }}
                animate={{ rotate: 5 }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
                className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-medium mr-3 overflow-hidden"
              >
                <Image 
                  src="/images/avatar.svg" 
                  alt="AI Peter" 
                  width={40} 
                  height={40} 
                  className="w-full h-full"
                />
              </motion.div>
              <div>
                <h1 className="text-white font-medium">Shared AI Peter Conversation</h1>
                <p className="text-xs text-gray-400">Read-only preview</p>
              </div>
            </div>
          </div>
          
          {/* Content area */}
          <div className="p-4 md:p-6 min-h-[300px] bg-gradient-to-b from-black to-dark-900">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-64">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="mb-4"
                >
                  <FiLoader size={32} className="text-accent" />
                </motion.div>
                <p className="text-gray-400">Loading conversation...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 px-4 rounded-lg bg-dark-800/50">
                <Image 
                  src="/images/avatar.svg" 
                  alt="AI Peter" 
                  width={60} 
                  height={60} 
                  className="mx-auto mb-6 opacity-40"
                />
                <p className="mb-4 text-lg text-red-400">{error}</p>
                <p className="text-gray-400 max-w-md mx-auto">This conversation may have expired or doesn't exist. Try starting a new conversation with AI Peter.</p>
                <Link href="/chat">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-6 px-6 py-2 bg-accent text-white rounded-full text-sm hover:bg-accent-light transition-colors"
                  >
                    Start New Chat
                  </motion.button>
                </Link>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-5">
                  {messages.map((message, index) => {
                    const isUser = message.role === 'user';
                    
                    return (
                      <motion.div
                        key={message.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] sm:max-w-[75%] flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
                          {/* Avatar - only show for assistant */}
                          {!isUser && (
                            <div className="w-8 h-8 rounded-full bg-accent flex-shrink-0 flex items-center justify-center text-white text-xs overflow-hidden">
                              <Image 
                                src="/images/avatar.svg" 
                                alt="AI" 
                                width={32} 
                                height={32} 
                                className="w-full h-full"
                              />
                            </div>
                          )}
                          
                          {/* Message content */}
                          <div>
                            <div 
                              className={`
                                px-4 py-3 rounded-2xl
                                ${isUser 
                                  ? 'bg-accent text-white rounded-tr-none' 
                                  : message.isError
                                    ? 'bg-red-500/20 text-white border border-red-500/40 rounded-tl-none'
                                    : 'bg-dark-800 text-white border border-white/10 rounded-tl-none'
                                }
                              `}
                            >
                              {message.content}
                            </div>
                            
                            {/* Timestamp */}
                            <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                              {formatDate(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-white/10 p-4 bg-black flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs sm:text-sm text-gray-400">
              This is a read-only preview of a shared conversation
            </div>
            <Link href="/chat">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 bg-accent text-white rounded-full text-sm w-full sm:w-auto"
              >
                Start Your Own Chat
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
