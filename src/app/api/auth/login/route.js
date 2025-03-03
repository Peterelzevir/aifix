import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Secret key untuk JWT - gunakan .env di aplikasi nyata
const JWT_SECRET = process.env.JWT_SECRET || 'ai-peter-secret-key-change-this';

// Edge Runtime compatibility
export const runtime = 'edge';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
 * Verifikasi token JWT
 */
async function verifyToken(token) {
  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function GET(request) {
  try {
    // Ambil token dari cookie atau header Authorization
    const cookieStore = cookies();
    let token = cookieStore.get('auth-token')?.value;

    // Jika tidak ada di cookie, coba cek di header Authorization
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Jika token tidak ditemukan
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verifikasi token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Token tidak valid' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Ambil data user berdasarkan ID dari payload token
    const user = await getUserById(payload.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Return data user
    return NextResponse.json(
      { 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          // Tambahkan field lain yang diperlukan tanpa data sensitif
        } 
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Get user data error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil data user' },
      { status: 500, headers: corsHeaders }
    );
  }
}
