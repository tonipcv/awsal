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

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<'DOCTOR' | 'PATIENT' | 'SUPER_ADMIN' | null>(null);

  // Detectar se está em páginas do médico ou admin
  const isDoctorPage = pathname?.startsWith('/doctor') || pathname?.startsWith('/clinic');
  const isAdminPage = pathname?.startsWith('/admin');
  
  // Determinar tema baseado no role do usuário e na URL
  const shouldUseLightTheme = (isDoctorPage || isAdminPage) || (userRole === 'DOCTOR' || userRole === 'SUPER_ADMIN');

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

  // Navegação para pacientes
  const patientNavSections: NavSection[] = [
    {
      title: "Planejamento",
      items: [
        {
          href: '/protocols',
          label: 'Protocolos',
          icon: CheckCircleIcon,
          description: 'Meus protocolos médicos'
        },
        {
          href: '/courses',
          label: 'Cursos',
          icon: BookOpenIcon,
          description: 'Meus cursos'
        }
      ]
    },
    {
      title: "Indicações",
      items: [
        {
          href: '/patient/referrals',
          label: 'Minhas Indicações',
          icon: UserPlusIcon,
          description: 'Meus créditos e recompensas'
        }
      ]
    }
  ];

  // Navegação para médicos
  const doctorNavSections: NavSection[] = [
    {
      title: "Gestão",
      items: [
        {
          href: '/doctor/dashboard',
          label: 'Dashboard',
          icon: PresentationChartBarIcon,
          description: 'Visão geral'
        },
        {
          href: '/clinic',
          label: 'Minha Clínica',
          icon: BuildingOfficeIcon,
          description: 'Gerenciar clínica e equipe'
        },
        {
          href: '/doctor/patients',
          label: 'Pacientes',
          icon: UsersIcon,
          description: 'Gerenciar pacientes'
        },
        {
          href: '/doctor/protocols',
          label: 'Protocolos',
          icon: DocumentTextIcon,
          description: 'Criar e gerenciar protocolos'
        },
        {
          href: '/doctor/products',
          label: 'Produtos',
          icon: CheckCircleIcon,
          description: 'Gerenciar produtos recomendados'
        },
        {
          href: '/doctor/courses',
          label: 'Cursos',
          icon: BookOpenIcon,
          description: 'Criar e gerenciar cursos'
        },
        {
          href: '/doctor/consultation-form',
          label: 'Formulário',
          icon: DocumentTextIcon,
          description: 'Personalizar formulário de consulta'
        },
        {
          href: '/doctor/templates',
          label: 'Templates',
          icon: CogIcon,
          description: 'Templates de protocolos'
        }
      ]
    },
    {
      title: "Indicações",
      items: [
        {
          href: '/doctor/referrals',
          label: 'Indicações',
          icon: UserPlusIcon,
          description: 'Gerenciar indicações recebidas'
        },
        {
          href: '/doctor/rewards',
          label: 'Recompensas',
          icon: GiftIcon,
          description: 'Configurar recompensas'
        }
      ]
    }
  ];

  // Navegação para Super Admin
  const superAdminNavSections: NavSection[] = [
    {
      title: "Administração",
      items: [
        {
          href: '/admin',
          label: 'Dashboard',
          icon: PresentationChartBarIcon,
          description: 'Painel administrativo'
        },
        {
          href: '/admin/doctors',
          label: 'Médicos',
          icon: UsersIcon,
          description: 'Gerenciar médicos'
        },
        {
          href: '/admin/subscriptions',
          label: 'Subscriptions',
          icon: ShieldCheckIcon,
          description: 'Gerenciar subscriptions'
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
          ? "text-gray-700 hover:bg-gray-100" // Doctor/Admin pages: clean light theme
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
        shouldUseLightTheme ? "text-gray-600" : "text-white"
      )} />
    )
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={cn(
        "fixed left-0 top-0 bottom-0 w-64 border-r backdrop-blur hidden lg:block z-40",
        shouldUseLightTheme
          ? "border-gray-200 bg-white" // Doctor/Admin pages: clean white background
          : "border-white/10 bg-background/50 supports-[backdrop-filter]:bg-background/30" // Patient pages: dark theme
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={cn(
            "p-6 border-b",
            shouldUseLightTheme ? "border-gray-200" : "border-white/10"
          )}>
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              {shouldUseLightTheme && (
                <span className="text-xl font-bold text-gray-900">MedFlow</span>
              )}
            </Link>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 py-6 px-4 overflow-y-auto">
            <nav className="space-y-8">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h3 className={cn(
                    "text-xs font-semibold uppercase tracking-wider px-3",
                    shouldUseLightTheme ? "text-gray-500" : "text-white/50"
                  )}>
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
          <div className={cn(
            "p-4 border-t",
            shouldUseLightTheme ? "border-gray-200" : "border-white/10"
          )}>
            <Link href="/profile">
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                shouldUseLightTheme
                  ? "hover:bg-gray-100" // Doctor/Admin pages
                  : "hover:bg-white/5" // Patient pages
              )}>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                  <UserAvatar />
                </div>
                {shouldUseLightTheme && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session?.user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className={cn(
          "fixed top-0 left-0 right-0 border-b backdrop-blur z-40",
          shouldUseLightTheme
            ? "border-gray-200 bg-white" // Doctor/Admin pages - clean white
            : "border-white/10 bg-background/50 supports-[backdrop-filter]:bg-background/30" // Patient pages
        )}>
          <div className="py-4 px-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-6 h-6">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              {shouldUseLightTheme && (
                <span className="text-lg font-bold text-gray-900">MedFlow</span>
              )}
            </Link>
            <Link href="/profile">
              <div className={cn(
                "h-8 w-8 flex items-center justify-center cursor-pointer rounded-full",
                shouldUseLightTheme
                  ? "bg-gray-100 hover:bg-gray-200" // Doctor/Admin pages - clean
                  : "border border-white/10 hover:border-white/20" // Patient pages
              )}>
                <UserAvatar />
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <nav className={cn(
          "fixed bottom-0 left-0 right-0 border-t backdrop-blur z-40",
          shouldUseLightTheme
            ? "border-gray-200 bg-white" // Doctor/Admin pages - clean white
            : "border-white/10 bg-background/50 supports-[backdrop-filter]:bg-background/30" // Patient pages
        )}>
          <div className="py-2 px-2">
            <div className="flex items-center justify-around gap-1">
              {navSections.flatMap(section => section.items).slice(0, 5).map((item) => (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-16 flex flex-col items-center justify-center gap-1 rounded-lg",
                      shouldUseLightTheme
                        ? "text-gray-600 hover:bg-gray-100" // Doctor/Admin pages: clean light theme
                        : "text-white/70 hover:bg-white/5", // Patient pages: dark theme
                      pathname === item.href 
                        ? shouldUseLightTheme
                          ? "bg-[#5154e7] text-white hover:bg-[#4145d1]" // Doctor/Admin pages active - brand color
                          : "bg-white/10 text-white" // Patient pages active
                        : ""
                    )}
                  >
                    <item.icon className="h-5 w-5 stroke-current" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
} 