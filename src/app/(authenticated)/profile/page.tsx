'use client';

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useCallback, useEffect } from "react";
import { 
  ArrowRightOnRectangleIcon, 
  CameraIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  StarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UserStats {
  totalPatients?: number;
  totalProtocols?: number;
  totalTemplates?: number;
  completedProtocols?: number;
  activeProtocols?: number;
  joinedDate?: string;
  lastLogin?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [userRole, setUserRole] = useState<'DOCTOR' | 'PATIENT' | 'SUPER_ADMIN' | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({});

  // Load user data and stats
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          
          // Set basic data from session
          setName(session.user.name || '');
          setEmail(session.user.email || '');
          setImage(session.user.image || '');

          // Detect user role
          const roleResponse = await fetch('/api/auth/role');
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            setUserRole(roleData.role);

            // Load stats based on role
            if (roleData.role === 'DOCTOR') {
              const statsResponse = await fetch('/api/doctor/stats');
              if (statsResponse.ok) {
                const stats = await statsResponse.json();
                setUserStats(stats);
              }
            } else if (roleData.role === 'PATIENT') {
              const statsResponse = await fetch('/api/patient/stats');
              if (statsResponse.ok) {
                const stats = await statsResponse.json();
                setUserStats(stats);
              }
            }
          } else {
            setUserRole('PATIENT');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setUserRole('PATIENT');
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [session]);

  // Determine if should use light theme (doctors/admins) or dark theme (patients)
  const isLightTheme = userRole === 'DOCTOR' || userRole === 'SUPER_ADMIN';

  // Don't render anything until session is loaded to avoid theme flash
  if (!session || loading) {
    return null;
  }

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

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      setImage(data.url);
      
      // Update session and save to database
      await handleSave(data.url);
      
      // Force refresh to update navigation
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
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

      if (!response.ok) throw new Error('Failed to update profile');

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
      console.error('Save error:', error);
    }
  };

  const getRoleDisplay = () => {
    switch (userRole) {
      case 'DOCTOR':
        return { label: 'Doctor', color: 'bg-blue-100 text-blue-800', icon: UserIcon };
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-800', icon: ShieldCheckIcon };
      case 'PATIENT':
        return { label: 'Patient', color: 'bg-green-100 text-green-800', icon: UsersIcon };
      default:
        return { label: 'User', color: 'bg-gray-100 text-gray-800', icon: UserIcon };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const roleInfo = getRoleDisplay();
  const RoleIcon = roleInfo.icon;

  return (
    <div className={cn(
      "min-h-screen", 
      isLightTheme ? "bg-white" : "bg-black"
    )}>
      <div className={cn(
        "container max-w-6xl mx-auto px-3 lg:px-6 pb-24 lg:pb-8",
        isLightTheme 
          ? "pt-[88px] lg:pt-8 lg:ml-64"
          : "pt-[88px] pb-24 lg:pt-[88px] lg:pb-4 lg:ml-64"
      )}>
        <div className="space-y-6 lg:space-y-8">
          {/* Header Compacto */}
          <div className="py-4 lg:py-6">
            <h1 className={cn(
              "text-2xl lg:text-3xl font-light mb-2 tracking-tight",
              isLightTheme ? "text-gray-900" : "text-white"
            )}>
              Perfil
            </h1>
            <p className={cn(
              "text-sm lg:text-base font-light",
              isLightTheme ? "text-gray-600" : "text-gray-300"
            )}>
              Gerencie suas informações pessoais
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Profile Card Compacto */}
            <div className="lg:col-span-2">
              <Card className={cn(
                "border backdrop-blur-sm",
                isLightTheme 
                  ? "bg-white border-gray-200" 
                  : "bg-gray-900/40 border-gray-800/40"
              )}>
                <CardHeader className="p-4 lg:p-6">
                  <CardTitle className={cn(
                    "text-lg lg:text-xl font-light",
                    isLightTheme ? "text-gray-900" : "text-white"
                  )}>
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 pt-0 space-y-6 lg:space-y-8">
                  {/* Profile Image Compacto */}
                  <div className="flex flex-col items-center space-y-4 lg:space-y-6">
                    <div className="relative group">
                      <div className={cn(
                        "relative w-24 h-24 lg:w-32 lg:h-32 rounded-xl overflow-hidden border-2",
                        isLightTheme 
                          ? "border-gray-200 bg-gray-100" 
                          : "border-gray-700/50 bg-gray-800/50"
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
                              "h-8 w-8 lg:h-12 lg:w-12",
                              isLightTheme ? "text-gray-400" : "text-gray-500"
                            )} />
                          </div>
                        )}
                      </div>
                      <label 
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl"
                        htmlFor="image-upload"
                      >
                        <CameraIcon className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
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
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                          <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-teal-400"></div>
                        </div>
                      )}
                    </div>
                    <div className="text-center space-y-2">
                      <Badge className={cn("rounded-lg px-3 py-1 text-xs", roleInfo.color)}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Form Fields Compactos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-3">
                      <label className={cn(
                        "text-xs lg:text-sm font-medium flex items-center space-x-2",
                        isLightTheme ? "text-gray-900" : "text-gray-300"
                      )}>
                        <UserIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span>Nome</span>
                      </label>
                      {isEditing ? (
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={cn(
                            "h-9 lg:h-10 rounded-lg text-sm font-medium",
                            isLightTheme 
                              ? "border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400" 
                              : "border-gray-700/50 bg-gray-800/50 text-white placeholder:text-gray-400 focus:border-teal-400 focus:ring-teal-400"
                          )}
                        />
                      ) : (
                        <p className={cn(
                          "text-sm lg:text-base font-medium p-2.5 lg:p-3 rounded-lg border",
                          isLightTheme 
                            ? "text-gray-900 bg-gray-50 border-gray-200" 
                            : "text-white bg-gray-800/50 border-gray-700/50"
                        )}>
                          {name || 'Não informado'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className={cn(
                        "text-xs lg:text-sm font-medium flex items-center space-x-2",
                        isLightTheme ? "text-gray-900" : "text-gray-300"
                      )}>
                        <EnvelopeIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span>Email</span>
                      </label>
                      <p className={cn(
                        "text-sm lg:text-base font-medium p-2.5 lg:p-3 rounded-lg border",
                        isLightTheme 
                          ? "text-gray-900 bg-gray-50 border-gray-200" 
                          : "text-white bg-gray-800/50 border-gray-700/50"
                      )}>
                        {email || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons Compactos */}
                  <div className="pt-4 lg:pt-6 space-y-3">
                    {isEditing ? (
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleSave()}
                          className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black rounded-lg h-8 lg:h-9 px-4 lg:px-6 font-medium text-xs lg:text-sm"
                        >
                          Salvar
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          className={cn(
                            "rounded-lg h-8 lg:h-9 px-4 lg:px-6 font-medium text-xs lg:text-sm",
                            isLightTheme 
                              ? "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white" 
                              : "border-gray-700/50 text-gray-300 hover:bg-gray-800/50 bg-gray-900/40"
                          )}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black rounded-lg h-8 lg:h-9 px-4 lg:px-6 font-medium text-xs lg:text-sm"
                      >
                        Editar Perfil
                      </Button>
                    )}

                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full rounded-lg h-8 lg:h-9 font-medium text-xs lg:text-sm",
                        isLightTheme 
                          ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" 
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                      )}
                      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    >
                      <ArrowRightOnRectangleIcon className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Sidebar Compacto */}
            <div className="space-y-4 lg:space-y-6">
              {/* Account Info Compacto */}
              <Card className={cn(
                "border backdrop-blur-sm",
                isLightTheme 
                  ? "bg-white border-gray-200" 
                  : "bg-gray-900/40 border-gray-800/40"
              )}>
                <CardHeader className="p-4 lg:p-6">
                  <CardTitle className={cn(
                    "text-base lg:text-lg font-light flex items-center space-x-2",
                    isLightTheme ? "text-gray-900" : "text-white"
                  )}>
                    <CalendarIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span>Informações da Conta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 pt-0 space-y-3">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-xs lg:text-sm font-medium",
                        isLightTheme ? "text-gray-600" : "text-gray-400"
                      )}>
                        Membro desde
                      </span>
                      <span className={cn(
                        "text-xs lg:text-sm font-medium",
                        isLightTheme ? "text-gray-900" : "text-white"
                      )}>
                        {formatDate(userStats.joinedDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-xs lg:text-sm font-medium",
                        isLightTheme ? "text-gray-600" : "text-gray-400"
                      )}>
                        Último acesso
                      </span>
                      <span className={cn(
                        "text-xs lg:text-sm font-medium",
                        isLightTheme ? "text-gray-900" : "text-white"
                      )}>
                        {formatDate(userStats.lastLogin)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Compactas */}
              {userRole === 'DOCTOR' && (
                <Card className={cn(
                  "border backdrop-blur-sm",
                  isLightTheme 
                    ? "bg-white border-gray-200" 
                    : "bg-gray-900/40 border-gray-800/40"
                )}>
                  <CardHeader className="p-4 lg:p-6">
                    <CardTitle className={cn(
                      "text-base lg:text-lg font-light flex items-center space-x-2",
                      isLightTheme ? "text-gray-900" : "text-white"
                    )}>
                      <ChartBarIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span>Estatísticas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 pt-0 space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className={cn(
                        "p-3 lg:p-4 rounded-lg border",
                        isLightTheme 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-blue-900/20 border-blue-800/40"
                      )}>
                        <div className="flex items-center space-x-3">
                          <UsersIcon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                          <div>
                            <p className={cn(
                              "text-lg lg:text-xl font-light",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.totalPatients || 0}
                            </p>
                            <p className={cn(
                              "text-xs lg:text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-gray-400"
                            )}>
                              Pacientes
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "p-3 lg:p-4 rounded-lg border",
                        isLightTheme 
                          ? "bg-green-50 border-green-200" 
                          : "bg-green-900/20 border-green-800/40"
                      )}>
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
                          <div>
                            <p className={cn(
                              "text-lg lg:text-xl font-light",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.totalProtocols || 0}
                            </p>
                            <p className={cn(
                              "text-xs lg:text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-gray-400"
                            )}>
                              Protocolos
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "p-3 lg:p-4 rounded-lg border",
                        isLightTheme 
                          ? "bg-purple-50 border-purple-200" 
                          : "bg-purple-900/20 border-purple-800/40"
                      )}>
                        <div className="flex items-center space-x-3">
                          <StarIcon className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                          <div>
                            <p className={cn(
                              "text-lg lg:text-xl font-light",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.totalTemplates || 0}
                            </p>
                            <p className={cn(
                              "text-xs lg:text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-gray-400"
                            )}>
                              Templates
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {userRole === 'PATIENT' && (
                <Card className={cn(
                  "border backdrop-blur-sm",
                  isLightTheme 
                    ? "bg-white border-gray-200" 
                    : "bg-gray-900/40 border-gray-800/40"
                )}>
                  <CardHeader className="p-4 lg:p-6">
                    <CardTitle className={cn(
                      "text-base lg:text-lg font-light flex items-center space-x-2",
                      isLightTheme ? "text-gray-900" : "text-white"
                    )}>
                      <ChartBarIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span>Meu Progresso</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 pt-0 space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className={cn(
                        "p-3 lg:p-4 rounded-lg border",
                        isLightTheme 
                          ? "bg-green-50 border-green-200" 
                          : "bg-green-900/20 border-green-800/40"
                      )}>
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
                          <div>
                            <p className={cn(
                              "text-lg lg:text-xl font-light",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.completedProtocols || 0}
                            </p>
                            <p className={cn(
                              "text-xs lg:text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-gray-400"
                            )}>
                              Concluídos
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "p-3 lg:p-4 rounded-lg border",
                        isLightTheme 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-blue-900/20 border-blue-800/40"
                      )}>
                        <div className="flex items-center space-x-3">
                          <ClockIcon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                          <div>
                            <p className={cn(
                              "text-lg lg:text-xl font-light",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.activeProtocols || 0}
                            </p>
                            <p className={cn(
                              "text-xs lg:text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-gray-400"
                            )}>
                              Ativos
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 