/**
 * User Database Module for Next.js
 * 
 * Provides a simple file-based user database with functionality for:
 * - User registration
 * - User authentication
 * - User management
 * 
 * Uses JSON file storage with atomic operations for data integrity.
 * Compatible with Vercel and Netlify serverless environments and Edge Runtime.
 */

import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
//const
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Singkaton instance untuk cache (mengurangi operasi I/O)
let userCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 60000; // 1 menit cache TTL

// Path ke file database - disesuaikan untuk lingkungan yang berbeda
const getDbPath = () => {
  // Vercel dan Netlify adalah read-only pada /var/task, jadi gunakan /tmp untuk deployment
  const basePath = process.env.NODE_ENV === 'production' 
    ? (process.env.VERCEL ? '/tmp' : process.env.NETLIFY ? '/tmp' : path.join(process.cwd(), '.data'))
    : process.cwd();
  
  return path.join(basePath, 'data', 'users.json');
};

// Pastikan folder data ada dengan error handling yang lebih baik
async function ensureDbExists() {
  try {
    const DB_PATH = getDbPath();
    const dataDir = path.dirname(DB_PATH);
    
    try {
      await fs.access(dataDir);
    } catch {
      // Folder tidak ada, buat folder
      await fs.mkdir(dataDir, { recursive: true });
      console.log(`Created data directory at ${dataDir}`);
    }
    
    try {
      await fs.access(DB_PATH);
    } catch {
      // File tidak ada, buat file kosong
      await fs.writeFile(DB_PATH, JSON.stringify([]));
      console.log(`Created empty database at ${DB_PATH}`);
    }
    return true;
  } catch (error) {
    console.error('Error ensuring DB exists:', error);
    throw new Error('Database initialization failed: ' + error.message);
  }
}

/**
 * Membaca database users dengan caching untuk meningkatkan performa
 * @param {boolean} skipCache - Force refresh dari disk jika true
 * @returns {Promise<Array>} Array berisi daftar user
 */
async function readDb(skipCache = false) {
  // Gunakan cache jika masih fresh dan skipCache false
  const now = Date.now();
  if (!skipCache && userCache && now - lastCacheTime < CACHE_TTL) {
    return userCache;
  }
  
  await ensureDbExists();
  const DB_PATH = getDbPath();
  
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    // Handle file kosong
    if (!data || data.trim() === '') {
      userCache = [];
      lastCacheTime = now;
      return [];
    }
    
    // Parse data dan update cache
    const users = JSON.parse(data);
    userCache = users;
    lastCacheTime = now;
    return users;
  } catch (error) {
    console.error('Error reading users database:', error);
    
    // Backup file rusak jika parsing error
    if (error instanceof SyntaxError) {
      try {
        const backup = `${DB_PATH}.backup.${Date.now()}`;
        const data = await fs.readFile(DB_PATH, 'utf8');
        await fs.writeFile(backup, data);
        console.error(`Corrupted DB backed up to ${backup}`);
        await fs.writeFile(DB_PATH, JSON.stringify([]));
        console.log('Database reset to empty array after corruption');
        
        // Reset cache
        userCache = [];
        lastCacheTime = now;
      } catch (backupError) {
        console.error('Failed to backup corrupted DB:', backupError);
      }
    }
    return [];
  }
}

/**
 * Menulis data ke database dan update cache
 * @param {Array} data - Array data user untuk disimpan
 * @returns {Promise<boolean>} - Status keberhasilan
 */
async function writeDb(data) {
  await ensureDbExists();
  const DB_PATH = getDbPath();
  
  try {
    const tempPath = `${DB_PATH}.temp`;
    const jsonString = JSON.stringify(data, null, 2);
    
    // Tulis ke file temporary dulu
    await fs.writeFile(tempPath, jsonString);
    
    // Ganti file asli dengan atomic rename
    await fs.rename(tempPath, DB_PATH);
    
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
 * Validasi data user
 * @param {Object} userData - Data user yang akan divalidasi
 * @returns {Object} - Result dari validasi {valid: boolean, message: string}
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
 * Sanitize user object untuk menghapus password
 * @param {Object} user - User object dengan password
 * @returns {Object} - User tanpa password dan data sensitif
 */
function sanitizeUser(user) {
  if (!user) return null;
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Check user exists by email (case insensitive)
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
 * Dapatkan semua user dari database
 * @returns {Promise<Array>} - Daftar user (tanpa password)
 */
export async function getUsers() {
  try {
    const users = await readDb();
    // Jangan tampilkan field password
    return users.map(user => sanitizeUser(user));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

/**
 * Dapatkan user berdasarkan email
 * @param {string} email - Email user yang dicari
 * @returns {Promise<Object|null>} - User object atau null jika tidak ditemukan
 */
export async function getUserByEmail(email) {
  if (!email) return null;
  
  try {
    const users = await readDb();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Dapatkan user berdasarkan ID
 * @param {string} id - ID user yang dicari
 * @returns {Promise<Object|null>} - User object atau null jika tidak ditemukan
 */
export async function getUserById(id) {
  if (!id) return null;
  
  try {
    const users = await readDb();
    const user = users.find(user => user.id === id);
    
    if (!user) return null;
    
    // Jangan tampilkan field password
    return sanitizeUser(user);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Tambah user baru
 * @param {Object} userData - Data user baru {name, email, password}
 * @returns {Promise<Object>} - User baru yang telah dibuat (tanpa password)
 */
export async function createUser(userData) {
  // Validasi input
  const validation = validateUserData(userData);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  
  if (!userData.password) {
    throw new Error('Password harus diisi');
  }
  
  try {
    const users = await readDb(true); // Skip cache to ensure fresh data
    
    // Cek apakah email sudah ada
    if (users.some(user => user.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Email sudah terdaftar');
    }
    
    // Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(userData.password, 10);
    } catch (hashError) {
      console.error('Password hashing failed:', hashError);
      throw new Error('Gagal memproses password');
    }
    
    // Buat user baru dengan ID unik
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      status: 'active', // Default status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Simpan user ke database
    users.push(newUser);
    await writeDb(users);
    
    // Kembalikan user tanpa password
    return sanitizeUser(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error; // Re-throw untuk ditangani oleh API route
  }
}

/**
 * Update data user
 * @param {string} userId - ID user yang akan diupdate
 * @param {Object} updateData - Data yang akan diupdate {name, email, etc}
 * @returns {Promise<Object|null>} - User yang sudah diupdate atau null jika gagal
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
    
    // Jika email diupdate, cek apakah sudah ada
    if (updateData.email && 
        updateData.email.toLowerCase() !== users[userIndex].email.toLowerCase() &&
        users.some(u => u.id !== userId && u.email.toLowerCase() === updateData.email.toLowerCase())) {
      throw new Error('Email sudah digunakan oleh pengguna lain');
    }
    
    // Update password jika ada
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    // Update user
    const updatedUser = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    users[userIndex] = updatedUser;
    await writeDb(users);
    
    // Kembalikan user tanpa password
    return sanitizeUser(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Verifikasi kredensial user
 * @param {string} email - Email pengguna
 * @param {string} password - Password pengguna
 * @returns {Promise<Object|null>} - User data jika berhasil atau null jika gagal
 */
export async function verifyCredentials(email, password) {
  if (!email || !password) {
    return null;
  }
  
  try {
    const user = await getUserByEmail(email);
    
    if (!user) {
      return null;
    }
    
    // Periksa status user
    if (user.status === 'disabled' || user.status === 'suspended') {
      console.warn(`Login attempt by inactive user: ${email}`);
      return null;
    }
    
    // Verifikasi password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
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
    
    // Kembalikan user tanpa password
    return sanitizeUser(user);
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return null;
  }
}

/**
 * Hapus user
 * @param {string} userId - ID user yang akan dihapus
 * @returns {Promise<boolean>} - Status keberhasilan
 */
export async function deleteUser(userId) {
  if (!userId) {
    throw new Error('ID user harus diisi');
  }
  
  try {
    const users = await readDb(true); // Skip cache to ensure fresh data
    const filteredUsers = users.filter(user => user.id !== userId);
    
    // Jika jumlah user tidak berubah, berarti user tidak ditemukan
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
 * Cek apakah database sudah siap
 * @returns {Promise<boolean>} Status keberhasilan
 */
export async function checkDatabaseHealth() {
  try {
    await ensureDbExists();
    await readDb(true); // Force refresh dari disk
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Disable/enable user account
 * @param {string} userId - ID user yang akan diubah statusnya
 * @param {string} status - Status baru ('active', 'disabled', 'suspended')
 * @returns {Promise<Object|null>} User yang sudah diupdate
 */
export async function updateUserStatus(userId, status) {
  if (!userId || !status || !['active', 'disabled', 'suspended'].includes(status)) {
    throw new Error('ID user dan status yang valid harus diisi');
  }
  
  return updateUser(userId, { status });
}

/**
 * Reset user password
 * @param {string} email - Email user
 * @param {string} newPassword - Password baru
 * @returns {Promise<boolean>} Status keberhasilan
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
    
    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
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
