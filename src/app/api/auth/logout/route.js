import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Hapus cookie auth-token dengan opsi yang sama saat pembuatan
    const cookieStore = cookies();
    cookieStore.delete('auth-token', {
      path: '/', // Pastikan path sama dengan saat set cookie
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Hanya HTTPS di production
      sameSite: 'lax',
    });
    
    return NextResponse.json({
      success: true,
      message: 'Logout berhasil'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    );
  }
}