'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UsersIcon,
  HeartIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Translations for internationalization
const translations = {
  pt: {
    yourResponsibleDoctor: 'Seu Médico Responsável',
    sendEmail: 'Enviar Email',
    call: 'Ligar',
    contact: 'Contato',
    email: 'Email',
    phone: 'Telefone',
    clinic: 'Clínica',
    quickAccess: 'Acesso Rápido',
    viewProtocols: 'Ver Protocolos',
    viewCourses: 'Ver Cursos',
    noDoctorAssigned: 'Nenhum médico atribuído',
    contactSupportForDoctor: 'Entre em contato com o suporte para obter um médico responsável.',
    loadingDoctorInfo: 'Carregando informações do médico...'
  },
  en: {
    yourResponsibleDoctor: 'Your Responsible Doctor',
    sendEmail: 'Send Email',
    call: 'Call',
    contact: 'Contact',
    email: 'Email',
    phone: 'Phone',
    clinic: 'Clinic',
    quickAccess: 'Quick Access',
    viewProtocols: 'View Protocols',
    viewCourses: 'View Courses',
    noDoctorAssigned: 'No doctor assigned',
    contactSupportForDoctor: 'Contact support to get a responsible doctor.',
    loadingDoctorInfo: 'Loading doctor information...'
  }
};

interface DoctorInfo {
  id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  createdAt: string;
  role: string;
  totalPatients: number;
  totalProtocols: number;
  activeProtocols: number;
  clinic?: {
    id: string;
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    website?: string;
    logo?: string;
  };
}

export default function DoctorInfoPage() {
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');

  // Detect browser language
  useEffect(() => {
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'pt';
    const detectedLang = browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'pt';
    setLanguage(detectedLang);
  }, []);

  const t = translations[language];

  useEffect(() => {
    const loadDoctorInfo = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/patient/doctor-info');
        if (response.ok) {
          const data = await response.json();
          setDoctorInfo(data);
        }
      } catch (error) {
        console.error('Error loading doctor info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctorInfo();
  }, []);

  const formatAddress = (clinic: DoctorInfo['clinic']) => {
    if (!clinic) return null;
    
    const parts = [
      clinic.address,
      clinic.city,
      clinic.state
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
          <div className="max-w-4xl mx-auto px-3 lg:px-6">
            <div className="space-y-6 pt-4 lg:pt-6">
              
              {/* Hero Section Skeleton */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-turquoise/10 to-blue-600/10 border border-turquoise/20">
                <div className="p-8 lg:p-12">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-32 h-32 bg-gray-800/50 rounded-2xl animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="h-8 bg-gray-800/50 rounded w-48 mx-auto animate-pulse"></div>
                      <div className="h-6 bg-gray-700/50 rounded w-32 mx-auto animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm">
                    <div className="p-6">
                      <div className="h-6 bg-gray-800/50 rounded w-32 mb-4 animate-pulse"></div>
                      <div className="space-y-3">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!doctorInfo) {
    return (
      <div className="min-h-screen bg-black">
        <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
          <div className="max-w-4xl mx-auto px-3 lg:px-6">
            <div className="space-y-6 pt-4 lg:pt-6">
              
              {/* Empty State */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/20 to-gray-900/20 border border-gray-700/30">
                <div className="p-12 lg:p-16 text-center">
                  <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-light text-white mb-4">
                    {t.noDoctorAssigned}
                  </h1>
                  <p className="text-lg text-gray-300 leading-relaxed max-w-md mx-auto">
                    {t.contactSupportForDoctor}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
        <div className="max-w-4xl mx-auto px-3 lg:px-6">
          <div className="space-y-6 pt-4 lg:pt-6">
            
            {/* Hero Section - Doctor Profile */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-turquoise/10 to-blue-600/10 border border-turquoise/20">
              <div className="absolute inset-0 bg-gradient-to-br from-turquoise/5 to-transparent"></div>
              <div className="relative p-8 lg:p-12">
                <div className="flex flex-col items-center text-center space-y-6">
                  
                  {/* Doctor Avatar */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-turquoise/30 bg-gray-800/50 shadow-2xl">
                      {doctorInfo.image ? (
                        <Image
                          src={doctorInfo.image}
                          alt={doctorInfo.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserIcon className="h-16 w-16 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-turquoise rounded-full flex items-center justify-center border-4 border-black">
                      <ShieldCheckIcon className="h-4 w-4 text-black" />
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-light text-white mb-3">
                        {doctorInfo.name}
                      </h1>
                      <Badge className="bg-turquoise/20 text-turquoise border-turquoise/30 rounded-full px-4 py-2 text-sm font-medium">
                        <HeartIcon className="h-4 w-4 mr-2" />
                        {t.yourResponsibleDoctor}
                      </Badge>
                    </div>

                    {/* Quick Contact Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        asChild
                        className="bg-turquoise hover:bg-turquoise/90 text-black rounded-xl h-12 px-6 font-medium text-sm shadow-lg"
                      >
                        <Link href={`mailto:${doctorInfo.email}`}>
                          <EnvelopeIcon className="h-5 w-5 mr-2" />
                          {t.sendEmail}
                        </Link>
                      </Button>
                      {doctorInfo.phone && (
                        <Button 
                          variant="outline"
                          asChild
                          className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 bg-transparent rounded-xl h-12 px-6 font-medium text-sm"
                        >
                          <Link href={`tel:${doctorInfo.phone}`}>
                            <PhoneIcon className="h-5 w-5 mr-2" />
                            {t.call}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Contact Information */}
              <Card className="bg-gray-900/40 border border-gray-800/40 backdrop-blur-sm rounded-xl">
                <CardHeader className="p-6">
                  <CardTitle className="text-lg font-light text-white flex items-center gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-turquoise" />
                    {t.contact}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                      <div className="flex items-center gap-3 mb-2">
                        <EnvelopeIcon className="h-4 w-4 text-turquoise" />
                        <span className="text-sm text-gray-400">{t.email}</span>
                      </div>
                      <p className="text-white font-medium">{doctorInfo.email}</p>
                    </div>

                    {doctorInfo.phone && (
                      <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                        <div className="flex items-center gap-3 mb-2">
                          <PhoneIcon className="h-4 w-4 text-turquoise" />
                          <span className="text-sm text-gray-400">{t.phone}</span>
                        </div>
                        <p className="text-white font-medium">{doctorInfo.phone}</p>
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>

              {/* Clinic Information */}
              {doctorInfo.clinic && (
                <Card className="bg-gray-900/40 border border-gray-800/40 backdrop-blur-sm rounded-xl">
                  <CardHeader className="p-6">
                    <CardTitle className="text-lg font-light text-white flex items-center gap-3">
                      <BuildingOfficeIcon className="h-5 w-5 text-turquoise" />
                      {t.clinic}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    
                    {/* Clinic Header */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-turquoise/5 border border-turquoise/20">
                      {doctorInfo.clinic.logo ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-700/50 flex-shrink-0">
                          <Image
                            src={doctorInfo.clinic.logo}
                            alt={doctorInfo.clinic.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center justify-center flex-shrink-0">
                          <BuildingOfficeIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-white">
                          {doctorInfo.clinic.name}
                        </h3>
                      </div>
                    </div>

                    {/* Clinic Details */}
                    <div className="space-y-3">
                      {doctorInfo.clinic.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <PhoneIcon className="h-4 w-4 text-turquoise flex-shrink-0" />
                          <span className="text-gray-300">{doctorInfo.clinic.phone}</span>
                        </div>
                      )}
                      
                      {formatAddress(doctorInfo.clinic) && (
                        <div className="flex items-start gap-3 text-sm">
                          <MapPinIcon className="h-4 w-4 text-turquoise flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 leading-relaxed">
                            {formatAddress(doctorInfo.clinic)}
                          </span>
                        </div>
                      )}
                    </div>

                  </CardContent>
                </Card>
              )}

              {/* Quick Links */}
              <Card className="bg-gray-900/40 border border-gray-800/40 backdrop-blur-sm rounded-xl lg:col-span-2">
                <CardHeader className="p-6">
                  <CardTitle className="text-lg font-light text-white flex items-center gap-3">
                    <DocumentTextIcon className="h-5 w-5 text-turquoise" />
                    {t.quickAccess}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    <Link href="/patient/protocols" className="w-full">
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        {t.viewProtocols}
                      </Button>
                    </Link>

                    <Link href="/patient/courses" className="w-full">
                      <Button 
                        variant="outline" 
                        className="w-full border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:text-turquoise bg-transparent font-semibold px-6 py-3 rounded-xl transition-all duration-300"
                      >
                        <BookOpenIcon className="h-5 w-5 mr-2" />
                        {t.viewCourses}
                      </Button>
                    </Link>

                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 