'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Aguardar até que o status da sessão seja definido
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    const checkUserRole = async () => {
      try {
        setIsChecking(true);
        
        // Aguardar um pouco para garantir que a sessão está totalmente estabelecida
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Usar API específica para verificar role
        const response = await fetch('/api/auth/role', {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.role === 'SUPER_ADMIN') {
            router.push('/admin');
          } else if (data.role === 'DOCTOR') {
            router.push('/doctor/dashboard');
          } else {
            router.push('/patient/protocols');
          }
        } else if (response.status === 401) {
          console.log('Sessão inválida ou usuário não encontrado - fazendo logout');
          // Sessão inválida ou usuário não existe no banco
          // Limpar sessão e redirecionar para login
          await signOut({ redirect: false });
          router.push('/auth/signin');
        } else {
          console.error('Error checking role:', response.status, await response.text());
          // Para outros erros, assumir paciente como fallback
          router.push('/patient/protocols');
        }
      } catch (error) {
        console.error('Error during role detection:', error);
        // Em caso de erro de rede, tentar redirecionar para protocols como fallback
        router.push('/patient/protocols');
      } finally {
        setIsChecking(false);
      }
    };

    if (session) {
    checkUserRole();
    }
  }, [session, status, router]);

  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-6">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#5154e7]/30 border-t-[#5154e7]"></div>
        </div>
      </div>
    );
  }

  return null;
}
