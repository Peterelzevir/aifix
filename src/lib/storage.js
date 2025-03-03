/**
 * Storage utilities for managing chat conversations and user preferences
 */

// Get a conversation by ID
export const getConversation = (conversationId) => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const data = localStorage.getItem(`chat_${conversationId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving conversation:', error);
    return null;
  }
};

// Save a conversation
export const saveConversation = (conversationId, messages) => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem(`chat_${conversationId}`, JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('Error saving conversation:', error);
    return false;
  }
};

// Delete a conversation
export const deleteConversation = (conversationId) => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.removeItem(`chat_${conversationId}`);
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
};

// Get all conversation IDs
export const getAllConversationIds = () => {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith('chat_'))
      .map(key => key.replace('chat_', ''));
  } catch (error) {
    console.error('Error retrieving conversation IDs:', error);
    return [];
  }
};

// Save user preferences
export const saveUserPreferences = (preferences) => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
};

// Get user preferences
export const getUserPreferences = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const data = localStorage.getItem('user_preferences');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving user preferences:', error);
    return null;
  }
};