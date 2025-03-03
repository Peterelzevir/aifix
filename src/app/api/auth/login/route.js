import { NextResponse } from 'next/server';
import { verifyCredentials, debugDumpUsers } from '@/lib/db';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose'; // Ganti jsonwebtoken dengan jose

// Secret key untuk JWT - gunakan .env di aplikasi nyata
const JWT_SECRET = process.env.JWT_SECRET || 'ai-peter-secret-key-change-this';

// Edge Runtime compatibility
export const runtime = 'edge';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handler OPTIONS untuk CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Validasi format email yang lebih baik
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export async function POST(request) {
  try {
    console.log('Login API called');
    
    // Debug: dump users untuk memastikan database tidak kosong
    const users = await debugDumpUsers();
    console.log('Current users in database:', users);
    
    // Parse request dengan error handling
    let body;
    try {
      body = await request.json();
      console.log('Login request body:', body);
    } catch (parseError) {
      console.error('Error parsing login request:', parseError);
      return NextResponse.json(
        { success: false, message: 'Format permintaan tidak valid' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { email, password } = body;
    
    // Validasi data
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password harus diisi' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Normalisasi email (penting!)
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Normalized email:', normalizedEmail);
    
    // Verifikasi kredensial dengan error handling
    let user;
    try {
      console.log('Attempting to verify credentials for:', normalizedEmail);
      user = await verifyCredentials(normalizedEmail, password);
      console.log('Verification result:', user ? 'User found' : 'Authentication failed');
    } catch (verifyError) {
      console.error('Error verifying credentials:', verifyError);
      return NextResponse.json(
        { success: false, message: 'Gagal memverifikasi kredensial' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah' },
        { status: 401, headers: corsHeaders }
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
          name: user.name,
          iat: Math.floor(Date.now() / 1000)
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // Token berlaku 7 hari
        .sign(secretKey);
      
      console.log('JWT token created successfully');
    } catch (jwtError) {
      console.error('Error signing JWT:', jwtError);
      return NextResponse.json(
        { success: false, message: 'Gagal membuat token otentikasi' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Buat response dengan CORS headers
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token: token // Client-side fallback
    }, { headers: corsHeaders });
    
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
      
      // Cookie tambahan untuk frontend yang non-httpOnly
      response.cookies.set({
        name: 'user-logged-in',
        value: 'true',
        httpOnly: false, // Dapat diakses oleh JavaScript
        maxAge: 60 * 60 * 24 * 7, // 7 hari
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      console.log('Cookies set successfully');
    } catch (cookieError) {
      console.error('Error setting cookie:', cookieError);
      // Masih lanjutkan karena token sudah dikirim di body
    }
    
    console.log('Login successful for:', user.email);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat login' },
      { status: 500, headers: corsHeaders }
    );
  }
}
