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

export default function DoctorProfilePage() {
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

            // Redirect if not a doctor
            if (roleData.role !== 'DOCTOR' && roleData.role !== 'SUPER_ADMIN') {
              router.push('/profile');
              return;
            }

            // Load doctor stats
            const statsResponse = await fetch('/api/doctor/stats');
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              setUserStats(stats);
            }
          } else {
            router.push('/profile');
            return;
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          router.push('/profile');
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [session, router]);

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
        return { label: 'Doctor', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: UserIcon };
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: ShieldCheckIcon };
      default:
        return { label: 'Doctor', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: UserIcon };
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

  // Loading state
  if (!session || loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8">
            <div className="space-y-8">
              
              {/* Header Skeleton */}
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>

              {/* Content Grid Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Profile Card Skeleton */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
                    
                    {/* Profile Image Skeleton */}
                    <div className="flex flex-col items-center space-y-4 mb-6">
                      <div className="w-24 h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>

                    {/* Form Fields Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                      </div>
                    </div>

                    {/* Buttons Skeleton */}
                    <div className="space-y-3">
                      <div className="h-12 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
                      <div className="h-12 bg-gray-200 rounded-xl w-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-6">
                  {/* Account Info Skeleton */}
                  <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                    <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Skeleton */}
                  <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                            <div className="flex-1">
                              <div className="h-5 bg-gray-200 rounded w-8 mb-1 animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
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
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8">
          <div className="space-y-8">
            
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Profile
              </h1>
              <p className="text-gray-600 font-medium">
                Manage your personal information and account settings
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Profile Card */}
              <div className="lg:col-span-2">
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Profile Image */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                          {image ? (
                            <Image
                              key={imageKey}
                              src={image}
                              alt="Profile"
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <UserIcon className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        <label
                          htmlFor="image-upload"
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          ) : (
                            <CameraIcon className="h-6 w-6 text-white" />
                          )}
                        </label>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </div>
                      <Badge className={cn("text-sm font-medium border", roleInfo.color)}>
                        <RoleIcon className="h-4 w-4 mr-2" />
                        {roleInfo.label}
                      </Badge>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Name</label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isEditing}
                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">Email</label>
                        <Input
                          value={email}
                          disabled
                          className="border-gray-300 bg-gray-50 text-gray-500 rounded-xl h-12"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {!isEditing ? (
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold"
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      ) : (
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleSave()}
                            className="flex-1 bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold"
                          >
                            Save Changes
                          </Button>
                          <Button
                            onClick={() => {
                              setIsEditing(false);
                              setName(session?.user?.name || '');
                            }}
                            variant="outline"
                            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 px-6 font-semibold"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => signOut({ callbackUrl: 'https://app.cxlus.com/auth/signin' })}
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-xl h-12 font-semibold"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                
                {/* Account Information */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <EnvelopeIcon className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Member since</span>
                      <span className="text-sm text-gray-900 font-semibold">
                        {formatDate(userStats.joinedDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Last login</span>
                      <span className="text-sm text-gray-900 font-semibold">
                        {formatDate(userStats.lastLogin)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Doctor Statistics */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <ChartBarIcon className="h-5 w-5" />
                      Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center space-x-3">
                        <UsersIcon className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold text-blue-900">
                            {userStats.totalPatients || 0}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">Total Patients</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold text-green-900">
                            {userStats.totalProtocols || 0}
                          </div>
                          <div className="text-sm text-green-600 font-medium">Total Protocols</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <div className="flex items-center space-x-3">
                        <StarIcon className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="text-2xl font-bold text-purple-900">
                            {userStats.totalTemplates || 0}
                          </div>
                          <div className="text-sm text-purple-600 font-medium">Templates Created</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 