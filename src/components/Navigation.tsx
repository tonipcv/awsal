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
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from 'react';

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
}

// Hook para buscar informações do médico dos protocolos ativos
function useDoctorInfo() {
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch('/api/protocols/doctor-info');
        if (response.ok) {
          const data = await response.json();
          setDoctorInfo(data.doctor);
        }
      } catch (error) {
        console.error('Error fetching doctor info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorInfo();
  }, [session]);

  return { doctorInfo, isLoading };
}

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<'DOCTOR' | 'PATIENT' | 'SUPER_ADMIN' | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const { doctorInfo } = useDoctorInfo();

  // Detectar se está em páginas do médico ou admin
  const isDoctorPage = pathname?.startsWith('/doctor') || pathname?.startsWith('/clinic');
  const isAdminPage = pathname?.startsWith('/admin');
  const isProtocolsPage = pathname === '/protocols';
  const isChecklistPage = pathname?.startsWith('/checklist');
  
  // Determinar role inicial baseado na URL para evitar flash
  const getInitialRole = () => {
    if (isAdminPage) return 'SUPER_ADMIN';
    if (isDoctorPage) return 'DOCTOR';
    return 'PATIENT';
  };

  // Determinar tema baseado no role do usuário e na URL
  const shouldUseLightTheme = (isDoctorPage || isAdminPage) || (userRole === 'DOCTOR' || userRole === 'SUPER_ADMIN');

  // Detectar role do usuário
  useEffect(() => {
    const detectUserRole = async () => {
      if (session?.user?.id) {
        try {
          setIsLoadingRole(true);
          const response = await fetch('/api/auth/role');
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
          } else {
            console.error('Error detecting user role:', response.status);
            setUserRole(getInitialRole()); // Use URL-based fallback
          }
        } catch (error) {
          console.error('Error detecting user role:', error);
          setUserRole(getInitialRole()); // Use URL-based fallback
        } finally {
          setIsLoadingRole(false);
        }
      } else {
        // Se não há sessão, use role baseado na URL
        setUserRole(getInitialRole());
        setIsLoadingRole(false);
      }
    };

    detectUserRole();
  }, [session, pathname]);

  // Lista de rotas protegidas onde a navegação deve aparecer
  const protectedRoutes = [
    '/protocols',
    '/courses',
    '/checklist',
    '/oneweek',
    '/circles',
    '/thoughts',
    '/profile',
    '/doctor',
    '/admin',
    '/clinic',
    '/patient'
  ];

  // Só mostrar navegação em rotas protegidas
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));
  if (!isProtectedRoute) {
    return null;
  }

  // Se ainda está carregando o role, não renderizar nada para evitar flash
  if (isLoadingRole) {
    return null;
  }

  // Navegação para pacientes
  const patientNavSections: NavSection[] = [
    {
      title: "Planning",
      items: [
        {
          href: '/protocols',
          label: 'Protocols',
          icon: CheckCircleIcon,
          description: 'My medical protocols'
        },
        {
          href: '/courses',
          label: 'Courses',
          icon: BookOpenIcon,
          description: 'My courses'
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
  ];

  // Navegação para médicos
  const doctorNavSections: NavSection[] = [
    {
      title: "Management",
      items: [
        {
          href: '/doctor/dashboard',
          label: 'Dashboard',
          icon: PresentationChartBarIcon,
          description: 'Overview'
        },
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
          href: '/doctor/protocols',
          label: 'Protocols',
          icon: DocumentTextIcon,
          description: 'Create and manage protocols'
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
        },
        {
          href: '/doctor/consultation-form',
          label: 'Form',
          icon: DocumentTextIcon,
          description: 'Customize consultation form'
        },
        {
          href: '/doctor/templates',
          label: 'Templates',
          icon: CogIcon,
          description: 'Protocol templates'
        }
      ]
    },
    {
      title: "Referrals",
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
        }
      ]
    }
  ];

  // Navegação para Super Admin
  const superAdminNavSections: NavSection[] = [
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
          href: '/admin/subscriptions',
          label: 'Subscriptions',
          icon: ShieldCheckIcon,
          description: 'Manage subscriptions'
        }
      ]
    }
  ];

  // Selecionar navegação baseada no role
  const navSections = userRole === 'SUPER_ADMIN' ? superAdminNavSections :
                     userRole === 'DOCTOR' ? doctorNavSections : 
                     patientNavSections;

  const NavButton = ({ item, className }: { item: typeof navSections[0]['items'][0], className?: string }) => (
    <Button
      variant="ghost"
      className={cn(
        "w-full h-12 flex items-center justify-start gap-3 px-3 rounded-lg font-medium transition-all duration-200",
        shouldUseLightTheme
          ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900" // Doctor/Admin pages: clean light theme with better hover contrast
          : "text-white/70 hover:bg-white/5", // Patient pages: dark theme
        pathname === item.href 
          ? shouldUseLightTheme
            ? "bg-[#5154e7] text-white hover:bg-[#4145d1] shadow-sm" // Doctor/Admin pages active - brand color
            : "bg-white/10 text-white" // Patient pages active
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

  return (
    <>
      {/* Desktop Navigation - Only for Doctors and Admins */}
      {(userRole === 'DOCTOR' || userRole === 'SUPER_ADMIN') && (
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
              <Link href="/profile">
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
            {userRole === 'PATIENT' ? (
              // Patient Header - Always show logo, and doctor info when available
              <>
                <div className="flex items-center gap-3">
                  <Link href="/" className="flex items-center">
                    <div className="relative w-6 h-6">
                      <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </Link>
                </div>
                <div className="flex items-center">
                  {doctorInfo && (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col text-right">
                        <span className="text-xs text-gray-400">{doctorInfo.name}</span>
                      </div>
                      <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-700 border border-gray-600">
                        <DoctorAvatar doctor={doctorInfo} />
                      </div>
                    </div>
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
                <Link href="/profile">
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
        {userRole === 'PATIENT' && !isChecklistPage ? (
          // Patient Bottom Navigation - App Style (Mobile Only)
          <nav className="fixed bottom-0 left-0 right-0 z-40">
            <div className="bg-[#111111]/95 backdrop-blur-xl border-t border-gray-800 shadow-2xl">
              <div className="px-4 py-2">
                <div className="flex items-center justify-around">
                  {patientNavSections.flatMap(section => section.items).map((item) => (
                    <Link key={item.href} href={item.href} className="flex-1 max-w-[50px]">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full h-10 flex items-center justify-center rounded-full transition-all duration-300",
                          pathname === item.href 
                            ? "bg-gradient-to-t from-blue-500 to-blue-600 text-white shadow-lg scale-110" 
                            : "text-gray-400 hover:bg-gray-800 hover:text-white hover:scale-105"
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 stroke-current transition-all duration-300",
                          pathname === item.href ? "drop-shadow-sm" : ""
                        )} />
                      </Button>
                    </Link>
                  ))}
                  {/* Profile Button */}
                  <Link href="/profile" className="flex-1 max-w-[50px]">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full h-10 flex items-center justify-center rounded-full transition-all duration-300",
                        pathname === '/profile' 
                          ? "bg-gradient-to-t from-blue-500 to-blue-600 text-white shadow-lg scale-110" 
                          : "text-gray-400 hover:bg-gray-800 hover:text-white hover:scale-105"
                      )}
                    >
                      <UserCircleIcon className={cn(
                        "h-4 w-4 stroke-current transition-all duration-300",
                        pathname === '/profile' ? "drop-shadow-sm" : ""
                      )} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        ) : userRole !== 'PATIENT' ? (
          // Doctor/Admin Navigation - Original Style (Mobile Only)
          <nav className="fixed bottom-0 left-0 right-0 border-t backdrop-blur z-40 border-gray-200 bg-white">
            <div className="py-2 px-2">
              <div className="flex items-center justify-around gap-1">
                {navSections.flatMap(section => section.items).slice(0, 5).map((item) => (
                  <Link key={item.href} href={item.href} className="flex-1">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full h-16 flex flex-col items-center justify-center gap-1 rounded-lg",
                        "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                        pathname === item.href 
                          ? "bg-[#5154e7] text-white hover:bg-[#4145d1]"
                          : ""
                      )}
                    >
                      <item.icon className="h-6 w-6 stroke-current" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        ) : null}
      </div>

      {/* Desktop Navigation for Patients - Sidebar Style */}
      {userRole === 'PATIENT' && (
        <>
          {/* Desktop Sidebar for Patients */}
          <nav className="fixed left-0 top-0 bottom-0 w-64 border-r backdrop-blur hidden lg:block z-40 border-gray-800 bg-[#111111]/95">
            <div className="flex flex-col h-full">
              {/* Logo Section */}
              <div className="p-6 border-b border-gray-800">
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

              {/* Doctor Info Section - if available */}
              {doctorInfo && (
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-700 border border-gray-600">
                      <DoctorAvatar doctor={doctorInfo} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Médico responsável</p>
                      <p className="text-sm font-medium text-white truncate">
                        {doctorInfo.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                                "text-white/70 hover:bg-white/5",
                                pathname === item.href 
                                  ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-500/30" 
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
                <Link href="/profile">
                  <div className="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-800/50">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700">
                      <UserAvatar />
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
            </div>
          </nav>

          {/* Desktop Header for Patients - Simplified */}
          <div className="fixed top-0 left-0 right-0 z-30 hidden lg:block lg:ml-64">
            <div className="bg-[#111111]/95 backdrop-blur-xl border-b border-gray-800 shadow-sm">
              <div className="px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Breadcrumb or page title can go here */}
                  </div>
                  <div className="flex items-center">
                    {/* Additional header content can go here */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Page Wrapper Component for automatic padding adjustment
export function PageWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<'DOCTOR' | 'PATIENT' | 'SUPER_ADMIN' | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const detectUserRole = async () => {
      if (session?.user?.id) {
        try {
          setIsLoadingRole(true);
          const response = await fetch('/api/auth/role');
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
          } else {
            setUserRole('PATIENT');
          }
        } catch (error) {
          setUserRole('PATIENT');
        } finally {
          setIsLoadingRole(false);
        }
      }
    };

    detectUserRole();
  }, [session]);

  return (
    <div className={cn(
      "min-h-screen",
      "lg:ml-64", // Add sidebar margin for all users on desktop (both patients and doctors/admins have sidebar)
      className
    )}>
      <div className={cn(
        "p-4 lg:pl-6 lg:pr-4",
        userRole === 'PATIENT' 
          ? "pt-[88px] pb-24 lg:pt-[88px] lg:pb-4" // Patients: mobile header + desktop header, mobile bottom nav only
          : "pt-[88px] pb-24 lg:pt-6 lg:pb-4" // Doctors/Admins: mobile header, no desktop header
      )}>
        {children}
      </div>
    </div>
  );
} 