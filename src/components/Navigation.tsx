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
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Image from "next/image";

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

  // Lista de rotas protegidas onde a navegação deve aparecer
  const protectedRoutes = [
    '/checklist',
    '/oneweek',
    '/circles',
    '/tasks',
    '/thoughts',
    '/checkpoints',
    '/timeblocking',
    '/profile'
  ];

  // Só mostrar navegação em rotas protegidas
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));
  if (!isProtectedRoute) {
    return null;
  }

  const navSections: NavSection[] = [
    {
      title: "Planejamento",
      items: [
        {
          href: '/checklist',
          label: 'Checklist',
          icon: CheckCircleIcon,
          description: 'Checklist mensal de hábitos'
        },
        {
          href: '/checkpoints',
          label: 'Checkpoints',
          icon: CheckIcon,
          description: 'Pontos de controle'
        },
        {
          href: '/tasks',
          label: 'Tarefas',
          icon: CalendarDaysIcon,
          description: 'Matriz de Eisenhower'
        },
        {
          href: '/timeblocking',
          label: 'Time Blocking',
          icon: ClockIcon,
          description: 'Blocos de tempo'
        },
        {
          href: '/thoughts',
          label: 'Pensamentos',
          icon: ChatBubbleLeftIcon,
          description: 'Registro de pensamentos'
        }
      ]
    }
  ];

  const NavButton = ({ item, className }: { item: typeof navSections[0]['items'][0], className?: string }) => (
    <Button
      variant="outline"
      className={cn(
        "w-full h-14 flex items-center justify-center bg-transparent",
        pathname === item.href 
          ? "border-white/20 text-white hover:bg-white/5" 
          : "border-white/10 text-white/70 hover:border-white/20 hover:text-white hover:bg-white/5",
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
      <UserCircleIcon className="h-3.5 w-3.5 text-white" />
    )
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-20 border-r border-white/10 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 hidden lg:block z-40">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <Link href="/" className="flex items-center justify-center">
              <span className="text-sm font-normal text-white tracking-wide">BOOP</span>
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
          <div className="p-6 border-t border-white/10">
            <Link href="/profile">
              <div className="w-10 h-10 flex items-center justify-center cursor-pointer border border-white/10 rounded-full hover:border-white/20 mx-auto">
                <UserAvatar />
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 border-b border-white/10 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-40">
          <div className="py-4 px-4 flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <span className="text-sm font-normal text-white tracking-wide">BOOP</span>
            </Link>
            <Link href="/profile">
              <div className="h-7 w-7 flex items-center justify-center cursor-pointer border border-white/10 rounded-full hover:border-white/20">
                <UserAvatar />
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-40">
          <div className="py-3 px-4">
            <div className="flex items-center justify-around gap-2">
              {navSections.flatMap(section => section.items).map((item) => (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-14 flex items-center justify-center bg-transparent",
                      pathname === item.href 
                        ? "border-white/20 text-white hover:bg-white/5" 
                        : "border-white/10 text-white/70 hover:border-white/20 hover:text-white hover:bg-white/5"
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