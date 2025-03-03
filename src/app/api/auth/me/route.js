// src/app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { getUserById, debugDumpUsers } from '@/lib/db';

// Prevent caching for this route
export const dynamic = 'force-dynamic';

// Edge Runtime compatibility
export const runtime = 'edge';

// Secret key untuk JWT - gunakan .env di aplikasi nyata
const JWT_SECRET = process.env.JWT_SECRET || 'ai-peter-secret-key-change-this';

// Siapkan secret key dalam format yang diperlukan jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

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
 * Extract token from various sources
 * @param {Request} request - Next.js request object
 * @returns {string|null} The token or null if not found
 */
function getAuthToken(request) {
  // 1. Try to get token from cookie first
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('auth-token')?.value;
  
  if (tokenCookie) {
    console.log('Token found in cookie');
    return tokenCookie;
  }
  
  // 2. Try to get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('Token found in Authorization header');
    return authHeader.substring(7);
  }
  
  // 3. Try to get token from query parameter (useful for WebSocket connections)
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get('token');
  if (tokenParam) {
    console.log('Token found in URL parameter');
    return tokenParam;
  }
  
  console.log('No token found in request');
  return null;
}

export async function GET(request) {
  try {
    // Track request for debugging
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    console.log(`User verification request from IP: ${clientIp}`);
    
    // Debug: dump users untuk memastikan database tidak kosong
    const users = await debugDumpUsers();
    console.log('Current users in database:', users);
    
    // Get token from either cookie, header, or query param
    const token = getAuthToken(request);
    
    if (!token) {
      console.log('No authentication token found');
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi', code: 'no_token' },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="api"',
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache',
            ...corsHeaders
          }
        }
      );
    }
    
    // Verify token with jose
    let payload;
    try {
      console.log('Verifying JWT token');
      const { payload: verifiedPayload } = await jwtVerify(
        token, 
        getSecretKey(),
        {
          algorithms: ['HS256']
        }
      );
      payload = verifiedPayload;
      console.log('Token verified successfully, payload:', payload);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError.message);
      
      // More specific error message based on error type
      let errorMessage = 'Token tidak valid';
      
      if (verifyError.code === 'ERR_JWT_EXPIRED') {
        errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
      } else if (verifyError.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
        errorMessage = 'Token tidak valid. Silakan login kembali.';
      }
      
      return NextResponse.json(
        { success: false, message: errorMessage, code: 'token_invalid' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache',
            ...corsHeaders
          }
        }
      );
    }
    
    // Get user data from database with error handling
    let user;
    try {
      console.log('Getting user data for ID:', payload.id);
      user = await getUserById(payload.id);
      console.log('User data retrieved:', user ? 'Success' : 'Not found');
    } catch (dbError) {
      console.error('Database error when fetching user:', dbError);
      return NextResponse.json(
        { success: false, message: 'Gagal mengambil data pengguna', code: 'database_error' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!user) {
      console.log('User not found for ID:', payload.id);
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan', code: 'user_not_found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Check if account is disabled (if your user model has this field)
    if (user.status === 'disabled' || user.status === 'suspended') {
      console.log('Account is disabled/suspended:', user.id);
      return NextResponse.json(
        { success: false, message: 'Akun tidak aktif', code: 'account_inactive' },
        { status: 403, headers: corsHeaders }
      );
    }
    
    // Check if token needs refresh (if it's set to expire within 15 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const needsRefresh = payload.exp && currentTime >= (payload.exp - 15 * 60);
    
    let refreshedToken = null;
    
    // Create new token if refresh is needed
    if (needsRefresh) {
      try {
        console.log('Refreshing token for user:', user.id);
        refreshedToken = await refreshToken(user);
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        // Continue without refreshed token
      }
    }
    
    console.log('Creating successful response for user:', user.id);
    
    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        // Add any other non-sensitive user data here that frontend needs
        ...(user.lastLogin && { lastLogin: user.lastLoginAt }),
        ...(user.avatar && { avatar: user.avatar }),
        ...(user.role && { role: user.role }),
      },
      tokenRefreshed: !!refreshedToken
    }, { headers: corsHeaders });
    
    // If token was refreshed, update the cookie
    if (refreshedToken) {
      console.log('Setting refreshed token in cookie');
      response.cookies.set({
        name: 'auth-token',
        value: refreshedToken,
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      // Also include the new token in the response for API clients
      response.json.token = refreshedToken;
    }
    
    // Add security headers
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    // Make sure CORS headers are preserved
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    console.log('Auth verification successful for user:', user.id);
    return response;
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat verifikasi', 
        code: 'server_error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Helper function to refresh token
 * @param {Object} user - User data
 * @returns {Promise<string>} New JWT token
 */
async function refreshToken(user) {
  return new SignJWT({ 
    id: user.id, 
    email: user.email,
    name: user.name,
    // Add timestamp for additional security
    iat: Math.floor(Date.now() / 1000)
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}
