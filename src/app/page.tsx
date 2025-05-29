'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const checkUserRole = async () => {
      try {
        setIsChecking(true);
        
        // Usar API específica para verificar role
        const response = await fetch('/api/auth/role');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.role === 'SUPER_ADMIN') {
            router.push('/admin');
          } else if (data.role === 'DOCTOR') {
            router.push('/doctor/dashboard');
          } else {
            router.push('/protocols');
          }
        } else {
          console.error('Error checking role:', response.status);
          // Em caso de erro, redirecionar para signin
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error during role detection:', error);
        router.push('/auth/signin');
      } finally {
        setIsChecking(false);
      }
    };

    checkUserRole();
  }, [session, router]);

  if (!session || isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise mb-4"></div>
          <p className="text-xs text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return null;
}
