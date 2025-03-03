'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FiBookmark, FiCopy, FiSave } from 'react-icons/fi';
import MessageParser from '@/components/ui/MessageParser';
import MessageReactions from './MessageReactions';
import EmojiPicker from '@/components/ui/EmojiPicker';

export default function ChatHistory({ messages, isProcessing, isMobile = false, searchQuery = '', user }) {
  const lastMessageRef = useRef(null);
  const [bookmarkedMessages, setBookmarkedMessages] = useState({});
  
  // Load bookmarks from localStorage on component mount
  useEffect(() => {
    if (user) {
      try {
        const savedBookmarks = localStorage.getItem(`bookmarks_${user.id}`);
        if (savedBookmarks) {
          setBookmarkedMessages(JSON.parse(savedBookmarks));
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
    }
  }, [user]);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    if (user && Object.keys(bookmarkedMessages).length > 0) {
      localStorage.setItem(`bookmarks_${user.id}`, JSON.stringify(bookmarkedMessages));
    }
  }, [bookmarkedMessages, user]);

  // Scroll to the bottom when new messages are added
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Toggle bookmark for a message
  const toggleBookmark = (messageId) => {
    setBookmarkedMessages(prev => {
      const updated = {
        ...prev,
        [messageId]: !prev[messageId]
      };
      
      // Remove property if false to keep object clean
      if (!updated[messageId]) {
        delete updated[messageId];
      }
      
      return updated;
    });
  };
  
  // Copy message content
  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-accent text-white rounded-md shadow-lg text-sm z-50';
    toast.textContent = 'Message copied to clipboard!';
    document.body.appendChild(toast);
    
    // Remove toast after 2 seconds
    setTimeout(() => {
      toast.remove();
    }, 2000);
  };
  
  // Save all bookmarked messages
  const saveBookmarkedMessages = () => {
    if (!user) return;
    
    const bookmarked = messages.filter(msg => bookmarkedMessages[msg.id]);
    
    if (bookmarked.length === 0) {
      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-500 text-white rounded-md shadow-lg text-sm z-50';
      toast.textContent = 'No bookmarked messages to save!';
      document.body.appendChild(toast);
      
      // Remove toast after 2 seconds
      setTimeout(() => {
        toast.remove();
      }, 2000);
      return;
    }
    
    // Format bookmarked messages
    const content = bookmarked.map(msg => {
      return `[${msg.role === 'user' ? 'You' : 'AI Peter'}]: ${msg.content}\n`;
    }).join('\n');
    
    // Create a blob and download it
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarked_messages_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-green-500 text-white rounded-md shadow-lg text-sm z-50';
    toast.textContent = 'Bookmarked messages saved!';
    document.body.appendChild(toast);
    
    // Remove toast after 2 seconds
    setTimeout(() => {
      toast.remove();
    }, 2000);
  };
  
  // Highlight search matches
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    // Simple highlighting - in a real app you might want to use a proper lib
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-300/30 text-white px-0.5 rounded">{part}</mark> 
        : part
    );
  };

  // Get number of bookmarked messages
  const bookmarkedCount = Object.values(bookmarkedMessages).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Bookmarks manager (only shown if there are bookmarks) */}
      {bookmarkedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-primary-800/70 rounded-lg py-2 px-3 text-sm"
        >
          <div className="flex items-center text-primary-200">
            <FiBookmark className="text-yellow-400 mr-2" size={16} />
            <span>{bookmarkedCount} message{bookmarkedCount !== 1 ? 's' : ''} bookmarked</span>
          </div>
          <button
            onClick={saveBookmarkedMessages}
            className="flex items-center text-accent hover:text-accent-light"
          >
            <FiSave size={14} className="mr-1" />
            <span>Save</span>
          </button>
        </motion.div>
      )}
      
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const isUser = message.role === 'user';
        const isBookmarked = bookmarkedMessages[message.id] || false;
        
        return (
          <div
            key={message.id}
            ref={isLastMessage ? lastMessageRef : null}
            className="w-full"
          >
            {/* Message container with avatar */}
            <div className={`flex items-start gap-3 group px-1 ${isUser ? 'justify-start flex-row-reverse' : 'justify-start'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
                {isUser ? (
                  <div className="w-7 h-7 rounded-full bg-accent/80 flex items-center justify-center text-white text-xs font-medium">
                    {user ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white overflow-hidden">
                    <Image 
                      src="/images/avatar.svg" 
                      alt="AI" 
                      width={28} 
                      height={28} 
                      className="w-full h-full"
                    />
                  </div>
                )}
              </div>
              
              {/* Message content */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 max-w-[85%] relative group"
              >
                {/* Name & actions */}
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-primary-300">
                    {isUser ? (user ? user.name : 'You') : 'AI Peter'}
                  </div>
                  
                  {/* Message actions */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-1 text-primary-400 hover:text-primary-200 rounded"
                      title="Copy message"
                    >
                      <FiCopy size={14} />
                    </button>
                    <button
                      onClick={() => toggleBookmark(message.id)}
                      className={`p-1 rounded ${isBookmarked ? 'text-yellow-400' : 'text-primary-400 hover:text-primary-200'}`}
                      title={isBookmarked ? "Remove bookmark" : "Bookmark message"}
                    >
                      <FiBookmark size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Bookmark indicator */}
                {isBookmarked && (
                  <div className="absolute -left-1 -top-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                )}
                
                {/* Message bubble with enhanced parser for code */}
                <div 
                  className={`
                    rounded-lg text-sm leading-6
                    ${isUser 
                      ? 'bg-accent/10 text-primary-50' 
                      : message.isError
                        ? 'bg-red-500/10 text-primary-50 border border-red-500/30'
                        : 'bg-primary-800 text-primary-50'
                    }
                    px-4 py-3
                  `}
                >
                  <MessageParser content={
                    searchQuery ? highlightText(message.content, searchQuery) : message.content
                  } />
                </div>
                
                {/* Bottom info bar with timestamp and reactions */}
                <div className="flex items-center justify-between mt-1">
                  <div className="text-[10px] text-primary-400">
                    {formatDate(message.timestamp)}
                  </div>
                  
                  {/* Message reactions */}
                  <MessageReactions 
                    messageId={message.id} 
                    initialReactions={message.reactions || {}} 
                  />
                </div>
              </motion.div>
            </div>
          </div>
        );
      })}
      
      {/* Processing indicator (typing animation) */}
      {isProcessing && (
        <div className="w-full">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0 mr-2">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white overflow-hidden">
                <Image 
                  src="/images/avatar.svg" 
                  alt="AI" 
                  width={28} 
                  height={28} 
                  className="w-full h-full"
                />
              </div>
            </div>
            
            {/* Typing indicator */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <div className="text-xs font-medium mb-1 text-primary-300">
                AI Peter
              </div>
              
              <div className="flex items-center bg-primary-800 rounded-lg px-4 py-3 h-10">
                <div className="typing-animation flex">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
