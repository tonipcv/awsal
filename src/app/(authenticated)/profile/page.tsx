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

  if (loading) {
    return (
      <div className={cn(
        "min-h-screen",
        isLightTheme ? "bg-white" : "bg-zinc-950"
      )}>
        <div className={cn(
          "container max-w-6xl mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8",
          isLightTheme && "lg:ml-64"
        )}>
          
          {/* Header Skeleton */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className={cn(
                "h-8 rounded-lg w-32 animate-pulse",
                isLightTheme ? "bg-gray-200" : "bg-zinc-700"
              )}></div>
              <div className={cn(
                "h-5 rounded-lg w-64 animate-pulse",
                isLightTheme ? "bg-gray-100" : "bg-zinc-800"
              )}></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card Skeleton */}
              <div className="lg:col-span-2">
                <div className={cn(
                  "shadow-lg rounded-2xl border",
                  isLightTheme 
                    ? "bg-white border-gray-200" 
                    : "bg-zinc-900 border-zinc-800"
                )}>
                  <div className="p-8">
                    <div className={cn(
                      "h-6 rounded w-48 animate-pulse mb-8",
                      isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                    )}></div>
                    
                    {/* Profile Image Skeleton */}
                    <div className="flex flex-col items-center space-y-6 mb-8">
                      <div className={cn(
                        "w-32 h-32 rounded-2xl animate-pulse",
                        isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                      )}></div>
                      <div className="text-center space-y-2">
                        <div className={cn(
                          "h-4 rounded w-56 animate-pulse mx-auto",
                          isLightTheme ? "bg-gray-100" : "bg-zinc-800"
                        )}></div>
                        <div className={cn(
                          "h-6 rounded-lg w-20 animate-pulse mx-auto",
                          isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                        )}></div>
                      </div>
                    </div>

                    {/* Form Fields Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <div className={cn(
                          "h-4 rounded w-16 animate-pulse",
                          isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                        )}></div>
                        <div className={cn(
                          "h-12 rounded-xl border animate-pulse",
                          isLightTheme ? "bg-gray-50 border-gray-200" : "bg-zinc-800 border-zinc-700"
                        )}></div>
                      </div>
                      <div className="space-y-4">
                        <div className={cn(
                          "h-4 rounded w-20 animate-pulse",
                          isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                        )}></div>
                        <div className={cn(
                          "h-12 rounded-xl border animate-pulse",
                          isLightTheme ? "bg-gray-50 border-gray-200" : "bg-zinc-800 border-zinc-700"
                        )}></div>
                      </div>
                    </div>

                    {/* Action Buttons Skeleton */}
                    <div className="pt-6 space-y-4">
                      <div className={cn(
                        "h-12 rounded-xl w-32 animate-pulse",
                        isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                      )}></div>
                      <div className={cn(
                        "h-12 rounded-xl w-full animate-pulse",
                        isLightTheme ? "bg-gray-100" : "bg-zinc-800"
                      )}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="space-y-6">
                {/* Account Info Card Skeleton */}
                <div className={cn(
                  "shadow-lg rounded-2xl border",
                  isLightTheme 
                    ? "bg-white border-gray-200" 
                    : "bg-zinc-900 border-zinc-800"
                )}>
                  <div className="p-6">
                    <div className={cn(
                      "h-6 rounded w-28 animate-pulse mb-6",
                      isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                    )}></div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className={cn(
                          "h-4 rounded w-24 animate-pulse",
                          isLightTheme ? "bg-gray-100" : "bg-zinc-800"
                        )}></div>
                        <div className={cn(
                          "h-4 rounded w-20 animate-pulse",
                          isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                        )}></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className={cn(
                          "h-4 rounded w-20 animate-pulse",
                          isLightTheme ? "bg-gray-100" : "bg-zinc-800"
                        )}></div>
                        <div className={cn(
                          "h-4 rounded w-16 animate-pulse",
                          isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                        )}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Card Skeleton */}
                <div className={cn(
                  "shadow-lg rounded-2xl border",
                  isLightTheme 
                    ? "bg-white border-gray-200" 
                    : "bg-zinc-900 border-zinc-800"
                )}>
                  <div className="p-6">
                    <div className={cn(
                      "h-6 rounded w-24 animate-pulse mb-6",
                      isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                    )}></div>
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={cn(
                          "p-4 rounded-xl border",
                          isLightTheme 
                            ? "bg-gray-50 border-gray-200" 
                            : "bg-zinc-800 border-zinc-700"
                        )}>
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "h-6 w-6 rounded animate-pulse",
                              isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                            )}></div>
                            <div className="flex-1 space-y-2">
                              <div className={cn(
                                "h-6 rounded w-12 animate-pulse",
                                isLightTheme ? "bg-gray-200" : "bg-zinc-700"
                              )}></div>
                              <div className={cn(
                                "h-4 rounded w-16 animate-pulse",
                                isLightTheme ? "bg-gray-100" : "bg-zinc-800"
                              )}></div>
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
    );
  }

  const roleInfo = getRoleDisplay();
  const RoleIcon = roleInfo.icon;

  return (
    <div className={cn(
      "min-h-screen", 
      isLightTheme ? "bg-white" : "bg-zinc-950"
    )}>
      <div className={cn(
        "container max-w-6xl mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8",
        isLightTheme && "lg:ml-64"
      )}>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className={cn(
              "text-3xl font-bold mb-2",
              isLightTheme ? "text-gray-900" : "text-white"
            )}>
              Profile
            </h1>
            <p className={cn(
              "font-medium",
              isLightTheme ? "text-gray-600" : "text-zinc-400"
            )}>
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <Card className={cn(
                "shadow-lg rounded-2xl",
                isLightTheme 
                  ? "bg-white border-gray-200" 
                  : "bg-zinc-900 border-zinc-800"
              )}>
                <CardHeader className="p-8">
                  <CardTitle className={cn(
                    "text-xl font-bold",
                    isLightTheme ? "text-gray-900" : "text-white"
                  )}>
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-8">
                  {/* Profile Image */}
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative group">
                      <div className={cn(
                        "relative w-32 h-32 rounded-2xl overflow-hidden border-4",
                        isLightTheme 
                          ? "border-gray-200 bg-gray-100" 
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
                              isLightTheme ? "text-gray-400" : "text-zinc-500"
                            )} />
                          </div>
                        )}
                      </div>
                      <label 
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl"
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
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5154e7]"></div>
                        </div>
                      )}
                    </div>
                    <div className="text-center space-y-2">
                      <p className={cn(
                        "text-sm font-medium",
                        isLightTheme ? "text-gray-600" : "text-zinc-400"
                      )}>
                        Click on the image to change your profile picture
                      </p>
                      <Badge className={cn("rounded-lg px-3 py-1", roleInfo.color)}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className={cn(
                        "text-sm font-semibold flex items-center space-x-2",
                        isLightTheme ? "text-gray-900" : "text-zinc-300"
                      )}>
                        <UserIcon className="h-4 w-4" />
                        <span>Name</span>
                      </label>
                      {isEditing ? (
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={cn(
                            "h-12 rounded-xl font-medium",
                            isLightTheme 
                              ? "border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#5154e7] focus:ring-[#5154e7]" 
                              : "border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-400 focus:border-[#5154e7] focus:ring-[#5154e7]"
                          )}
                        />
                      ) : (
                        <p className={cn(
                          "text-lg font-semibold p-3 rounded-xl border",
                          isLightTheme 
                            ? "text-gray-900 bg-gray-50 border-gray-200" 
                            : "text-white bg-zinc-800 border-zinc-700"
                        )}>
                          {name || 'Not provided'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className={cn(
                        "text-sm font-semibold flex items-center space-x-2",
                        isLightTheme ? "text-gray-900" : "text-zinc-300"
                      )}>
                        <EnvelopeIcon className="h-4 w-4" />
                        <span>Email</span>
                      </label>
                      <p className={cn(
                        "text-lg font-semibold p-3 rounded-xl border",
                        isLightTheme 
                          ? "text-gray-900 bg-gray-50 border-gray-200" 
                          : "text-white bg-zinc-800 border-zinc-700"
                      )}>
                        {email || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-6 space-y-4">
                    {isEditing ? (
                      <div className="flex gap-4">
                        <Button 
                          onClick={() => handleSave()}
                          className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold"
                        >
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          className={cn(
                            "rounded-xl h-12 px-6 font-semibold",
                            isLightTheme 
                              ? "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white" 
                              : "border-zinc-700 text-zinc-300 hover:bg-zinc-800 bg-zinc-900"
                          )}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold"
                      >
                        Edit Profile
                      </Button>
                    )}

                    <Button 
                      variant="ghost" 
                      className={cn(
                        "w-full rounded-xl h-12 font-semibold",
                        isLightTheme 
                          ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" 
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                      )}
                      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              {/* Account Info */}
              <Card className={cn(
                "shadow-lg rounded-2xl",
                isLightTheme 
                  ? "bg-white border-gray-200" 
                  : "bg-zinc-900 border-zinc-800"
              )}>
                <CardHeader className="p-6">
                  <CardTitle className={cn(
                    "text-lg font-bold flex items-center space-x-2",
                    isLightTheme ? "text-gray-900" : "text-white"
                  )}>
                    <CalendarIcon className="h-5 w-5" />
                    <span>Account Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-sm font-medium",
                        isLightTheme ? "text-gray-600" : "text-zinc-400"
                      )}>
                        Member since
                      </span>
                      <span className={cn(
                        "text-sm font-semibold",
                        isLightTheme ? "text-gray-900" : "text-white"
                      )}>
                        {formatDate(userStats.joinedDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-sm font-medium",
                        isLightTheme ? "text-gray-600" : "text-zinc-400"
                      )}>
                        Last login
                      </span>
                      <span className={cn(
                        "text-sm font-semibold",
                        isLightTheme ? "text-gray-900" : "text-white"
                      )}>
                        {formatDate(userStats.lastLogin)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              {userRole === 'DOCTOR' && (
                <Card className={cn(
                  "shadow-lg rounded-2xl",
                  isLightTheme 
                    ? "bg-white border-gray-200" 
                    : "bg-zinc-900 border-zinc-800"
                )}>
                  <CardHeader className="p-6">
                    <CardTitle className={cn(
                      "text-lg font-bold flex items-center space-x-2",
                      isLightTheme ? "text-gray-900" : "text-white"
                    )}>
                      <ChartBarIcon className="h-5 w-5" />
                      <span>Statistics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className={cn(
                        "p-4 rounded-xl border",
                        isLightTheme 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-blue-900/20 border-blue-800"
                      )}>
                        <div className="flex items-center space-x-3">
                          <UsersIcon className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className={cn(
                              "text-2xl font-bold",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.totalPatients || 0}
                            </p>
                            <p className={cn(
                              "text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-zinc-400"
                            )}>
                              Patients
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "p-4 rounded-xl border",
                        isLightTheme 
                          ? "bg-green-50 border-green-200" 
                          : "bg-green-900/20 border-green-800"
                      )}>
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-6 w-6 text-green-600" />
                          <div>
                            <p className={cn(
                              "text-2xl font-bold",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.totalProtocols || 0}
                            </p>
                            <p className={cn(
                              "text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-zinc-400"
                            )}>
                              Protocols
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "p-4 rounded-xl border",
                        isLightTheme 
                          ? "bg-purple-50 border-purple-200" 
                          : "bg-purple-900/20 border-purple-800"
                      )}>
                        <div className="flex items-center space-x-3">
                          <StarIcon className="h-6 w-6 text-purple-600" />
                          <div>
                            <p className={cn(
                              "text-2xl font-bold",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.totalTemplates || 0}
                            </p>
                            <p className={cn(
                              "text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-zinc-400"
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
                  "shadow-lg rounded-2xl",
                  isLightTheme 
                    ? "bg-white border-gray-200" 
                    : "bg-zinc-900 border-zinc-800"
                )}>
                  <CardHeader className="p-6">
                    <CardTitle className={cn(
                      "text-lg font-bold flex items-center space-x-2",
                      isLightTheme ? "text-gray-900" : "text-white"
                    )}>
                      <ChartBarIcon className="h-5 w-5" />
                      <span>My Progress</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className={cn(
                        "p-4 rounded-xl border",
                        isLightTheme 
                          ? "bg-green-50 border-green-200" 
                          : "bg-green-900/20 border-green-800"
                      )}>
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-6 w-6 text-green-600" />
                          <div>
                            <p className={cn(
                              "text-2xl font-bold",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.completedProtocols || 0}
                            </p>
                            <p className={cn(
                              "text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-zinc-400"
                            )}>
                              Completed
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={cn(
                        "p-4 rounded-xl border",
                        isLightTheme 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-blue-900/20 border-blue-800"
                      )}>
                        <div className="flex items-center space-x-3">
                          <ClockIcon className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className={cn(
                              "text-2xl font-bold",
                              isLightTheme ? "text-gray-900" : "text-white"
                            )}>
                              {userStats.activeProtocols || 0}
                            </p>
                            <p className={cn(
                              "text-sm font-medium",
                              isLightTheme ? "text-gray-600" : "text-zinc-400"
                            )}>
                              Active
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