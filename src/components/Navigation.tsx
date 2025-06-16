/* eslint-disable */
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckCircleIcon,
  UserCircleIcon,
  CheckIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  UsersIcon,
  DocumentTextIcon,
  CogIcon,
  PresentationChartBarIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  GiftIcon,
  UserPlusIcon,
  UserIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { Bot } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState, createContext, useContext, useMemo } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface DoctorInfo {
  id: string;
  name: string;
  image: string | null;
  email: string;
  clinicLogo: string | null;
  clinicName: string | null;
}

// Contexto para compartilhar o role do usuário
interface UserRoleContextType {
  userRole: 'DOCTOR' | 'PATIENT' | 'SUPER_ADMIN' | null;
  isLoadingRole: boolean;
}

const UserRoleContext = createContext<UserRoleContextType>({
  userRole: null,
  isLoadingRole: true
});

// Provider do contexto de role
export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<'DOCTOR' | 'PATIENT' | 'SUPER_ADMIN' | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const detectUserRole = async () => {
      if (session?.user?.id) {
        try {
          setIsLoadingRole(true);
          console.log('UserRoleProvider: Fetching user role for:', session.user.email);
          const response = await fetch('/api/auth/role', {
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          if (response.ok) {
            const data = await response.json();
            console.log('UserRoleProvider: Role detected:', data.role, 'for user:', session.user.email);
            setUserRole(data.role);
          } else {
            console.error('Error detecting user role:', response.status);
            setUserRole(null);
          }
        } catch (error) {
          console.error('Error detecting user role:', error);
          setUserRole(null);
        } finally {
          setIsLoadingRole(false);
        }
      } else {
        setUserRole(null);
        setIsLoadingRole(false);
      }
    };

    detectUserRole();
  }, [session]);

  return (
    <UserRoleContext.Provider value={{ userRole, isLoadingRole }}>
      {children}
    </UserRoleContext.Provider>
  );
}

// Hook para usar o contexto de role
export function useUserRole() {
  return useContext(UserRoleContext);
}

// Hook para buscar informações do médico dos protocolos ativos
function useDoctorInfo() {
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchDoctorInfo = async (forceRefresh = false) => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
      setError(null);
      
      // Add cache-busting parameter if forcing refresh
      const url = forceRefresh 
        ? `/api/protocols/doctor-info?t=${Date.now()}` 
        : '/api/protocols/doctor-info';
      
      const response = await fetch(url, {
        cache: 'no-store', // Prevent caching
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
        if (response.ok) {
          const data = await response.json();
        console.log('Doctor info fetched:', data.doctor);
          setDoctorInfo(data.doctor);
      } else {
        console.error('Failed to fetch doctor info:', response.status);
        setError(`Failed to fetch doctor info: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching doctor info:', error);
      setError('Error fetching doctor info');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchDoctorInfo();
  }, [session]);

  // Return refresh function along with state
  return { 
    doctorInfo, 
    isLoading, 
    error, 
    refreshDoctorInfo: () => fetchDoctorInfo(true) 
  };
}

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { doctorInfo } = useDoctorInfo();
  const { userRole, isLoadingRole } = useUserRole();
  
  // Estado para controlar hidratação e evitar erros de SSR
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Navegação para pacientes - memoizada para evitar re-renderizações
  const patientNavSections: NavSection[] = useMemo(() => [
    {
      title: "Planning",
      items: [
        {
          href: '/patient/protocols',
          label: 'Protocols',
          icon: CheckCircleIcon,
          description: 'My medical protocols'
        },
        {
          href: '/patient/courses',
          label: 'Courses',
          icon: BookOpenIcon,
          description: 'My courses'
        },
        {
          href: '/patient/ai-chat',
          label: 'AI Assistant',
          icon: Bot,
          description: 'Chat with AI assistant'
        }
      ]
    },
    {
      title: "Referrals",
      items: [
        {
          href: '/patient/referrals',
          label: 'My Referrals',
          icon: UserPlusIcon,
          description: 'My credits and rewards'
        }
      ]
    }
  ], []);

  // Navegação para médicos - memoizada para evitar re-renderizações
  const doctorNavSections: NavSection[] = useMemo(() => [
    {
      title: "Overview",
      items: [
        {
          href: '/doctor/dashboard',
          label: 'Dashboard',
          icon: PresentationChartBarIcon,
          description: 'Overview'
        },
        {
          href: '/doctor/intelligence',
          label: 'Intelligence',
          icon: SparklesIcon,
          description: 'Real-time patient insights and churn prevention'
        }
      ]
    },
    {
      title: "Patient Management",
      items: [
        {
          href: '/clinic',
          label: 'My Clinic',
          icon: BuildingOfficeIcon,
          description: 'Manage clinic and team'
        },
        {
          href: '/doctor/patients',
          label: 'Clients',
          icon: UsersIcon,
          description: 'Manage clients'
        },
        {
          href: '/doctor/notifications',
          label: 'Notifications',
          icon: BellIcon,
          description: 'Send notifications to patients'
        },
        {
          href: '/doctor/symptom-reports',
          label: 'Symptom Reports',
          icon: ExclamationTriangleIcon,
          description: 'Review patient symptom reports'
        }
      ]
    },
    {
      title: "Content & AI",
      items: [
        {
          href: '/doctor/protocols',
          label: 'Protocols',
          icon: DocumentTextIcon,
          description: 'Create and manage protocols'
        },
        {
          href: '/doctor/ai-assistant',
          label: 'AI Assistant',
          icon: Bot,
          description: 'Configure AI assistant and FAQs'
        },
        {
          href: '/doctor/products',
          label: 'Products',
          icon: CheckCircleIcon,
          description: 'Manage recommended products'
        },
        {
          href: '/doctor/courses',
          label: 'Courses',
          icon: BookOpenIcon,
          description: 'Create and manage courses'
        }
      ]
    },
    {
      title: "Business",
      items: [
        {
          href: '/doctor/referrals',
          label: 'Referrals',
          icon: UserPlusIcon,
          description: 'Manage received referrals'
        },
        {
          href: '/doctor/rewards',
          label: 'Rewards',
          icon: GiftIcon,
          description: 'Configure rewards'
        },
        {
          href: '/doctor/refer-clinic',
          label: 'Refer Clinic',
          icon: BuildingOfficeIcon,
          description: 'Refer clinics and earn rewards'
        }
      ]
    }
  ], []);

  // Navegação para Super Admin - memoizada para evitar re-renderizações
  const superAdminNavSections: NavSection[] = useMemo(() => [
    {
      title: "Administration",
      items: [
        {
          href: '/admin',
          label: 'Dashboard',
          icon: PresentationChartBarIcon,
          description: 'Administrative panel'
        },
        {
          href: '/admin/doctors',
          label: 'Doctors',
          icon: UsersIcon,
          description: 'Manage doctors'
        },
        {
          href: '/admin/clinics',
          label: 'Clinics',
          icon: BuildingOfficeIcon,
          description: 'Manage clinics'
        },
        {
          href: '/admin/clinic-referrals',
          label: 'Clinic Referrals',
          icon: UserPlusIcon,
          description: 'Manage clinic referrals'
        },
        {
          href: '/admin/subscriptions',
          label: 'Subscriptions',
          icon: ShieldCheckIcon,
          description: 'Manage subscriptions'
        },
        {
          href: '/admin/plans',
          label: 'Plans',
          icon: CreditCardIcon,
          description: 'Manage subscription plans'
        }
      ]
    }
  ], []);

  // Detectar se está em páginas específicas
  const isDoctorPage = pathname?.startsWith('/doctor') || pathname?.startsWith('/clinic');
  const isAdminPage = pathname?.startsWith('/admin');
  const isProtocolsPage = pathname === '/patient/protocols';
  const isChecklistPage = pathname?.startsWith('/patient/checklist');
  const isSpecificCoursePage = pathname?.match(/^\/patient\/courses\/[^\/]+/) && pathname !== '/patient/courses';
  const isDoctorInfoPage = pathname === '/doctor-info';
  const isAIChatPage = pathname === '/patient/ai-chat';
  
  // ESTRATÉGIA MELHORADA: Usar a URL como hint inicial para evitar flash
  // Se estamos em página de médico/admin, assumir esse role até a API confirmar
  // Se estamos em página de paciente ou não sabemos, assumir paciente
  const getEffectiveRole = () => {
    // Se já temos o role da API, usar ele
    if (userRole) return userRole;
    
    // Se ainda está carregando, usar hint da URL
    if (isLoadingRole) {
      if (isAdminPage) return 'SUPER_ADMIN';
      if (isDoctorPage) return 'DOCTOR';
      return 'PATIENT';
    }
    
    // Fallback para paciente se não conseguiu detectar
    return 'PATIENT';
  };
  
  const effectiveRole = getEffectiveRole();
  
  // Determinar tema baseado no role do usuário e na URL
  // /doctor-info sempre usa tema escuro (paciente), mesmo que o usuário seja médico
  const shouldUseLightTheme = !isDoctorInfoPage && ((isDoctorPage || isAdminPage) || (effectiveRole === 'DOCTOR' || effectiveRole === 'SUPER_ADMIN'));

  // Selecionar navegação baseada no role - memoizada
  const navSections = useMemo(() => {
    if (isDoctorInfoPage) return patientNavSections;
    if (effectiveRole === 'SUPER_ADMIN') return superAdminNavSections;
    if (effectiveRole === 'DOCTOR') return doctorNavSections;
    return patientNavSections;
  }, [effectiveRole, isDoctorInfoPage, patientNavSections, doctorNavSections, superAdminNavSections]);

  // Profile URL - memoizada
  const profileUrl = useMemo(() => {
    return effectiveRole === 'DOCTOR' || effectiveRole === 'SUPER_ADMIN' ? '/doctor/profile' : '/patient/profile';
  }, [effectiveRole]);
  
  // Não renderizar até que esteja hidratado
  if (!isHydrated) {
    return null;
  }

  // Se não há sessão, não mostrar navegação
  if (!session?.user?.id) {
    return null;
  }

  // Lista de rotas protegidas onde a navegação deve aparecer
  const protectedRoutes = [
    '/patient/protocols',
    '/patient/courses',
    '/patient/checklist',
    '/patient/oneweek',
    '/patient/circles',
    '/patient/thoughts',
    '/patient/profile',
    '/patient',
    '/doctor-info',
    '/doctor',
    '/admin',
    '/clinic'
  ];

  // Só mostrar navegação em rotas protegidas
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));
  if (!isProtectedRoute) {
    return null;
  }

  // Se não há role detectado após muito tempo, não mostrar navegação
  if (!isLoadingRole && !userRole) {
    return null;
  }

  const getProfileUrl = () => {
    console.log('Navigation: Profile URL for role', effectiveRole, ':', profileUrl);
    return profileUrl;
  };

  const NavButton = ({ item, className }: { item: typeof navSections[0]['items'][0], className?: string }) => (
    <Button
      variant="ghost"
      className={cn(
        "w-full h-12 flex items-center justify-start gap-3 px-3 rounded-lg font-medium transition-all duration-200",
        shouldUseLightTheme
          ? "text-gray-700 hover:bg-gray-100 hover:text-gray-800" // Doctor/Admin pages: melhor contraste no hover
          : "text-white/70 hover:bg-white/5 hover:text-white", // Patient pages: texto branco no hover
        pathname === item.href 
          ? shouldUseLightTheme
            ? "bg-[#5154e7] text-white hover:bg-[#4145d1] hover:text-white shadow-sm" // Doctor/Admin pages active - manter texto branco
            : "bg-white/10 text-white hover:text-white" // Patient pages active
          : "",
        className
      )}
    >
      <item.icon className="h-5 w-5 stroke-current flex-shrink-0" />
      <span className="text-sm truncate">{item.label}</span>
    </Button>
  );

  const UserAvatar = () => (
    session?.user?.image ? (
      <div className="relative w-full h-full rounded-full overflow-hidden">
        <Image
          src={session.user.image}
          alt="Profile"
          fill
          className="object-cover"
        />
      </div>
    ) : (
      <UserCircleIcon className={cn(
        "h-5 w-5",
        shouldUseLightTheme ? "text-gray-600" : "text-gray-300"
      )} />
    )
  );

  const DoctorAvatar = ({ doctor }: { doctor: DoctorInfo }) => (
    doctor.image ? (
      <div className="relative w-full h-full rounded-full overflow-hidden">
        <Image
          src={doctor.image}
          alt={`Dr. ${doctor.name}`}
          fill
          className="object-cover"
        />
      </div>
    ) : (
      <UserCircleIcon className="h-5 w-5 text-gray-300" />
    )
  );

  const ClinicLogo = ({ doctor }: { doctor: DoctorInfo }) => (
    doctor.clinicLogo ? (
      <div className="relative w-full h-full overflow-hidden">
        <Image
          src={doctor.clinicLogo}
          alt={doctor.clinicName || 'Clinic Logo'}
          fill
          className="object-contain"
        />
      </div>
    ) : doctor.image ? (
      <div className="relative w-full h-full rounded-full overflow-hidden">
        <Image
          src={doctor.image}
          alt={`Dr. ${doctor.name}`}
          fill
          className="object-cover"
        />
      </div>
    ) : (
      <UserCircleIcon className="h-5 w-5 text-gray-300" />
    )
  );

  return (
    <>
      {/* Desktop Navigation - For Doctors/Admins (light theme) or Doctor Info page (dark theme) */}
      {((effectiveRole === 'DOCTOR' || effectiveRole === 'SUPER_ADMIN') && !isDoctorInfoPage) && (
        <nav className={cn(
          "fixed left-0 top-0 bottom-0 w-64 border-r backdrop-blur hidden lg:block z-40",
          "border-gray-200 bg-white" // Always light theme for doctors/admins
        )}>
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-200">
              <Link href="/" className="flex items-center justify-center">
                <div className="relative w-8 h-8">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 py-6 px-4 overflow-y-auto">
              <nav className="space-y-8">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider px-3 text-gray-500">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link key={item.href} href={item.href} className="block">
                          <NavButton item={item} />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-gray-200">
              <Link href={getProfileUrl()}>
                <div className="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-100">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                    <UserAvatar />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className={cn(
          "fixed top-0 left-0 right-0 border-b backdrop-blur z-40",
          shouldUseLightTheme
            ? "border-gray-200 bg-white" // Doctor/Admin pages - clean white
            : "border-gray-800 bg-[#111111]/95 supports-[backdrop-filter]:bg-[#111111]/90" // Patient pages - dark theme
        )}>
          <div className="py-4 px-4 flex justify-between items-center">
            {(effectiveRole === 'PATIENT' || isDoctorInfoPage) ? (
              // Patient Header - Show clinic logo, and doctor info when available
              <>
                <div className="flex items-center gap-3">
                  {doctorInfo ? (
                    <Link href="/doctor-info" className="flex items-center">
                      <div className="h-8 w-12 flex items-center justify-center">
                        <ClinicLogo doctor={doctorInfo} />
                      </div>
                    </Link>
                  ) : (
                    <div className="relative w-6 h-6">
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {doctorInfo && (
                    <Link href="/doctor-info">
                      <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                      <div className="flex flex-col text-right">
                        <span className="text-xs text-gray-400">{doctorInfo.name}</span>
                      </div>
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-700 border border-gray-600">
                        <DoctorAvatar doctor={doctorInfo} />
                      </div>
                    </div>
                    </Link>
                  )}
                </div>
              </>
            ) : (
              // Doctor/Admin Header - Full header with logo and avatar
              <>
                <Link href="/" className="flex items-center gap-2">
                  <div className="relative w-6 h-6">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </Link>
                <Link href={getProfileUrl()}>
                  <div className={cn(
                    "h-8 w-8 flex items-center justify-center cursor-pointer rounded-full",
                    "bg-gray-100 hover:bg-gray-200"
                  )}>
                    <UserAvatar />
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar - Different styles for patients vs doctors/admins */}
        {(effectiveRole === 'PATIENT' || isDoctorInfoPage) && !isChecklistPage && !isSpecificCoursePage && !isAIChatPage ? (
          // Patient Bottom Navigation - App Style (Mobile Only)
          <nav className="fixed bottom-0 left-0 right-0 z-40">
            <div className="bg-[#111111]/95 backdrop-blur-xl border-t border-gray-800 shadow-2xl">
              <div className="px-4 py-2">
                <div className="flex items-center justify-around">
                  {patientNavSections.flatMap(section => section.items).map((item) => (
                    <Link key={item.href} href={item.href} className={cn(
                      "flex-1",
                      item.href === '/patient/ai-chat' ? "max-w-[70px]" : "max-w-[50px]"
                    )}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full flex items-center justify-center rounded-full transition-all duration-300",
                          item.href === '/patient/ai-chat' ? "h-12" : "h-10",
                          pathname === item.href 
                            ? "bg-gradient-to-t from-blue-500 to-blue-600 text-white shadow-lg scale-110" 
                            : "text-gray-400 hover:bg-gray-800 hover:text-white hover:scale-105"
                        )}
                      >
                        {item.href === '/patient/ai-chat' ? (
                          <div className="relative w-10 h-10">
                            <Image
                              src="/logo.png"
                              alt="Logo"
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <item.icon className={cn(
                            "h-4 w-4 stroke-current transition-all duration-300",
                            pathname === item.href ? "drop-shadow-sm" : ""
                          )} />
                        )}
                      </Button>
                    </Link>
                  ))}
                  {/* Profile Button */}
                  <Link href={getProfileUrl()} className="flex-1 max-w-[50px]">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full h-10 flex items-center justify-center rounded-full transition-all duration-300",
                        (pathname === '/patient/profile' || pathname === '/doctor/profile')
                          ? "bg-gradient-to-t from-blue-500 to-blue-600 text-white shadow-lg scale-110" 
                          : "text-gray-400 hover:bg-gray-800 hover:text-white hover:scale-105"
                      )}
                    >
                      <UserCircleIcon className={cn(
                        "h-4 w-4 stroke-current transition-all duration-300",
                        (pathname === '/patient/profile' || pathname === '/doctor/profile') ? "drop-shadow-sm" : ""
                      )} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        ) : (effectiveRole !== 'PATIENT' && !isDoctorInfoPage) ? (
          // Doctor/Admin Navigation - Horizontal Style (Mobile Only)
          <nav className="fixed bottom-0 left-0 right-0 border-t backdrop-blur z-40 border-gray-200 bg-white">
            <div className="py-2 px-2">
              <div className="flex items-center justify-around">
                {/* Dashboard */}
                <Link href="/doctor/dashboard" className="flex-1 max-w-[50px]">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-10 flex items-center justify-center rounded-full transition-all duration-300",
                      pathname === '/doctor/dashboard' 
                        ? "bg-[#5154e7] text-white shadow-lg scale-110" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-105"
                    )}
                  >
                    <PresentationChartBarIcon className={cn(
                      "h-4 w-4 stroke-current transition-all duration-300",
                      pathname === '/doctor/dashboard' ? "drop-shadow-sm" : ""
                    )} />
                  </Button>
                </Link>
                
                {/* Patients */}
                <Link href="/doctor/patients" className="flex-1 max-w-[50px]">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-10 flex items-center justify-center rounded-full transition-all duration-300",
                      pathname === '/doctor/patients' 
                        ? "bg-[#5154e7] text-white shadow-lg scale-110" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-105"
                    )}
                  >
                    <UsersIcon className={cn(
                      "h-4 w-4 stroke-current transition-all duration-300",
                      pathname === '/doctor/patients' ? "drop-shadow-sm" : ""
                    )} />
                  </Button>
                </Link>
                
                {/* Protocols */}
                <Link href="/doctor/protocols" className="flex-1 max-w-[50px]">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-10 flex items-center justify-center rounded-full transition-all duration-300",
                      pathname === '/doctor/protocols' 
                        ? "bg-[#5154e7] text-white shadow-lg scale-110" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-105"
                    )}
                  >
                    <DocumentTextIcon className={cn(
                      "h-4 w-4 stroke-current transition-all duration-300",
                      pathname === '/doctor/protocols' ? "drop-shadow-sm" : ""
                    )} />
                  </Button>
                </Link>
                
                {/* Notifications */}
                <Link href="/doctor/notifications" className="flex-1 max-w-[50px]">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-10 flex items-center justify-center rounded-full transition-all duration-300",
                      pathname === '/doctor/notifications' 
                        ? "bg-[#5154e7] text-white shadow-lg scale-110" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-105"
                    )}
                  >
                    <BellIcon className={cn(
                      "h-4 w-4 stroke-current transition-all duration-300",
                      pathname === '/doctor/notifications' ? "drop-shadow-sm" : ""
                    )} />
                  </Button>
                </Link>
                
                {/* Clinic */}
                <Link href="/clinic" className="flex-1 max-w-[50px]">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-10 flex items-center justify-center rounded-full transition-all duration-300",
                      pathname === '/clinic' 
                        ? "bg-[#5154e7] text-white shadow-lg scale-110" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-105"
                    )}
                  >
                    <BuildingOfficeIcon className={cn(
                      "h-4 w-4 stroke-current transition-all duration-300",
                      pathname === '/clinic' ? "drop-shadow-sm" : ""
                    )} />
                  </Button>
                </Link>
                
                {/* Profile */}
                <Link href={getProfileUrl()} className="flex-1 max-w-[50px]">
                    <Button
                      variant="ghost"
                      className={cn(
                      "w-full h-10 flex items-center justify-center rounded-full transition-all duration-300",
                      (pathname === '/doctor/profile')
                        ? "bg-[#5154e7] text-white shadow-lg scale-110" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-105"
                    )}
                  >
                    <UserCircleIcon className={cn(
                      "h-4 w-4 stroke-current transition-all duration-300",
                      (pathname === '/doctor/profile') ? "drop-shadow-sm" : ""
                    )} />
                    </Button>
                  </Link>
              </div>
            </div>
          </nav>
        ) : null}
      </div>

      {/* Desktop Navigation for Patients - Sidebar Style */}
      {(effectiveRole === 'PATIENT' || isDoctorInfoPage) && (
        <>
          {/* Desktop Sidebar for Patients */}
          <nav className="fixed left-0 top-0 bottom-0 w-64 border-r backdrop-blur hidden lg:block z-40 border-gray-800 bg-[#111111]/95">
            <div className="flex flex-col h-full">
              {/* Logo Section */}
              <div className="p-6 border-b border-gray-800">
                <Link href="/" className="flex items-center justify-center">
                  {doctorInfo?.clinicLogo ? (
                    <div className="relative w-20 h-12">
                      <Image
                        src={doctorInfo.clinicLogo}
                        alt={doctorInfo.clinicName || 'Clinic Logo'}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="relative w-8 h-8">
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </Link>
              </div>

              {/* Navigation Sections */}
              <div className="flex-1 py-6 px-4 overflow-y-auto">
                <nav className="space-y-8">
                  {patientNavSections.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider px-3 text-gray-500">
                        {section.title}
                      </h3>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <Link key={item.href} href={item.href} className="block">
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full h-12 flex items-center justify-start gap-3 px-3 rounded-lg font-medium transition-all duration-200",
                                "text-white/70 hover:bg-white/5 hover:text-white",
                                pathname === item.href 
                                  ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400" 
                                  : ""
                              )}
                            >
                              <item.icon className="h-5 w-5 stroke-current flex-shrink-0" />
                              <span className="text-sm truncate">{item.label}</span>
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>

              {/* User Profile Section */}
              <div className="p-4 border-t border-gray-800">
                <Link href={getProfileUrl()}>
                  <div className="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-800/50">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700">
                      {session?.user?.image ? (
                        <div className="relative w-full h-full rounded-full overflow-hidden">
                          <Image
                            src={session.user.image}
                            alt="Profile"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <UserCircleIcon className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session?.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Powered by Section */}
              <div className="p-4 border-t border-gray-800/50">
                <div className="flex items-center justify-center gap-2 opacity-60">
                  <span className="text-xs text-gray-500">Powered by</span>
                  <div className="relative w-4 h-4">
                    <Image
                      src="/logo.png"
                      alt="Boop Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Desktop Header for Patients - Simplified */}
          {/* Removed unnecessary desktop header that was creating gray area */}
        </>
      )}
    </>
  );
}

// Page Wrapper Component for automatic padding adjustment
export function PageWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  const { data: session } = useSession();
  const { userRole, isLoadingRole } = useUserRole();

  // Usar fallback para paciente se ainda estiver carregando
  const effectiveRole = userRole || 'PATIENT';

  return (
    <div className={cn(
      "min-h-screen",
      "lg:ml-64", // Add sidebar margin for all users on desktop (both patients and doctors/admins have sidebar)
      className
    )}>
      <div className={cn(
        "p-4 lg:pl-6 lg:pr-4",
        effectiveRole === 'PATIENT' 
          ? "pt-[88px] pb-24 lg:pt-6 lg:pb-4" // Patients: mobile header only, no desktop header
          : "pt-[88px] pb-24 lg:pt-6 lg:pb-4" // Doctors/Admins: mobile header, no desktop header
      )}>
        {children}
      </div>
    </div>
  );
} 