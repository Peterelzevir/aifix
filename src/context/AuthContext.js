'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Context for authentication
const AuthContext = createContext();

// Provider component that wraps your app and makes auth object available to any child component that calls useAuth().
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          credentials: 'include', // Include cookies
          cache: 'no-store'
        });

        // Jika response OK, user terautentikasi
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            // Reset user jika verificasi gagal
            setUser(null);
          }
        } else {
          // Reset user jika endpoint mengembalikan error
          setUser(null);
          
          // Coba ambil dari sessionStorage sebagai fallback
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              console.warn('Failed to parse user from sessionStorage');
            }
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  // Register a new user
  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include' // Include cookies
      });

      const data = await response.json();

      // Handle successful registration
      if (response.ok && data.success) {
        console.log('Registration successful, setting user data');
        setUser(data.user);
        
        // Save user data for persistence
        if (data.user) {
          try {
            sessionStorage.setItem('user', JSON.stringify(data.user));
          } catch (e) {
            console.warn('Failed to store user in sessionStorage', e);
          }
        }
        
        return { success: true, data };
      } else {
        // Handle registration errors
        const errorMessage = data.message || 'Registration failed';
        console.error('Registration error:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  };

  // Login user
  const login = async (email, password, remember = false) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, remember }),
        credentials: 'include' // Include cookies
      });

      const data = await response.json();

      // Handle successful login
      if (response.ok && data.success) {
        console.log('Login successful, setting user data');
        setUser(data.user);
        
        // Save user data for persistence
        if (data.user) {
          try {
            sessionStorage.setItem('user', JSON.stringify(data.user));
          } catch (e) {
            console.warn('Failed to store user in sessionStorage', e);
          }
        }
        
        return { success: true, data };
      } else {
        // Handle login errors
        const errorMessage = data.message || 'Login failed';
        console.error('Login error:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Call logout API route if you have one
      // await fetch('/api/auth/logout', {...})
      
      // Clear user data
      setUser(null);
      
      // Clear sessionStorage
      sessionStorage.removeItem('user');
      
      // Clear cookies - this is client-side only and won't remove HTTP-only cookies
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user-logged-in=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // The value that will be supplied to any consuming components
  const contextValue = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook that shorthands the context
export function useAuth() {
  return useContext(AuthContext);
}
