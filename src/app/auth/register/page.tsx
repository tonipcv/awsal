/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar conta');
      }

      router.push('/auth/signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full grid place-items-center">
      <Card className="w-full max-w-[400px] mx-4 bg-black/20 border border-white/10 backdrop-blur-sm">
        <CardHeader className="space-y-6 pb-6">
          <div className="flex justify-center">
            <Logo className="text-center" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-light tracking-wide">Create an account</h2>
            <p className="text-sm text-zinc-400 font-light">Enter your information to get started</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-400 font-light">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/5 border-white/10 focus:border-turquoise/50 focus:ring-turquoise/10 font-light"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400 font-light">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 focus:border-turquoise/50 focus:ring-turquoise/10 font-light"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-400 font-light">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 focus:border-turquoise/50 focus:ring-turquoise/10 font-light"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm font-light">{error}</div>
            )}
            <Button 
              type="submit" 
              className="w-full relative group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
              <div className="absolute inset-0 bg-gradient-to-r from-turquoise/0 via-turquoise/10 to-turquoise/0 opacity-0 group-hover:opacity-100 transition-all duration-700" />
            </Button>

            <div className="text-center space-y-2">
              <Link 
                href="/auth/signin" 
                className="text-sm text-zinc-400 hover:text-white transition-colors block"
              >
                Already have an account? Sign in
              </Link>
              <div className="border-t border-white/10 my-4"></div>
              <Link 
                href="/auth/register-doctor" 
                className="text-sm text-turquoise hover:text-turquoise/80 transition-colors block"
              >
                Are you a doctor? Register here →
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 