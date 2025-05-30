'use client';

import Navigation from '@/components/Navigation';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100dvh] h-full">
      <Navigation />
      <main className="h-full">
        {children}
      </main>
    </div>
  );
} 