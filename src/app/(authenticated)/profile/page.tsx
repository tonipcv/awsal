'use client';

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useEffect } from "react";
import { ArrowRightOnRectangleIcon, CameraIcon } from '@heroicons/react/24/outline';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');
  const [email] = useState(session?.user?.email || '');
  const [image, setImage] = useState(session?.user?.image || '');
  const [isUploading, setIsUploading] = useState(false);
  const [userRole, setUserRole] = useState<'DOCTOR' | 'PATIENT' | 'SUPER_ADMIN' | null>(null);

  // Detectar role do usuário
  useEffect(() => {
    const detectUserRole = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/auth/role');
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
          } else {
            console.error('Error detecting user role:', response.status);
            setUserRole('PATIENT'); // Default to patient
          }
        } catch (error) {
          console.error('Error detecting user role:', error);
          setUserRole('PATIENT'); // Default to patient
        }
      }
    };

    detectUserRole();
  }, [session]);

  // Determinar se deve usar tema claro (médicos/admins) ou escuro (pacientes)
  const isLightTheme = userRole === 'DOCTOR' || userRole === 'SUPER_ADMIN';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Falha ao fazer upload da imagem');

      const data = await response.json();
      setImage(data.url);
      
      // Update session and save to database
      await handleSave(data.url);
      
      // Force refresh to update navigation
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (newImage?: string) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          image: newImage || image 
        }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar perfil');

      // Update session
      await update({
        ...session,
        user: {
          ...session?.user,
          name,
          image: newImage || image,
        },
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  return (
    <div className={cn(
      "min-h-screen", 
      isLightTheme ? "bg-slate-50" : "bg-zinc-950"
    )}>
      <div className="container max-w-2xl mx-auto p-4 pt-[88px] lg:pt-6">
        <Card className={cn(
          "backdrop-blur-sm",
          isLightTheme 
            ? "bg-white/80 border-slate-200/50" 
            : "bg-zinc-900 border-zinc-800"
        )}>
          <CardHeader>
            <CardTitle className={cn(
              isLightTheme ? "text-slate-800" : "text-white"
            )}>
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className={cn(
                  "relative w-32 h-32 rounded-full overflow-hidden border-2",
                  isLightTheme 
                    ? "border-slate-200 bg-slate-100" 
                    : "border-zinc-700 bg-zinc-800"
                )}>
                  {image ? (
                    <Image
                      src={image}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CameraIcon className={cn(
                        "h-12 w-12",
                        isLightTheme ? "text-slate-400" : "text-zinc-500"
                      )} />
                    </div>
                  )}
                </div>
                <label 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                  htmlFor="image-upload"
                >
                  <CameraIcon className="h-8 w-8 text-white" />
                </label>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              <p className={cn(
                "text-sm",
                isLightTheme ? "text-slate-600" : "text-zinc-400"
              )}>
                Clique na imagem para alterar sua foto de perfil
              </p>
            </div>

            <div className="space-y-2">
              <label className={cn(
                "text-sm font-medium",
                isLightTheme ? "text-slate-700" : "text-zinc-300"
              )}>
                Nome
              </label>
              {isEditing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    "focus:border-blue-500",
                    isLightTheme 
                      ? "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500" 
                      : "border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-400"
                  )}
                />
              ) : (
                <p className={cn(
                  "text-lg",
                  isLightTheme ? "text-slate-800" : "text-white"
                )}>
                  {name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className={cn(
                "text-sm font-medium",
                isLightTheme ? "text-slate-700" : "text-zinc-300"
              )}>
                Email
              </label>
              <p className={cn(
                "text-lg",
                isLightTheme ? "text-slate-800" : "text-white"
              )}>
                {email}
              </p>
            </div>

            <div className="pt-4 space-y-4">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSave()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Salvar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className={cn(
                      isLightTheme 
                        ? "border-slate-300 text-slate-700 hover:bg-slate-50 bg-white" 
                        : "border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-zinc-900"
                    )}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Editar Perfil
                </Button>
              )}

              <Button 
                variant="ghost" 
                className={cn(
                  "w-full",
                  isLightTheme 
                    ? "text-slate-600 hover:text-slate-800 hover:bg-slate-100" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                )}
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 