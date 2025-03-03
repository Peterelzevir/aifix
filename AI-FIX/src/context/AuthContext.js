'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Authentication context
const AuthContext = createContext(undefined);

// Auth state storage keys with app-specific prefix for better isolation
const APP_PREFIX = 'ai-peter-';
const AUTH_TOKEN_KEY = `${APP_PREFIX}auth-token`;
const AUTH_USER_KEY = `${APP_PREFIX}auth-user`;
const AUTH_EXPIRY_KEY = `${APP_PREFIX}auth-expiry`;

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [tokenRefreshTimer, setTokenRefreshTimer] = useState(null);
  
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Create consistent headers for API requests with better security
   */
  const createHeaders = useCallback((additionalHeaders = {}, includeToken = true) => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      'Cache-Control': 'no-cache, no-store', // Prevent caching of auth requests
      ...additionalHeaders
    };

    // Add Auth token if available and requested
    if (includeToken && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }, [token]);

  /**
   * Handle API response with better error handling
   */
  const handleApiResponse = async (response) => {
    // Check for non-JSON responses
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      } else {
        const errorText = await response.text();
        console.error('Non-JSON error response:', errorText.substring(0, 200));
        throw new Error(`Server error (${response.status}): ${response.statusText || 'Request failed'}`);
      }
    }
    
    try {
      return await response.json();
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Gagal memproses respons dari server');
    }
  };

  /**
   * Save authentication data to storage with better security
   */
  const saveAuthData = useCallback((userData, authToken, expiryTime) => {
    try {
      if (userData) {
        const sanitizedUser = { ...userData };
        // Make sure we don't store sensitive data
        delete sanitizedUser.password;
        delete sanitizedUser.passwordHash;
        
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sanitizedUser));
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(sanitizedUser));
      }
      
      if (authToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        sessionStorage.setItem(AUTH_TOKEN_KEY, authToken);
      }
      
      if (expiryTime) {
        localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
        sessionStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
      }
    } catch (error) {
      console.error('Error saving auth data:', error);
      // Continue even if storage fails - cookies will still work
    }
  }, []);

  /**
   * Clear authentication data from storage
   */
  const clearAuthData = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_EXPIRY_KEY);
      
      sessionStorage.removeItem(AUTH_USER_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_EXPIRY_KEY);
      
      // Clear any token refresh timer
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
        setTokenRefreshTimer(null);
      }
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }, [tokenRefreshTimer]);

  /**
   * Setup a timer to refresh the token before it expires
   */
  const setupTokenRefresh = useCallback((expiryTime) => {
    if (!expiryTime) return;
    
    // Clear any existing timer
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }
    
    const expiryDate = new Date(expiryTime).getTime();
    const now = Date.now();
    
    // If already expired, don't set up a refresh
    if (expiryDate <= now) return;
    
    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(0, expiryDate - now - (5 * 60 * 1000));
    
    console.log(`Setting up token refresh in ${Math.floor(refreshTime / 1000 / 60)} minutes`);
    
    const timer = setTimeout(() => {
      checkAuthStatus(true); // Force refresh
    }, refreshTime);
    
    setTokenRefreshTimer(timer);
    
    return () => clearTimeout(timer);
  }, [tokenRefreshTimer]);

  /**
   * Check authentication status from the API with better error handling
   */
  const checkAuthStatus = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Try to get saved token and user (as fallback)
      const savedToken = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
      const savedUserJson = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
      let savedUser = null;
      
      try {
        if (savedUserJson) {
          savedUser = JSON.parse(savedUserJson);
        }
      } catch (error) {
        console.warn('Error parsing saved user data:', error);
      }
      
      // Update state with saved data while we check with the server
      if (savedToken && !token) {
        setToken(savedToken);
      }
      
      if (savedUser && !user) {
        setUser(savedUser);
      }
      
      // Check auth status from the API (uses HTTP-only cookie by default)
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: createHeaders({
          'Pragma': 'no-cache', // Further prevent caching
        }, !!savedToken),
        credentials: 'include', // Important for cookies
        cache: 'no-store', // Prevent caching
        ...(forceRefresh ? { signal: AbortSignal.timeout(10000) } : {}) // Timeout for force refresh
      });
      
      if (!response.ok) {
        // If not authenticated
        setUser(null);
        setToken(null);
        clearAuthData();
        return false;
      }
      
      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        
        // If token was returned (token refresh)
        if (data.token) {
          setToken(data.token);
          
          // Calculate token expiry - default to 24 hours if not provided
          const expiryTime = data.expiresIn ? 
            new Date(Date.now() + (parseInt(data.expiresIn) * 1000)).getTime() : 
            new Date(Date.now() + (24 * 60 * 60 * 1000)).getTime();
          
          saveAuthData(data.user, data.token, expiryTime);
          setupTokenRefresh(expiryTime);
        } else {
          // Just save the user data if using cookie-based auth
          saveAuthData(data.user, savedToken);
        }
        return true;
      } else {
        setUser(null);
        setToken(null);
        clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      
      // If force refresh failed, but we have saved data, keep the user logged in
      if (forceRefresh && user) {
        console.log('Force refresh failed, but keeping user logged in with saved data');
        return true;
      }
      
      setUser(null);
      setToken(null);
      clearAuthData();
      return false;
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  }, [clearAuthData, createHeaders, saveAuthData, setupTokenRefresh, token, user]);

  // Check authentication on component mount and window focus
  useEffect(() => {
    // Initial check
    checkAuthStatus();
    
    // Set up event listener for storage changes (for multi-tab support)
    const handleStorageChange = (e) => {
      if (e.key === AUTH_TOKEN_KEY || e.key === AUTH_USER_KEY) {
        checkAuthStatus();
      }
    };
    
    // Set up event listener for window focus (to refresh auth state)
    const handleFocus = () => {
      checkAuthStatus();
    };
    
    // Set up event listener for network status changes
    const handleOnline = () => {
      console.log('Network connection restored, checking auth status');
      checkAuthStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      
      // Clean up token refresh timer
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
      }
    };
  }, [checkAuthStatus, tokenRefreshTimer]);

  /**
   * Login function with improved error handling and security
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} remember - Whether to remember the user
   * @returns {Promise<Object>} Login result
   */
  const login = async (email, password, remember = false) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Format request body consistently
      const requestBody = {
        email: email.trim().toLowerCase(),
        password,
        remember: !!remember
      };
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: createHeaders({}, false), // Don't include token for login
        credentials: 'include', // Important for cookies
        body: JSON.stringify(requestBody),
        cache: 'no-store'
      });
      
      const data = await handleApiResponse(response);
      
      if (!data.success) {
        throw new Error(data.message || 'Login gagal');
      }
      
      setUser(data.user);
      
      // Calculate token expiry if provided
      let expiryTime = null;
      if (data.expiresIn) {
        expiryTime = new Date(Date.now() + (parseInt(data.expiresIn) * 1000)).getTime();
      } else if (remember) {
        // Default to 30 days if remember and no expiry provided
        expiryTime = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).getTime();
      } else {
        // Default to 1 day if not remember
        expiryTime = new Date(Date.now() + (24 * 60 * 60 * 1000)).getTime();
      }
      
      // Save token if available
      if (data.token) {
        setToken(data.token);
        saveAuthData(data.user, data.token, expiryTime);
        setupTokenRefresh(expiryTime);
      } else {
        // Otherwise just save the user data if using cookie-based auth
        saveAuthData(data.user, null, expiryTime);
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message);
      return { 
        success: false, 
        error: error.message || 'Terjadi kesalahan saat login' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register function with improved error handling
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Format request body consistently
      const requestBody = {
        name: userData.name?.trim(),
        email: userData.email?.trim().toLowerCase(),
        password: userData.password
      };
      
      // Remove any sensitive fields from logging
      const logSafeData = { ...requestBody };
      if (logSafeData.password) logSafeData.password = '[REDACTED]';
      console.log('Registering user with data:', logSafeData);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: createHeaders({}, false), // Don't include token for register
        credentials: 'include', // Important for cookies
        body: JSON.stringify(requestBody),
        cache: 'no-store'
      });
      
      const data = await handleApiResponse(response);
      
      if (!data.success) {
        throw new Error(data.message || 'Pendaftaran gagal');
      }
      
      console.log('Registration successful');
      
      // Handle auto-login after registration
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
        
        // Calculate token expiry - default to 7 days if not provided
        const expiryTime = data.expiresIn ? 
          new Date(Date.now() + (parseInt(data.expiresIn) * 1000)).getTime() : 
          new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).getTime();
        
        saveAuthData(data.user, data.token, expiryTime);
        setupTokenRefresh(expiryTime);
      } else {
        // If no token in response, try auto-login
        console.log('No token in registration response, attempting auto-login');
        try {
          await login(requestBody.email, requestBody.password, true);
        } catch (loginError) {
          console.warn('Auto-login error after registration:', loginError);
          // Continue despite login error, registration was still successful
        }
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError(error.message);
      return { 
        success: false, 
        error: error.message || 'Terjadi kesalahan saat mendaftar' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout function with improved error handling
   */
  const logout = async (redirectToHome = true) => {
    try {
      setLoading(true);
      
      // Call logout API endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: createHeaders(),
        credentials: 'include', // Important for cookies
        cache: 'no-store'
      }).catch(error => {
        // Log error but continue with client-side logout
        console.warn('Logout API error (continuing with client-side logout):', error);
      });
      
      // Clear auth data from state and storage regardless of API success
      setUser(null);
      setToken(null);
      clearAuthData();
      
      // Redirect to home page if requested
      if (redirectToHome) {
        router.push('/');
      }
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear auth data on error
      setUser(null);
      setToken(null);
      clearAuthData();
      
      if (redirectToHome) {
        router.push('/');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = useCallback(() => {
    return !!user;
  }, [user]);

  /**
   * Get the current authentication token
   */
  const getToken = useCallback(() => {
    return token;
  }, [token]);

  /**
   * Executes an authenticated API request with the current token
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const { headers = {}, ...restOptions } = options;
    
    // Add auth headers
    const authHeaders = createHeaders(headers);
    
    // Make the request
    const response = await fetch(url, {
      ...restOptions,
      headers: authHeaders,
      credentials: 'include',
      cache: 'no-store'
    });
    
    // Handle 401/403 responses
    if (response.status === 401 || response.status === 403) {
      // Try to refresh auth
      const isAuth = await checkAuthStatus(true);
      
      if (!isAuth) {
        // If refresh failed, reject with error
        throw new Error('Sesi Anda berakhir. Silakan login kembali.');
      }
      
      // Retry the request with the new token
      const retryHeaders = createHeaders(headers);
      
      return fetch(url, {
        ...restOptions,
        headers: retryHeaders,
        credentials: 'include',
        cache: 'no-store'
      });
    }
    
    return response;
  }, [checkAuthStatus, createHeaders]);

  /**
   * Protect a route with authentication
   * @param {Function} callback - Callback to execute if authenticated
   * @param {string} redirectTo - Path to redirect if not authenticated
   */
  const requireAuth = useCallback((callback, redirectTo = '/login') => {
    // Wait for initial auth check to complete
    if (!initialCheckDone) return null;
    
    if (!isAuthenticated()) {
      console.log('Authentication required, redirecting to', redirectTo);
      
      // Store the current path to redirect back after login
      if (pathname) {
        try {
          sessionStorage.setItem('authRedirectUrl', pathname);
        } catch (error) {
          console.warn('Could not save redirect URL:', error);
        }
      }
      
      router.push(redirectTo);
      return null;
    }
    
    if (callback && typeof callback === 'function') {
      return callback();
    }
    
    return true;
  }, [isAuthenticated, initialCheckDone, router, pathname]);

  /**
   * Handle post-login redirect
   */
  const handleAuthRedirect = useCallback(() => {
    try {
      const redirectUrl = sessionStorage.getItem('authRedirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('authRedirectUrl');
        router.push(redirectUrl);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error handling auth redirect:', error);
      return false;
    }
  }, [router]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    token,
    loading,
    authError,
    login,
    register,
    logout,
    isAuthenticated,
    requireAuth,
    checkAuthStatus,
    getToken,
    handleAuthRedirect,
    authFetch, // New utility for making authenticated requests
  }), [
    user, token, loading, authError, login, register, logout,
    isAuthenticated, requireAuth, checkAuthStatus, getToken,
    handleAuthRedirect, authFetch
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};