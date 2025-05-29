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
      variant="outline"
      className={cn(
        "w-full h-14 flex items-center justify-center",
        shouldUseLightTheme
          ? "bg-white border-slate-200" // Doctor/Admin pages: solid light theme
          : "bg-transparent", // Patient pages: dark theme
        pathname === item.href 
          ? shouldUseLightTheme
            ? "!border-slate-400 !text-slate-800 hover:!bg-slate-100" // Doctor/Admin pages active - using !important to override
            : "border-white/20 text-white hover:bg-white/5" // Patient pages active
          : shouldUseLightTheme
            ? "!border-slate-200 !text-slate-600 hover:!border-slate-300 hover:!text-slate-700 hover:!bg-slate-50" // Doctor/Admin pages inactive - using !important
            : "border-white/10 text-white/70 hover:border-white/20 hover:text-white hover:bg-white/5", // Patient pages inactive
        className
      )}
    >
      <item.icon className="h-4 w-4 stroke-current" />
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
        "h-3.5 w-3.5",
        shouldUseLightTheme ? "!text-slate-600" : "text-white"
      )} />
    )
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={cn(
        "fixed left-0 top-0 bottom-0 w-20 border-r backdrop-blur hidden lg:block z-40",
        shouldUseLightTheme
          ? "border-slate-200 bg-slate-50 supports-[backdrop-filter]:bg-slate-50" // Doctor/Admin pages: solid light theme
          : "border-white/10 bg-background/50 supports-[backdrop-filter]:bg-background/30" // Patient pages: dark theme
      )}>
        <div className="flex flex-col h-full">
          <div className={cn(
            "p-6 border-b",
            shouldUseLightTheme ? "border-slate-200" : "border-white/10"
          )}>
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
          <div className="flex-1 py-6">
            <nav className="space-y-6 px-2">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  {section.items.map((item) => (
                    <Link key={item.href} href={item.href} className="block">
                      <NavButton item={item} />
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
          <div className={cn(
            "p-6 border-t",
            shouldUseLightTheme ? "border-slate-200" : "border-white/10"
          )}>
            <Link href="/profile">
              <div className={cn(
                "w-10 h-10 flex items-center justify-center cursor-pointer border rounded-full mx-auto",
                shouldUseLightTheme
                  ? "border-slate-300 hover:border-slate-400 bg-white" // Doctor/Admin pages
                  : "border-white/10 hover:border-white/20" // Patient pages
              )}>
                <UserAvatar />
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
            ? "border-slate-200 bg-slate-50 supports-[backdrop-filter]:bg-slate-50" // Doctor/Admin pages - solid
            : "border-white/10 bg-background/50 supports-[backdrop-filter]:bg-background/30" // Patient pages
        )}>
          <div className="py-4 px-4 flex justify-between items-center">
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
            <Link href="/profile">
              <div className={cn(
                "h-7 w-7 flex items-center justify-center cursor-pointer border rounded-full",
                shouldUseLightTheme
                  ? "border-slate-300 hover:border-slate-400 bg-white" // Doctor/Admin pages - solid
                  : "border-white/10 hover:border-white/20" // Patient pages
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
            ? "border-slate-200 bg-slate-50 supports-[backdrop-filter]:bg-slate-50" // Doctor/Admin pages - solid
            : "border-white/10 bg-background/50 supports-[backdrop-filter]:bg-background/30" // Patient pages
        )}>
          <div className="py-3 px-4">
            <div className="flex items-center justify-around gap-2">
              {navSections.flatMap(section => section.items).slice(0, 5).map((item) => (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-14 flex items-center justify-center",
                      shouldUseLightTheme
                        ? "bg-white border-slate-200" // Doctor/Admin pages: solid light theme
                        : "bg-transparent", // Patient pages: dark theme
                      pathname === item.href 
                        ? shouldUseLightTheme
                          ? "!border-slate-400 !text-slate-800 hover:!bg-slate-100" // Doctor/Admin pages active - using !important
                          : "border-white/20 text-white hover:bg-white/5" // Patient pages active
                        : shouldUseLightTheme
                          ? "!border-slate-200 !text-slate-600 hover:!border-slate-300 hover:!text-slate-700 hover:!bg-slate-50" // Doctor/Admin pages inactive - using !important
                          : "border-white/10 text-white/70 hover:border-white/20 hover:text-white hover:bg-white/5" // Patient pages inactive
                    )}
                  >
                    <item.icon className="h-4 w-4 stroke-current" />
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