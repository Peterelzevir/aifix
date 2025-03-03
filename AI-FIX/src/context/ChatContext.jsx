'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchAIResponse } from '@/lib/api';

const ChatContext = createContext();

export function useChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [conversationId, setConversationId] = useState('');
  
  // Initialize a new conversation if there's none
  useEffect(() => {
    if (!conversationId) {
      setConversationId(uuidv4());
    }
    
    // Load messages from localStorage if available
    const loadedMessages = localStorage.getItem(`chat_${conversationId}`);
    if (loadedMessages) {
      setMessages(JSON.parse(loadedMessages));
    } else if (messages.length === 0) {
      // Add welcome message if this is a new conversation
      setMessages([
        {
          id: uuidv4(),
          role: 'assistant',
          content: "Hello there! I'm AI Peter. How can I assist you today?",
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [conversationId]);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      localStorage.setItem(`chat_${conversationId}`, JSON.stringify(messages));
    }
  }, [messages, conversationId]);

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;
    
    // Add user message to the chat
    const userMessageObj = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessageObj]);
    
    // Show typing indicator
    setIsProcessing(true);
    
    try {
      // Call AI API
      const aiResponse = await fetchAIResponse(userMessage);
      
      // Add AI response to the chat
      const aiMessageObj = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessageObj]);
      
      return aiMessageObj; // Return the message for voice handling
    } catch (error) {
      console.error('Error fetching AI response:', error);
      
      // Add error message
      const errorMessageObj = {
        id: uuidv4(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        isError: true,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
      return errorMessageObj;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearConversation = useCallback(() => {
    const newConversationId = uuidv4();
    setConversationId(newConversationId);
    setMessages([
      {
        id: uuidv4(),
        role: 'assistant',
        content: "Hello there! I'm AI Peter. How can I assist you today?",
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const generateShareableLink = useCallback(() => {
    return `${window.location.origin}/share/${conversationId}`;
  }, [conversationId]);

  const toggleVoiceMode = useCallback(() => {
    setIsVoiceMode(prev => !prev);
  }, []);

  const value = {
    messages,
    isProcessing,
    isVoiceMode,
    conversationId,
    sendMessage,
    clearConversation,
    generateShareableLink,
    toggleVoiceMode
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}