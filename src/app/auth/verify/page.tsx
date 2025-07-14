'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Wait a moment before redirecting
        setTimeout(() => {
          router.push(data.redirectUrl);
        }, 1500);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Error verifying email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setError(""); // Clear any existing errors
      alert("New verification code sent!");
    } catch (error) {
      setError("Error sending verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verify Your Email
              </h1>
              <p className="text-gray-600">
                Enter the verification code sent to your email
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-900 font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-2"
                  required
                  disabled={loading || success}
                />
              </div>

              <div>
                <Label htmlFor="code" className="text-gray-900 font-semibold">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="mt-2"
                  required
                  disabled={loading || success}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircleIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertDescription>Email verified successfully! Redirecting...</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={loading || success}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  className="w-full h-12"
                  disabled={loading || success}
                >
                  Resend Code
                </Button>
              </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  )
} 