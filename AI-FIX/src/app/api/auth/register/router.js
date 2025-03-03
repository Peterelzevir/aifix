// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { SignJWT } from 'jose'; // Import jose untuk JWT
import { cookies } from 'next/headers';

// Secret key untuk JWT - gunakan .env di aplikasi nyata
const JWT_SECRET = process.env.JWT_SECRET || 'ai-peter-secret-key-change-this';
// Siapkan secret key dalam format yang diperlukan jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

// Edge Runtime compatibility
export const runtime = 'edge';

/**
 * Validasi format email yang lebih baik
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export async function POST(request) {
  try {
    console.log('Registration API called');
    
    // Parse request body dengan error handling
    let body;
    try {
      body = await request.json();
      console.log('Request body received:', body);
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json(
        { success: false, message: 'Format permintaan tidak valid' },
        { status: 400 }
      );
    }
    
    const { name, email, password } = body;
    
    // Validasi input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Semua kolom harus diisi' },
        { status: 400 }
      );
    }
    
    // Normalisasi email dan name
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    
    // Validasi format email
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
      );
    }
    
    // Validasi panjang password
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }
    
    // Cek apakah email sudah ada
    let existingUser;
    try {
      existingUser = await getUserByEmail(normalizedEmail);
    } catch (checkError) {
      console.error('Check user error:', checkError);
      return NextResponse.json(
        { success: false, message: 'Gagal memeriksa data pengguna' },
        { status: 500 }
      );
    }
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar' },
        { status: 409 } // Gunakan kode 409 Conflict untuk email yang sudah ada
      );
    }
    
    // Buat user baru dengan data yang sudah dinormalisasi
    let user;
    try {
      user = await createUser({ 
        name: normalizedName, 
        email: normalizedEmail, 
        password 
      });
    } catch (createError) {
      console.error('Create user error:', createError);
      return NextResponse.json(
        { success: false, message: 'Gagal membuat pengguna baru' },
        { status: 500 }
      );
    }
    
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, message: 'Gagal membuat pengguna' },
        { status: 500 }
      );
    }
    
    // Buat JWT token menggunakan jose
    let token;
    try {
      token = await new SignJWT({ 
        id: user.id, 
        email: user.email,
        name: user.name,
        // Tambahkan waktu saat token dibuat
        iat: Math.floor(Date.now() / 1000)
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Token berlaku 7 hari
      .sign(getSecretKey());
    } catch (jwtError) {
      console.error('Error signing JWT:', jwtError);
      return NextResponse.json(
        { success: false, message: 'Gagal membuat token otentikasi' },
        { status: 500 }
      );
    }
    
    // Buat response dengan cookie
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Pendaftaran berhasil',
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token // Kirim token untuk client-side storage
      },
      { status: 201 }
    );
    
    // Set token ke cookie
    try {
      response.cookies.set({
        name: 'auth-token',
        value: token,
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 hari
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Hanya HTTPS di production
        sameSite: 'lax'
      });
      
      // Cookie tambahan untuk frontend yang non-httpOnly (opsional)
      response.cookies.set({
        name: 'user-logged-in',
        value: 'true',
        httpOnly: false, // Dapat diakses oleh JavaScript
        maxAge: 60 * 60 * 24 * 7, // 7 hari
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (cookieError) {
      console.error('Error setting cookie:', cookieError);
      // Masih lanjutkan karena token sudah dikirim di body response
    }
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mendaftar' },
      { status: 500 }
    );
  }
}