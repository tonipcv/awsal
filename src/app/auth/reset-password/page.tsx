'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setIsValidating(false);
      setError('Invalid reset link');
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const data = await response.json();
        setIsValidToken(true);
        setUserEmail(data.email);
      } else {
        const error = await response.json();
        setError(error.error || 'Invalid or expired reset link');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setError('Error validating reset link');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/signin?message=Password updated successfully');
        }, 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Error updating password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Error updating password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5154e7] border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Validating reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircleIcon className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl font-semibold"
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h2>
              <p className="text-gray-600 mb-6">Your password has been successfully updated. You will be redirected to the sign in page.</p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#5154e7] rounded-full animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">Set Your Password</CardTitle>
          <p className="text-gray-600 font-medium">Welcome! Please set your password to access your account.</p>
          {userEmail && (
            <p className="text-sm text-gray-500 mt-2">Account: {userEmail}</p>
          )}
        </CardHeader>
        
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                New Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                Confirm Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10 bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7] rounded-xl h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Password requirements:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  At least 6 characters
                </li>
                <li className={`flex items-center gap-2 ${password === confirmPassword && password.length > 0 ? 'text-green-600' : ''}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${password === confirmPassword && password.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  Passwords match
                </li>
              </ul>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || password !== confirmPassword || password.length < 6}
              className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold h-12"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
                  Updating Password...
                </>
              ) : (
                'Set Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5154e7] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
} 