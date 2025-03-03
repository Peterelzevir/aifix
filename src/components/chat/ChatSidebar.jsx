'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMessageSquare, FiTrash2, FiEdit2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useChatContext } from '@/context/ChatContext';

export default function ChatSidebar({ isOpen, toggleSidebar, isMobile }) {
  const { 
    conversationId, 
    clearConversation, 
    messages, 
    loadConversation,
    allConversations,
    deleteConversation
  } = useChatContext();
  
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('');
  
  // Generate title from first message
  const getConversationTitle = (msgs) => {
    if (!msgs || msgs.length < 2) return 'New conversation';
    // Use the first user message as the title, truncated
    const firstUserMessage = msgs.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New conversation';
    
    const title = firstUserMessage.content.substring(0, 30);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  };
  
  // Start editing a conversation title
  const startEditing = (id, title) => {
    setEditingConversationId(id);
    setConversationTitle(title);
  };
  
  // Save edited conversation title
  const saveTitle = (id) => {
    // Would normally update the title in the context/database
    setEditingConversationId(null);
  };
  
  // Handle creating a new conversation
  const handleNewConversation = () => {
    clearConversation();
    if (isMobile) {
      toggleSidebar();
    }
  };
  
  // Handle loading a saved conversation
  const handleLoadConversation = (id) => {
    loadConversation(id);
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: isMobile ? '-100%' : '-350px' }}
          animate={{ x: 0 }}
          exit={{ x: isMobile ? '-100%' : '-350px' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`
            fixed top-0 left-0 z-20 bg-primary-800 border-r border-primary-700
            h-full w-full sm:w-80 pt-16
            ${isMobile ? 'pt-16' : 'pt-20'}
          `}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary-700">
              <h2 className="text-lg font-medium text-primary-50">Conversations</h2>
              <button 
                onClick={handleNewConversation}
                className="p-2 bg-accent rounded-full text-white hover:bg-accent-light transition-colors"
                aria-label="New chat"
              >
                <FiPlus size={18} />
              </button>
            </div>
            
            {/* Conversations List */}
            <div className="flex-grow overflow-y-auto p-2">
              {allConversations && allConversations.length > 0 ? (
                <div className="space-y-2">
                  {allConversations.map((conv) => (
                    <div 
                      key={conv.id}
                      className={`
                        relative p-3 rounded-lg border 
                        ${conv.id === conversationId 
                          ? 'bg-primary-700 border-accent/50' 
                          : 'border-transparent hover:bg-primary-700/50'
                        } 
                        transition-colors cursor-pointer group
                      `}
                      onClick={() => handleLoadConversation(conv.id)}
                    >
                      <div className="flex items-start">
                        <FiMessageSquare 
                          size={16} 
                          className="text-primary-300 mt-1 mr-2 flex-shrink-0" 
                        />
                        
                        {editingConversationId === conv.id ? (
                          <div className="flex-grow">
                            <input
                              type="text"
                              value={conversationTitle}
                              onChange={(e) => setConversationTitle(e.target.value)}
                              onBlur={() => saveTitle(conv.id)}
                              onKeyDown={(e) => e.key === 'Enter' && saveTitle(conv.id)}
                              className="w-full bg-primary-900 border border-primary-600 rounded px-2 py-1 text-sm text-primary-50"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : (
                          <div className="flex-grow pr-6 text-sm">
                            <div className="text-primary-50 line-clamp-1">
                              {getConversationTitle(conv.messages)}
                            </div>
                            <div className="text-xs text-primary-400 mt-1">
                              {new Date(conv.lastUpdated).toLocaleDateString()} · {conv.messages.length - 1} messages
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(conv.id, getConversationTitle(conv.messages));
                          }}
                          className="p-1 text-primary-400 hover:text-primary-50 transition-colors"
                          aria-label="Edit title"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="p-1 text-primary-400 hover:text-red-400 transition-colors"
                          aria-label="Delete conversation"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="bg-primary-700/50 rounded-full p-4 mb-4">
                    <FiMessageSquare size={28} className="text-primary-300" />
                  </div>
                  <p className="text-primary-300 text-sm">No conversations yet</p>
                  <p className="text-primary-400 text-xs mt-2">Start a new chat to begin</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-primary-700">
              <div className="text-xs text-primary-400 text-center">
                AI Peter © 2024
              </div>
            </div>
            
            {/* Mobile close button */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-primary-700 rounded-r-full p-1 border border-primary-600"
                aria-label="Close sidebar"
              >
                <FiChevronLeft size={20} className="text-primary-300" />
              </button>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Toggle button (only visible on desktop) */}
      {!isMobile && (
        <motion.button
          animate={{ x: isOpen ? 288 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={toggleSidebar}
          className="fixed top-24 left-4 z-20 bg-primary-700 rounded-full p-1 border border-primary-600 shadow-md"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
