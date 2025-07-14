'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function ActivateAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [activatedCount, setActivatedCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setError("No activation token provided");
      return;
    }

    const activateAccount = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/protocols/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setIsSuccess(true);
          setActivatedCount(data.activatedCount || 0);
        } else {
          setError(data.error || 'Failed to activate account');
        }
      } catch (err) {
        setError('An error occurred while activating your account');
      } finally {
        setIsLoading(false);
      }
    };

    activateAccount();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] font-normal tracking-[-0.03em] relative z-10">
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-[#0f0f0f] rounded-2xl border border-gray-800 p-8 shadow-lg relative z-20">
          
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center mb-4">
              <div className="w-16 h-16 relative">
                <Image
                  src="/logo.png"
                  alt="CXLUS"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-xl font-semibold text-gray-200 mb-2">
              Account Activation
            </h1>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-400 text-center">
                  Activating your account...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-red-400 mb-2">
                  Activation Failed
                </h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 border border-gray-700 flex items-center justify-center gap-2"
                >
                  Go to Login
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : isSuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-emerald-400 mb-2">
                  Account Activated!
                </h2>
                <p className="text-gray-400 mb-2">
                  Your account has been successfully activated.
                </p>
                {activatedCount > 0 && (
                  <p className="text-gray-500 text-sm mb-6">
                    {activatedCount} protocol{activatedCount !== 1 ? 's' : ''} activated
                  </p>
                )}
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 border border-gray-700 flex items-center justify-center gap-2"
                >
                  Continue to Login
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
              <span>Powered by</span>
              <span className="font-semibold">CXLUS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 