'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import Image from 'next/image';
import { Loader2, ArrowRight, MapPin, Globe } from 'lucide-react';

interface ClinicData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  location: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ClinicLoginPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Buscar dados da clínica
  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/clinic/by-slug/${slug}`);
        
        if (response.ok) {
          const data = await response.json();
          setClinic(data.clinic);
        } else if (response.status === 404) {
          setError('Clínica não encontrada');
        } else {
          setError('Erro ao carregar dados da clínica');
        }
      } catch (error) {
        console.error('Error fetching clinic:', error);
        setError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchClinicData();
    }
  }, [slug]);

  // Verificar se já está logado
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/patient/protocols');
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/patient/protocols'
      });

      if (result?.error) {
        setError('Email ou senha incorretos');
      } else if (result?.ok) {
        router.push('/patient/protocols');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Erro durante o login');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] font-normal tracking-[-0.03em] relative z-10">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-[#0f0f0f] rounded-2xl border border-gray-800 p-8 shadow-lg relative z-20">
            
            {/* Skeleton Logo */}
            <div className="text-center mb-6">
              <div className="flex justify-center items-center mb-4">
                <div className="w-16 h-16 bg-gray-700 rounded-xl animate-pulse"></div>
              </div>
              
              {/* Skeleton Nome da clínica */}
              <div className="h-6 bg-gray-700 rounded-lg animate-pulse mb-2 mx-8"></div>
            </div>

            {/* Skeleton Formulário */}
            <div className="space-y-5">
              <div>
                <div className="h-4 bg-gray-700 rounded animate-pulse mb-2 w-16"></div>
                <div className="h-10 bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
              
              <div>
                <div className="h-4 bg-gray-700 rounded animate-pulse mb-2 w-20"></div>
                <div className="h-10 bg-gray-700 rounded-lg animate-pulse"></div>
              </div>

              <div className="h-10 bg-gray-700 rounded-lg animate-pulse"></div>
            </div>

            {/* Skeleton Links */}
            <div className="mt-4 text-center">
              <div className="h-4 bg-gray-700 rounded animate-pulse mx-auto w-32"></div>
            </div>

            {/* Skeleton Logo do sistema */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-center gap-2">
                <div className="h-3 bg-gray-700 rounded animate-pulse w-16"></div>
                <div className="h-3 bg-gray-700 rounded animate-pulse w-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !clinic) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-[#0f0f0f] rounded-2xl border border-gray-800 p-8 shadow-lg">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-2">❌</div>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">Clínica não encontrada</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => router.push('/auth/signin')}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 border border-gray-700"
            >
              Ir para login geral
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] font-normal tracking-[-0.03em] relative z-10">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-[#0f0f0f] rounded-2xl border border-gray-800 p-8 shadow-lg relative z-20">
          
          {/* Logo da Clínica */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center mb-4">
              {clinic?.logo ? (
                <div className="w-16 h-16 relative">
                  <Image
                    src={clinic.logo}
                    alt={`Logo ${clinic.name}`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {clinic?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Nome da clínica */}
            <h1 className="text-xl font-semibold text-gray-200 mb-2">
              {clinic?.name}
            </h1>
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
              disabled={isSigningIn}
            >
              {isSigningIn ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Links */}
          <div className="mt-4 text-center">
            <a 
              href="#" 
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors duration-200"
            >
              Forgot your password?
            </a>
          </div>

          {/* Logo do sistema embaixo */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500">Powered by</span>
              <Image
                src="/logo.png"
                alt="Sistema"
                width={32}
                height={10}
                className="object-contain opacity-60"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 