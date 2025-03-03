'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShare2, FiCopy, FiCheck, FiX } from 'react-icons/fi';
import { useChatContext } from '@/context/ChatContext';
import { saveConversationForSharing } from '@/lib/api';

export default function ShareButton() {
  const { conversationId, messages, generateShareableLink } = useChatContext();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      // Save conversation for sharing
      await saveConversationForSharing(conversationId, messages);
      
      // Generate shareable link
      const shareableLink = generateShareableLink();
      setShareUrl(shareableLink);
      
      // Open share modal
      setIsShareModalOpen(true);
    } catch (error) {
      console.error('Error sharing conversation:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy link:', err));
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleShare}
        disabled={isSharing || messages.length < 2}
        className={`p-2 rounded-full flex items-center justify-center transition-colors
          ${isSharing || messages.length < 2
            ? 'bg-dark-800 text-gray-500 cursor-not-allowed'
            : 'bg-dark-800 text-white/70 hover:text-white hover:bg-dark-700'
          }
        `}
        title="Share Conversation"
      >
        {isSharing ? (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <FiShare2 size={18} />
        )}
      </motion.button>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeShareModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-900 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-glow"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Share Conversation</h3>
                <button
                  onClick={closeShareModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <p className="text-gray-400 mb-4">
                Share this link with anyone to let them view this conversation:
              </p>
              
              <div className="flex items-center mb-6">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-grow py-2 px-3 bg-dark-800 border border-white/10 rounded-l-md text-white text-sm focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className={`py-2 px-3 ${
                    copied ? 'bg-green-600' : 'bg-accent'
                  } text-white rounded-r-md transition-colors`}
                >
                  {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                </button>
              </div>
              
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeShareModal}
                  className="py-2 px-4 bg-dark-800 text-white rounded-md hover:bg-dark-700 transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}