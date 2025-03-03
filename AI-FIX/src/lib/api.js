import axios from 'axios';

/**
 * Fetch AI response from the API
 * @param {string} text - User input text
 * @returns {Promise<string>} AI response text
 */
export async function fetchAIResponse(text) {
  try {
    // Fetch from the specified API
    const response = await axios.get(`https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(text)}`);
    
    // Extract the answer from the response
    if (response.data && response.data.answer) {
      return response.data.answer;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error('Error fetching AI response:', error);
    throw error;
  }
}

/**
 * Mocked function to simulate saving a conversation for sharing
 * In a real app, this would save to a database
 * @param {string} conversationId - The UUID of the conversation
 * @param {Array} messages - Array of message objects
 * @returns {Promise<string>} The shareable URL
 */
export async function saveConversationForSharing(conversationId, messages) {
  // In a real implementation, this would save to a database
  // For now, we'll just use localStorage as a mock
  localStorage.setItem(`shared_${conversationId}`, JSON.stringify(messages));
  
  // Return the URL that would point to this conversation
  return `/share/${conversationId}`;
}

/**
 * Get a shared conversation by ID
 * @param {string} conversationId - The UUID of the conversation
 * @returns {Promise<Array>} Array of message objects or null if not found
 */
export async function getSharedConversation(conversationId) {
  // In a real implementation, this would fetch from a database
  // For now, we'll just use localStorage as a mock
  const conversation = localStorage.getItem(`shared_${conversationId}`) || 
                       localStorage.getItem(`chat_${conversationId}`);
  
  if (conversation) {
    return JSON.parse(conversation);
  }
  
  return null;
}