'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from 'next/image';
import Link from "next/link";
import { ArrowRight } from 'lucide-react';

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing invitation token");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid invitation token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] font-normal tracking-[-0.03em] relative z-10">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-[#0f0f0f] rounded-2xl border border-gray-800 p-8 shadow-lg relative z-20">
            <div className="text-center">
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
              <h2 className="text-xl font-medium text-gray-200 mb-2">Password Set!</h2>
              <p className="text-gray-400 text-sm">
                Your password has been set successfully. Redirecting to login...
              </p>
              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-xl font-medium text-gray-200 mb-2">Set Your Password</h2>
            <p className="text-gray-400 text-sm">
              Welcome to CXLUS! Set a secure password for your account.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 text-red-400 text-center text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="w-full px-4 py-2.5 text-sm bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-600/20 focus:border-gray-500 transition-all duration-200 text-gray-200"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="w-full px-4 py-2.5 text-sm bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-600/20 focus:border-gray-500 transition-all duration-200 text-gray-200"
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-all duration-300 flex items-center justify-center gap-2 border border-gray-700"
              disabled={isLoading || !token}
            >
              {isLoading ? "Setting password..." : "Set Password & Access"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link 
              href="/auth/signin" 
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors duration-200"
            >
              Already have an account? Sign in
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

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SetPasswordForm />
    </Suspense>
  );
} 