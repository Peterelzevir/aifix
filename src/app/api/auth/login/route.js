import { NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/db';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose'; // Ganti jsonwebtoken dengan jose

// Secret key untuk JWT - gunakan .env di aplikasi nyata
const JWT_SECRET = process.env.JWT_SECRET || 'ai-peter-secret-key-change-this';

export async function POST(request) {
  try {
    // Parse request dengan error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing login request:', parseError);
      return NextResponse.json(
        { success: false, message: 'Format permintaan tidak valid' },
        { status: 400 }
      );
    }
    
    const { email, password } = body;
    
    // Validasi data
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }
    
    // Verifikasi kredensial dengan error handling
    let user;
    try {
      user = await verifyCredentials(email, password);
    } catch (verifyError) {
      console.error('Error verifying credentials:', verifyError);
      return NextResponse.json(
        { success: false, message: 'Gagal memverifikasi kredensial' },
        { status: 500 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah' },
        { status: 401 }
      );
    }
    
    // Buat JWT token dengan jose library
    let token;
    try {
      // jose memerlukan secret key dalam bentuk Uint8Array
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      
      token = await new SignJWT({ 
          id: user.id, 
          email: user.email,
          name: user.name 
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // Token berlaku 7 hari
        .sign(secretKey);
    } catch (jwtError) {
      console.error('Error signing JWT:', jwtError);
      return NextResponse.json(
        { success: false, message: 'Gagal membuat token otentikasi' },
        { status: 500 }
      );
    }
    
    // Set token ke cookie
    try {
      const cookieStore = cookies();
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 hari
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Hanya HTTPS di production
        sameSite: 'lax',
      });
    } catch (cookieError) {
      console.error('Error setting cookie:', cookieError);
      // Masih kembalikan token untuk client-side storage fallback
    }
    
    // Kembalikan token di JSON juga untuk client-side storage
    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token: token // Client-side fallback
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat login' },
      { status: 500 }
    );
  }
}
