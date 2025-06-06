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

// Translations for internationalization
const translations = {
  pt: {
    profile: 'Perfil',
    managePersonalInfo: 'Gerencie suas informações pessoais',
    personalInfo: 'Informações Pessoais',
    name: 'Nome',
    email: 'Email',
    notInformed: 'Não informado',
    save: 'Salvar',
    cancel: 'Cancelar',
    editProfile: 'Editar Perfil',
    signOut: 'Sair',
    accountInfo: 'Informações da Conta',
    memberSince: 'Membro desde',
    lastAccess: 'Último acesso',
    statistics: 'Estatísticas',
    myProgress: 'Meu Progresso',
    patients: 'Pacientes',
    protocols: 'Protocolos',
    templates: 'Templates',
    completed: 'Concluídos',
    active: 'Ativos',
    roles: {
      doctor: 'Doctor',
      superAdmin: 'Super Admin',
      patient: 'Paciente',
      user: 'Usuário'
    },
    notAvailable: 'N/A'
  },
  en: {
    profile: 'Profile',
    managePersonalInfo: 'Manage your personal information',
    personalInfo: 'Personal Information',
    name: 'Name',
    email: 'Email',
    notInformed: 'Not informed',
    save: 'Save',
    cancel: 'Cancel',
    editProfile: 'Edit Profile',
    signOut: 'Sign Out',
    accountInfo: 'Account Information',
    memberSince: 'Member since',
    lastAccess: 'Last access',
    statistics: 'Statistics',
    myProgress: 'My Progress',
    patients: 'Patients',
    protocols: 'Protocols',
    templates: 'Templates',
    completed: 'Completed',
    active: 'Active',
    roles: {
      doctor: 'Doctor',
      superAdmin: 'Super Admin',
      patient: 'Patient',
      user: 'User'
    },
    notAvailable: 'N/A'
  }
};

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
  const [imageKey, setImageKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [userRole, setUserRole] = useState<'DOCTOR' | 'PATIENT' | 'SUPER_ADMIN' | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({});
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [clinicSlug, setClinicSlug] = useState<string | null>(null);

  // Detect browser language
  useEffect(() => {
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'pt';
    const detectedLang = browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'pt';
    setLanguage(detectedLang);
  }, []);

  const t = translations[language];

  // Load user data and stats
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          
          // Set basic data from session
          setName(session.user.name || '');
          setEmail(session.user.email || '');
          // Add cache-busting to initial image load to ensure fresh image
          const initialImage = session.user.image;
          setImage(initialImage ? `${initialImage}?t=${Date.now()}` : '');
          setImageKey(prev => prev + 1); // Force initial render

          // Detect user role
          const roleResponse = await fetch('/api/auth/role');
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            setUserRole(roleData.role);

            // Redirect doctors to their specific profile page
            if (roleData.role === 'DOCTOR' || roleData.role === 'SUPER_ADMIN') {
              router.push('/doctor/profile');
              return;
            }

            // Load stats based on role
            if (roleData.role === 'PATIENT') {
              const statsResponse = await fetch('/api/patient/stats');
              if (statsResponse.ok) {
                const stats = await statsResponse.json();
                setUserStats(stats);
              }

              // Get clinic slug for logout redirect
              const clinicSlugResponse = await fetch('/api/patient/clinic-slug');
              if (clinicSlugResponse.ok) {
                const clinicData = await clinicSlugResponse.json();
                setClinicSlug(clinicData.clinicSlug);
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
      
      // Immediately update the image state with cache-busting
      const imageUrlWithCacheBust = `${data.url}?t=${Date.now()}`;
      setImage(imageUrlWithCacheBust);
      setImageKey(prev => prev + 1); // Force re-render
      
      // Update session and save to database
      await handleSave(data.url); // Save original URL to database
      
      // Force refresh to update navigation and other components
      router.refresh();
      
      // Add a small delay to ensure all components are updated
      setTimeout(() => {
        setImageKey(prev => prev + 1);
      }, 100);
    } catch (error) {
      console.error('Upload error:', error);
      // Reset file input on error
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
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

      // Update session with fresh data
      await update({
        ...session,
        user: {
          ...session?.user,
          name,
          image: newImage || image,
        },
      });

      setIsEditing(false);
      
      // Force refresh of navigation component
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  const getRoleDisplay = () => {
    switch (userRole) {
      case 'DOCTOR':
        return { label: t.roles.doctor, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: UserIcon };
      case 'SUPER_ADMIN':
        return { label: t.roles.superAdmin, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: ShieldCheckIcon };
      case 'PATIENT':
        return { label: t.roles.patient, color: 'bg-turquoise/20 text-turquoise border-turquoise/30', icon: UsersIcon };
      default:
        return { label: t.roles.user, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: UserIcon };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t.notAvailable;
    const date = new Date(dateString);
    return language === 'en' 
      ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Loading state
  if (!session || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
        {/* Padding para menu lateral no desktop e header no mobile */}
        <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
          <div className="max-w-6xl mx-auto px-3 lg:px-6">
            <div className="space-y-4 lg:space-y-6 pt-4 lg:pt-6">
              
              {/* Header Skeleton */}
              <div className="py-4 lg:py-6">
                <div className="h-8 lg:h-9 bg-gray-800/50 rounded w-32 mb-2 animate-pulse"></div>
                <div className="h-4 lg:h-5 bg-gray-700/50 rounded w-64 animate-pulse"></div>
              </div>

              {/* Content Grid Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                
                {/* Main Profile Card Skeleton */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-900/40 border border-gray-800/40 rounded-lg backdrop-blur-sm">
                    <div className="p-3 lg:p-4">
                      <div className="h-5 lg:h-6 bg-gray-800/50 rounded w-48 mb-4 lg:mb-6 animate-pulse"></div>
                      
                      {/* Profile Image Skeleton */}
                      <div className="flex flex-col items-center space-y-3 lg:space-y-4 mb-4 lg:mb-6">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-800/50 rounded-xl animate-pulse"></div>
                        <div className="h-6 bg-gray-800/50 rounded w-20 animate-pulse"></div>
                      </div>

                      {/* Form Fields Skeleton */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-700/50 rounded w-16 animate-pulse"></div>
                          <div className="h-8 lg:h-9 bg-gray-800/50 rounded animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-700/50 rounded w-16 animate-pulse"></div>
                          <div className="h-8 lg:h-9 bg-gray-800/50 rounded animate-pulse"></div>
                        </div>
                      </div>

                      {/* Buttons Skeleton */}
                      <div className="space-y-2 lg:space-y-3">
                        <div className="h-7 lg:h-8 bg-gray-800/50 rounded w-32 animate-pulse"></div>
                        <div className="h-7 lg:h-8 bg-gray-800/50 rounded w-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-3 lg:space-y-4">
                  {/* Account Info Skeleton */}
                  <div className="bg-gray-900/40 border border-gray-800/40 rounded-lg backdrop-blur-sm">
                    <div className="p-3 lg:p-4">
                      <div className="h-4 lg:h-5 bg-gray-800/50 rounded w-40 mb-2 lg:mb-3 animate-pulse"></div>
                      <div className="space-y-2 lg:space-y-3">
                        <div className="flex justify-between">
                          <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-24 animate-pulse"></div>
                          <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="flex justify-between">
                          <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-24 animate-pulse"></div>
                          <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Skeleton */}
                  <div className="bg-gray-900/40 border border-gray-800/40 rounded-lg backdrop-blur-sm">
                    <div className="p-3 lg:p-4">
                      <div className="h-4 lg:h-5 bg-gray-800/50 rounded w-32 mb-2 lg:mb-3 animate-pulse"></div>
                      <div className="space-y-2 lg:space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="p-2 lg:p-3 bg-gray-800/30 rounded-lg">
                            <div className="flex items-center space-x-2 lg:space-x-3">
                              <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gray-700/50 rounded animate-pulse"></div>
                              <div className="flex-1">
                                <div className="h-4 lg:h-5 bg-gray-700/50 rounded w-8 mb-1 animate-pulse"></div>
                                <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-16 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleDisplay();
  const RoleIcon = roleInfo.icon;

  return (
    <div className={cn(
      "min-h-screen", 
      isLightTheme ? "bg-white" : ""
    )} style={!isLightTheme ? { backgroundColor: '#101010' } : undefined}>
      {/* Padding para menu lateral no desktop e header no mobile */}
      <div className={cn(
        isLightTheme 
          ? "pt-[88px] lg:pt-8 lg:ml-64 pb-24 lg:pb-8"
          : "pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64"
      )}>
        <div className="max-w-6xl mx-auto px-3 lg:px-6">
          <div className="space-y-4 lg:space-y-6 pt-4 lg:pt-6">
            {/* Header */}
          <div className="py-4 lg:py-6">
            <h1 className={cn(
                "text-xl lg:text-2xl font-light mb-2 tracking-tight",
              isLightTheme ? "text-gray-900" : "text-white"
            )}>
              {t.profile}
            </h1>
            <p className={cn(
              "text-sm lg:text-base font-light",
              isLightTheme ? "text-gray-600" : "text-gray-300"
            )}>
              {t.managePersonalInfo}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Profile Card */}
            <div className="lg:col-span-2">
              <Card className={cn(
                "border backdrop-blur-sm",
                isLightTheme 
                  ? "bg-white border-gray-200" 
                  : "bg-gray-900/40 border-gray-800/40"
              )}>
                  <CardHeader className="p-3 lg:p-4">
                  <CardTitle className={cn(
                      "text-base lg:text-lg font-light",
                    isLightTheme ? "text-gray-900" : "text-white"
                  )}>
                    {t.personalInfo}
                  </CardTitle>
                </CardHeader>
                  <CardContent className="p-3 lg:p-4 pt-0 space-y-4 lg:space-y-6">
                    {/* Profile Image */}
                    <div className="flex flex-col items-center space-y-3 lg:space-y-4">
                    <div className="relative group">
                      <div className={cn(
                          "relative w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden border-2",
                        isLightTheme 
                          ? "border-gray-200 bg-gray-100" 
                          : "border-gray-700/50 bg-gray-800/50"
                      )}>
                        {image ? (
                          <Image
                              key={`profile-image-${imageKey}`}
                            src={image}
                            alt="Profile"
                            fill
                            className="object-cover"
                              unoptimized={true}
                              priority={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CameraIcon className={cn(
                                "h-6 w-6 lg:h-8 lg:w-8",
                              isLightTheme ? "text-gray-400" : "text-gray-500"
                            )} />
                          </div>
                        )}
                      </div>
                      <label 
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl"
                        htmlFor="image-upload"
                      >
                          <CameraIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
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
                            <div className={cn(
                              "animate-spin rounded-full h-5 w-5 lg:h-6 lg:w-6 border-b-2",
                              isLightTheme ? "border-teal-400" : "border-turquoise"
                            )}></div>
                        </div>
                      )}
                    </div>
                      <div className="text-center">
                      <Badge className={cn("rounded-lg px-3 py-1 text-xs", roleInfo.color)}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                      <div className="space-y-2">
                      <label className={cn(
                        "text-xs lg:text-sm font-medium flex items-center space-x-2",
                        isLightTheme ? "text-gray-900" : "text-gray-300"
                      )}>
                        <UserIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span>{t.name}</span>
                      </label>
                      {isEditing ? (
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={cn(
                              "h-8 lg:h-9 rounded-lg text-sm font-medium",
                            isLightTheme 
                              ? "border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400" 
                                : "border-gray-700/50 bg-gray-800/50 text-white placeholder:text-gray-400 focus:border-turquoise focus:ring-turquoise"
                          )}
                        />
                      ) : (
                        <p className={cn(
                            "text-sm lg:text-base font-medium p-2 lg:p-2.5 rounded-lg border",
                          isLightTheme 
                            ? "text-gray-900 bg-gray-50 border-gray-200" 
                            : "text-white bg-gray-800/50 border-gray-700/50"
                        )}>
                          {name || t.notInformed}
                        </p>
                      )}
                    </div>

                      <div className="space-y-2">
                      <label className={cn(
                        "text-xs lg:text-sm font-medium flex items-center space-x-2",
                        isLightTheme ? "text-gray-900" : "text-gray-300"
                      )}>
                        <EnvelopeIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span>{t.email}</span>
                      </label>
                      <p className={cn(
                          "text-sm lg:text-base font-medium p-2 lg:p-2.5 rounded-lg border",
                        isLightTheme 
                          ? "text-gray-900 bg-gray-50 border-gray-200" 
                          : "text-white bg-gray-800/50 border-gray-700/50"
                      )}>
                        {email || t.notInformed}
                      </p>
                    </div>
                  </div>

                    {/* Action Buttons */}
                    <div className="pt-2 lg:pt-3 space-y-2 lg:space-y-3">
                    {isEditing ? (
                        <div className="flex gap-2 lg:gap-3">
                        <Button 
                          onClick={() => handleSave()}
                            className={cn(
                              "rounded-lg h-7 lg:h-8 px-3 lg:px-4 font-medium text-xs lg:text-sm",
                              isLightTheme 
                                ? "bg-teal-500 hover:bg-teal-600 text-white"
                                : "bg-turquoise hover:bg-turquoise/90 text-black"
                            )}
                        >
                          {t.save}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          className={cn(
                              "rounded-lg h-7 lg:h-8 px-3 lg:px-4 font-medium text-xs lg:text-sm",
                            isLightTheme 
                              ? "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white" 
                              : "border-gray-700/50 text-gray-300 hover:bg-gray-800/50 bg-gray-900/40"
                          )}
                        >
                          {t.cancel}
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setIsEditing(true)}
                          className={cn(
                            "rounded-lg h-7 lg:h-8 px-3 lg:px-4 font-medium text-xs lg:text-sm",
                            isLightTheme 
                              ? "bg-teal-500 hover:bg-teal-600 text-white"
                              : "bg-turquoise hover:bg-turquoise/90 text-black"
                          )}
                      >
                        {t.editProfile}
                      </Button>
                    )}

                    <Button 
                      variant="ghost" 
                      className={cn(
                          "w-full rounded-lg h-7 lg:h-8 font-medium text-xs lg:text-sm",
                        isLightTheme 
                          ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" 
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                      )}
                      onClick={() => {
                        if (clinicSlug) {
                          signOut({ callbackUrl: `/login/${clinicSlug}` });
                        } else {
                          signOut({ callbackUrl: '/auth/signin' });
                        }
                      }}
                    >
                      <ArrowRightOnRectangleIcon className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
                      {t.signOut}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

              {/* Stats Sidebar */}
              <div className="space-y-3 lg:space-y-4">
                {/* Account Info */}
              <Card className={cn(
                "border backdrop-blur-sm",
                isLightTheme 
                  ? "bg-white border-gray-200" 
                  : "bg-gray-900/40 border-gray-800/40"
              )}>
                  <CardHeader className="p-3 lg:p-4">
                  <CardTitle className={cn(
                      "text-sm lg:text-base font-light flex items-center space-x-2",
                    isLightTheme ? "text-gray-900" : "text-white"
                  )}>
                    <CalendarIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span>{t.accountInfo}</span>
                  </CardTitle>
                </CardHeader>
                  <CardContent className="p-3 lg:p-4 pt-0 space-y-2 lg:space-y-3">
                    <div className="space-y-2 lg:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-xs lg:text-sm font-medium",
                        isLightTheme ? "text-gray-600" : "text-gray-400"
                      )}>
                        {t.memberSince}
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
                        {t.lastAccess}
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

                {/* Doctor Stats */}
              {userRole === 'DOCTOR' && (
                <Card className={cn(
                  "border backdrop-blur-sm",
                  isLightTheme 
                    ? "bg-white border-gray-200" 
                    : "bg-gray-900/40 border-gray-800/40"
                )}>
                    <CardHeader className="p-3 lg:p-4">
                    <CardTitle className={cn(
                        "text-sm lg:text-base font-light flex items-center space-x-2",
                      isLightTheme ? "text-gray-900" : "text-white"
                    )}>
                      <ChartBarIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span>{t.statistics}</span>
                    </CardTitle>
                  </CardHeader>
                    <CardContent className="p-3 lg:p-4 pt-0 space-y-2 lg:space-y-3">
                      <div className="grid grid-cols-1 gap-2 lg:gap-3">
                      <div className={cn(
                          "p-2 lg:p-3 rounded-lg border",
                        isLightTheme 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-blue-900/20 border-blue-800/40"
                      )}>
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <UsersIcon className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                          <div>
                            <p className={cn(
                                "text-base lg:text-lg font-light",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.totalPatients || 0}
                            </p>
                            <p className={cn(
                              "text-xs lg:text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-gray-400"
                            )}>
                              {t.patients}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                          "p-2 lg:p-3 rounded-lg border",
                        isLightTheme 
                          ? "bg-green-50 border-green-200" 
                          : "bg-green-900/20 border-green-800/40"
                      )}>
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <DocumentTextIcon className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
                          <div>
                            <p className={cn(
                                "text-base lg:text-lg font-light",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.totalProtocols || 0}
                            </p>
                            <p className={cn(
                              "text-xs lg:text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-gray-400"
                            )}>
                              {t.protocols}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                          "p-2 lg:p-3 rounded-lg border",
                        isLightTheme 
                          ? "bg-purple-50 border-purple-200" 
                          : "bg-purple-900/20 border-purple-800/40"
                      )}>
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <StarIcon className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600" />
                          <div>
                            <p className={cn(
                                "text-base lg:text-lg font-light",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.totalTemplates || 0}
                            </p>
                            <p className={cn(
                              "text-xs lg:text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-gray-400"
                            )}>
                              {t.templates}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

                {/* Patient Stats */}
              {userRole === 'PATIENT' && (
                <Card className={cn(
                  "border backdrop-blur-sm",
                  isLightTheme 
                    ? "bg-white border-gray-200" 
                    : "bg-gray-900/40 border-gray-800/40"
                )}>
                    <CardHeader className="p-3 lg:p-4">
                    <CardTitle className={cn(
                        "text-sm lg:text-base font-light flex items-center space-x-2",
                      isLightTheme ? "text-gray-900" : "text-white"
                    )}>
                      <ChartBarIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span>{t.myProgress}</span>
                    </CardTitle>
                  </CardHeader>
                    <CardContent className="p-3 lg:p-4 pt-0 space-y-2 lg:space-y-3">
                      <div className="grid grid-cols-1 gap-2 lg:gap-3">
                      <div className={cn(
                          "p-2 lg:p-3 rounded-lg border",
                        isLightTheme 
                          ? "bg-green-50 border-green-200" 
                          : "bg-green-900/20 border-green-800/40"
                      )}>
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <DocumentTextIcon className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
                          <div>
                            <p className={cn(
                                "text-base lg:text-lg font-light",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.completedProtocols || 0}
                            </p>
                            <p className={cn(
                              "text-xs lg:text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-gray-400"
                            )}>
                              {t.completed}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                          "p-2 lg:p-3 rounded-lg border",
                        isLightTheme 
                          ? "bg-blue-50 border-blue-200" 
                            : "bg-turquoise/15 border-turquoise/25"
                      )}>
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <ClockIcon className={cn(
                              "h-4 w-4 lg:h-5 lg:w-5",
                              isLightTheme ? "text-blue-600" : "text-turquoise"
                            )} />
                          <div>
                            <p className={cn(
                                "text-base lg:text-lg font-light",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.activeProtocols || 0}
                            </p>
                            <p className={cn(
                              "text-xs lg:text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-gray-400"
                            )}>
                              {t.active}
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
    </div>
  );
} 