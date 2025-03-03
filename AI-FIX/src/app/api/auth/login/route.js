import { NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/db';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose'; // Ganti jsonwebtoken dengan jose

// Secret key untuk JWT - gunakan .env di aplikasi nyata
const JWT_SECRET = process.env.JWT_SECRET || 'ai-peter-secret-key-change-this';

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
    // Parse request dengan error handling yang lebih baik
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing login request:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Format permintaan tidak valid'
        },
        { status: 400 }
      );
    }
    
    // Ekstrak data dengan nilai default untuk remember
    const { email, password, remember = false } = body;
    
    // Validasi data yang lebih lengkap
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    // Validasi format email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
      );
    }
    
    // Verifikasi kredensial dengan error handling
    let user;
    try {
      // Normalisasi email menjadi lowercase sebelum verifikasi
      user = await verifyCredentials(email.toLowerCase(), password);
    } catch (verifyError) {
      console.error('Error verifying credentials:', verifyError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Gagal memverifikasi kredensial'
        },
        { status: 500 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah' },
        { status: 401 }
      );
    }
    
    // Tentukan masa berlaku token berdasarkan "remember me"
    const tokenExpiry = remember ? '30d' : '1d'; // 30 hari jika remember, 1 hari jika tidak
    const cookieMaxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // Detik
    
    // Buat JWT token dengan jose library
    let token;
    try {
      // jose memerlukan secret key dalam bentuk Uint8Array
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      
      token = await new SignJWT({ 
          id: user.id, 
          email: user.email,
          name: user.name,
          // Tambahkan waktu saat token dibuat untuk validasi tambahan jika diperlukan
          iat: Math.floor(Date.now() / 1000)
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(tokenExpiry)
        .sign(secretKey);
    } catch (jwtError) {
      console.error('Error signing JWT:', jwtError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Gagal membuat token otentikasi'
        },
        { status: 500 }
      );
    }
    
    // Buat response dasar
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token: token // Client-side fallback
    });
    
    // Set token ke cookie dengan opsi yang disesuaikan dengan "remember me"
    try {
      response.cookies.set({
        name: 'auth-token',
        value: token,
        httpOnly: true,
        maxAge: cookieMaxAge,
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Hanya HTTPS di production
        sameSite: 'lax'
      });
      
      // Cookie tambahan untuk frontend yang non-httpOnly (opsional)
      response.cookies.set({
        name: 'user-logged-in',
        value: 'true',
        httpOnly: false, // Dapat diakses oleh JavaScript
        maxAge: cookieMaxAge,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (cookieError) {
      console.error('Error setting cookie:', cookieError);
      // Masih lanjutkan karena kita masih mengembalikan token di body
    }
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat login'
      },
      { status: 500 }
    );
  }
}