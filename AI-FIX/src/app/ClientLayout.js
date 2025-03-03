// app/ClientLayout.js
'use client';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-grow mt-16">
        {children}
      </main>
      <Footer />
    </AuthProvider>
  );
}
