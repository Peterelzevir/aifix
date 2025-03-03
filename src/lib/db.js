/**
 * User Database Module for Next.js
 * 
 * Provides a simple user database with functionality for:
 * - User registration
 * - User authentication
 * - User management
 * 
 * Uses browser compatible storage with Edge Runtime support.
 * Compatible with Vercel and Netlify serverless environments.
 */

// Global in-memory storage for Edge Runtime (perbaikan paling penting)
// Mencegah data hilang antar request selama server berjalan
const EDGE_RUNTIME_STORAGE = {
  next_users_db: JSON.stringify([])
};

// Simple string hash function yang bekerja di Edge Runtime
// Tidak menggunakan module crypto sama sekali
async function hashPassword(password) {
  if (!password) return '';
  
  // Implementasi hash sederhana untuk demo
  // Untuk produksi sebaiknya gunakan library yang aman
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Buat hash lebih kompleks dengan salt
  const salt = 'vercel-edge-' + (new Date().getFullYear());
  const saltedHash = hash + salt;
  
  // Convert ke string hex
  return Array.from(saltedHash.toString())
    .reduce((str, char) => {
      const hex = char.charCodeAt(0).toString(16);
      return str + hex;
    }, '');
}

// Fungsi verifikasi password
async function verifyPassword(password, hashedPassword) {
  const newHash = await hashPassword(password);
  return newHash === hashedPassword;
}

// In-memory cache to reduce storage operations
let userCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute cache TTL

// Prefix for storage keys
const STORAGE_KEY = 'next_users_db';

/**
 * Get storage implementation based on environment
 * @returns {Object} Storage interface
 */
function getStorage() {
  // For server components and API routes
  if (typeof globalThis.localStorage === 'undefined') {
    // Edge Runtime & Server environment
    return {
      async getItem(key) {
        // PERBAIKAN: Menggunakan EDGE_RUNTIME_STORAGE untuk menyimpan data
        return EDGE_RUNTIME_STORAGE[key] || JSON.stringify([]);
      },
      async setItem(key, value) {
        // PERBAIKAN: Menyimpan data ke EDGE_RUNTIME_STORAGE
        EDGE_RUNTIME_STORAGE[key] = value;
        return true;
      }
    };
  }
  
  // For client components (not recommended for auth data)
  return {
    async getItem(key) {
      return localStorage.getItem(key);
    },
    async setItem(key, value) {
      localStorage.setItem(key, value);
      return true;
    }
  };
}

/**
 * Read user database with caching for improved performance
 * @param {boolean} skipCache - Force refresh from storage if true
 * @returns {Promise<Array>} Array of users
 */
async function readDb(skipCache = false) {
  // Use cache if still fresh and skipCache is false
  const now = Date.now();
  if (!skipCache && userCache && now - lastCacheTime < CACHE_TTL) {
    return userCache;
  }
  
  try {
    const storage = getStorage();
    const data = await storage.getItem(STORAGE_KEY);
    
    // Handle empty data
    if (!data || data.trim() === '') {
      userCache = [];
      lastCacheTime = now;
      return [];
    }
    
    // Parse data and update cache
    const users = JSON.parse(data);
    userCache = users;
    lastCacheTime = now;
    return users;
  } catch (error) {
    console.error('Error reading users database:', error);
    return [];
  }
}

/**
 * Write data to database and update cache
 * @param {Array} data - Array of user data to save
 * @returns {Promise<boolean>} - Success status
 */
async function writeDb(data) {
  try {
    const storage = getStorage();
    const jsonString = JSON.stringify(data);
    
    await storage.setItem(STORAGE_KEY, jsonString);
    
    // Update cache
    userCache = data;
    lastCacheTime = Date.now();
    
    return true;
  } catch (error) {
    console.error('Error writing users database:', error);
    throw new Error('Failed to save user data: ' + error.message);
  }
}

/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @returns {Object} - Validation result {valid: boolean, message: string}
 */
function validateUserData(userData) {
  if (!userData) {
    return { valid: false, message: 'Data pengguna tidak ada' };
  }
  
  if (!userData.email) {
    return { valid: false, message: 'Email harus diisi' };
  }
  
  // Enhanced email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(userData.email)) {
    return { valid: false, message: 'Format email tidak valid' };
  }
  
  if (!userData.name || userData.name.trim() === '') {
    return { valid: false, message: 'Nama harus diisi' };
  }
  
  if (userData.password && userData.password.length < 6) {
    return { valid: false, message: 'Password minimal 6 karakter' };
  }
  
  return { valid: true, message: 'Valid' };
}

/**
 * Sanitize user object to remove password
 * @param {Object} user - User object with password
 * @returns {Object} - User without password and sensitive data
 */
function sanitizeUser(user) {
  if (!user) return null;
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Menambahkan user awal jika database kosong (untuk demo)
 */
async function seedInitialUsers() {
  try {
    const users = await readDb();
    
    // Jika sudah ada user, tidak perlu tambah lagi
    if (users.length > 0) {
      return;
    }
    
    // Tambahkan user demo
    const demoUser = {
      id: 'user_demo_1',
      name: 'Demo User',
      email: 'demo@example.com',
      password: await hashPassword('password123'),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Menambahkan user demo ke database');
    users.push(demoUser);
    await writeDb(users);
  } catch (error) {
    console.error('Error seeding initial users:', error);
  }
}

// Jalankan seeding saat module di-import
seedInitialUsers().catch(console.error);

/**
 * Check if user exists by email (case insensitive)
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if user exists
 */
export async function checkUserExists(email) {
  if (!email) return false;
  
  try {
    const users = await readDb();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error('Error checking if user exists:', error);
    throw new Error('Failed to check user existence: ' + error.message);
  }
}

/**
 * Get all users from database
 * @returns {Promise<Array>} - List of users (without passwords)
 */
export async function getUsers() {
  try {
    const users = await readDb();
    // Don't include password field
    return users.map(user => sanitizeUser(user));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

/**
 * Get user by email
 * @param {string} email - Email of user to find
 * @returns {Promise<Object|null>} - User object or null if not found
 */
export async function getUserByEmail(email) {
  if (!email) return null;
  
  try {
    const users = await readDb();
    // PERBAIKAN: Memastikan email dinormalisasi
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(user => user.email.toLowerCase() === normalizedEmail) || null;
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Get user by ID
 * @param {string} id - ID of user to find
 * @returns {Promise<Object|null>} - User object or null if not found
 */
export async function getUserById(id) {
  if (!id) return null;
  
  try {
    const users = await readDb();
    const user = users.find(user => user.id === id);
    
    if (!user) return null;
    
    // Don't include password field
    return sanitizeUser(user);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Add new user
 * @param {Object} userData - New user data {name, email, password}
 * @returns {Promise<Object>} - Newly created user (without password)
 */
export async function createUser(userData) {
  // Validate input
  const validation = validateUserData(userData);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  
  if (!userData.password) {
    throw new Error('Password harus diisi');
  }
  
  try {
    const users = await readDb(true); // Skip cache to ensure fresh data
    
    // PERBAIKAN: Pastikan email dinormalisasi
    const normalizedEmail = userData.email.trim().toLowerCase();
    
    // Check if email already exists
    if (users.some(user => user.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Email sudah terdaftar');
    }
    
    // Hash password
    let hashedPassword;
    try {
      hashedPassword = await hashPassword(userData.password);
    } catch (hashError) {
      console.error('Password hashing failed:', hashError);
      throw new Error('Gagal memproses password');
    }
    
    // Create new user with unique ID
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: userData.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      status: 'active', // Default status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Menambahkan user baru:', newUser.email);
    
    // Save user to database
    users.push(newUser);
    await writeDb(users);
    
    // PERBAIKAN: Dump database setelah register untuk debug
    const updatedUsers = await readDb(true);
    console.log(`Database sekarang berisi ${updatedUsers.length} user(s)`);
    
    // Return user without password
    return sanitizeUser(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error; // Re-throw to be handled by API route
  }
}

/**
 * Update user data
 * @param {string} userId - ID of user to update
 * @param {Object} updateData - Data to update {name, email, etc}
 * @returns {Promise<Object|null>} - Updated user or null if failed
 */
export async function updateUser(userId, updateData) {
  if (!userId || !updateData) {
    throw new Error('ID user dan data update harus diisi');
  }
  
  try {
    const users = await readDb(true); // Skip cache to ensure fresh data
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User tidak ditemukan');
    }
    
    // If email is updated, check if it's already in use
    if (updateData.email && 
        updateData.email.toLowerCase() !== users[userIndex].email.toLowerCase() &&
        users.some(u => u.id !== userId && u.email.toLowerCase() === updateData.email.toLowerCase())) {
      throw new Error('Email sudah digunakan oleh pengguna lain');
    }
    
    // Update password if provided
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }
    
    // Update user
    const updatedUser = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    users[userIndex] = updatedUser;
    await writeDb(users);
    
    // Return user without password
    return sanitizeUser(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Verify user credentials
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object|null>} - User data if successful or null if failed
 */
export async function verifyCredentials(email, password) {
  if (!email || !password) {
    return null;
  }
  
  try {
    // PERBAIKAN: Pastikan email dinormalisasi
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Verifying credentials for:', normalizedEmail);
    
    const user = await getUserByEmail(normalizedEmail);
    
    if (!user) {
      console.log('User not found:', normalizedEmail);
      return null;
    }
    
    // Check user status
    if (user.status === 'disabled' || user.status === 'suspended') {
      console.warn(`Login attempt by inactive user: ${email}`);
      return null;
    }
    
    // Verify password
    const passwordMatch = await verifyPassword(password, user.password);
    console.log('Password match result:', passwordMatch);
    
    if (!passwordMatch) {
      return null;
    }
    
    // Update last login time
    try {
      const users = await readDb(true); // Skip cache to ensure fresh data
      const userIndex = users.findIndex(u => u.id === user.id);
      
      if (userIndex !== -1) {
        users[userIndex].lastLoginAt = new Date().toISOString();
        users[userIndex].loginCount = (users[userIndex].loginCount || 0) + 1;
        await writeDb(users);
      }
    } catch (updateError) {
      console.warn('Could not update last login time:', updateError);
      // Continue anyway, this is not critical
    }
    
    // Return user without password
    return sanitizeUser(user);
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return null;
  }
}

/**
 * Delete user
 * @param {string} userId - ID of user to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteUser(userId) {
  if (!userId) {
    throw new Error('ID user harus diisi');
  }
  
  try {
    const users = await readDb(true); // Skip cache to ensure fresh data
    const filteredUsers = users.filter(user => user.id !== userId);
    
    // If number of users didn't change, user was not found
    if (filteredUsers.length === users.length) {
      throw new Error('User tidak ditemukan');
    }
    
    await writeDb(filteredUsers);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Check if database is ready
 * @returns {Promise<boolean>} Success status
 */
export async function checkDatabaseHealth() {
  try {
    await readDb(true); // Force refresh from storage
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Disable/enable user account
 * @param {string} userId - ID of user to change status
 * @param {string} status - New status ('active', 'disabled', 'suspended')
 * @returns {Promise<Object|null>} Updated user
 */
export async function updateUserStatus(userId, status) {
  if (!userId || !status || !['active', 'disabled', 'suspended'].includes(status)) {
    throw new Error('ID user dan status yang valid harus diisi');
  }
  
  return updateUser(userId, { status });
}

/**
 * Reset user password
 * @param {string} email - User email
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
export async function resetPassword(email, newPassword) {
  if (!email || !newPassword || newPassword.length < 6) {
    throw new Error('Email dan password baru (min. 6 karakter) harus diisi');
  }
  
  try {
    const users = await readDb(true); // Skip cache
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex === -1) {
      throw new Error('User tidak ditemukan');
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user
    users[userIndex].password = hashedPassword;
    users[userIndex].updatedAt = new Date().toISOString();
    users[userIndex].passwordResetAt = new Date().toISOString();
    
    await writeDb(users);
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

// Clear cache function - useful for testing or when consistent reads are needed
export function clearCache() {
  userCache = null;
  lastCacheTime = 0;
}

// Expor fungsi lain yang mungkin Anda butuhkan
export function debugDumpUsers() {
  return readDb(true).then(users => {
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      status: user.status,
      createdAt: user.createdAt
    }));
  });
}
