'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from "next-auth/react"
import { ArrowRight } from 'lucide-react';

function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for clinic slug and redirect if present
  useEffect(() => {
    const clinicSlug = searchParams.get('clinicSlug');
    if (clinicSlug && clinicSlug !== 'null') {
      router.push(`/login/${clinicSlug}`);
    }
  }, [searchParams, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      console.log('Tentando fazer login...', { email });
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('Resultado do login:', result);

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (result?.ok) {
        console.log('Login bem sucedido, redirecionando...');
        
        // Redireciona para a página inicial que fará o redirecionamento baseado no role
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] font-normal tracking-[-0.03em] relative z-10">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-[#0f0f0f] rounded-2xl border border-gray-800 p-8 shadow-lg relative z-20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={13}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="mb-6 text-red-400 text-center text-sm">{error}</div>
          )}
          
          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="off"
                className="w-full px-4 py-2.5 text-sm bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-600/20 focus:border-gray-500 transition-all duration-200 text-gray-200"
                placeholder="m@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoComplete="new-password"
                className="w-full px-4 py-2.5 text-sm bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-600/20 focus:border-gray-500 transition-all duration-200 text-gray-200"
                placeholder="Enter your password"
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 flex items-center justify-center gap-2 border border-gray-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Links */}
          <div className="mt-4 text-center">
            <Link 
              href="/auth/forgot-password" 
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors duration-200"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] font-normal tracking-[-0.03em] relative z-10">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-[#0f0f0f] rounded-2xl border border-gray-800 p-8 shadow-lg relative z-20">
          <div className="text-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-400 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginDark() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
} 