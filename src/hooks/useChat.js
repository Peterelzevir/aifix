'use client';

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchAIResponse } from '@/lib/api';
import { getConversation, saveConversation } from '@/lib/storage';

export default function useChat(initialConversationId = null) {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId || uuidv4());
  const [error, setError] = useState(null);

  // Load messages when conversation ID changes
  useEffect(() => {
    if (conversationId) {
      const savedMessages = getConversation(conversationId);
      
      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages);
      } else if (messages.length === 0) {
        // Add welcome message for new conversations
        const welcomeMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: "Hello there! I'm AI Peter. How can I assist you today?",
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        saveConversation(conversationId, [welcomeMessage]);
      }
    }
  }, [conversationId]);

  // Save messages when they change
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      saveConversation(conversationId, messages);
    }
  }, [messages, conversationId]);

  // Send a message to the AI
  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return null;
    setError(null);
    
    // Create user message object
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    // Add to messages
    setMessages(prev => [...prev, userMessage]);
    
    // Set processing state
    setIsProcessing(true);
    
    try {
      // Call API
      const response = await fetchAIResponse(content);
      
      // Create AI message object
      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      
      // Add to messages
      setMessages(prev => [...prev, aiMessage]);
      return aiMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to get response');
      
      // Create error message
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        isError: true,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return errorMessage;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Start a new conversation
  const newConversation = useCallback(() => {
    const newId = uuidv4();
    setConversationId(newId);
    setMessages([]);
    setError(null);
    return newId;
  }, []);

  return {
    messages,
    isProcessing,
    conversationId,
    error,
    sendMessage,
    newConversation,
    setMessages
  };
}