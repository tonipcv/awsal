import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'
import { prisma } from '@/lib/prisma'

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request })
  const isAuthenticated = !!token

  // Lista de rotas protegidas para pacientes
  const patientRoutes = [
    '/patient/protocols',
    '/patient/checklist',
    '/patient/oneweek', 
    '/patient/circles',
    '/patient/tasks',
    '/patient/thoughts',
    '/patient/checkpoints',
    '/patient/timeblocking',
    '/patient/profile',
    '/patient/courses',
    '/patient/ai-chat',
    '/patient/referrals',
    '/doctor-info'
  ]

  // Lista de rotas protegidas para médicos
  const doctorRoutes = [
    '/doctor',
    '/clinic'
  ]

  // Lista de rotas protegidas para administradores
  const adminRoutes = [
    '/admin'
  ]

  // Lista de rotas de autenticação
  const authRoutes = ['/auth/signin', '/auth/register']
  
  const isPatientRoute = patientRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  const isDoctorRoute = doctorRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  const isAdminRoute = adminRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  const isProtectedRoute = isPatientRoute || isDoctorRoute || isAdminRoute
  
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Se for uma rota protegida e o usuário não está autenticado
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Se for uma rota de auth e o usuário já está autenticado
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Verificar role do usuário e redirecionar se necessário
  if (isAuthenticated && isProtectedRoute && token?.email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: token.email },
        select: { role: true }
      })

      if (user) {
        const userRole = user.role

        // Redirecionamentos baseados no role
        if (userRole === 'PATIENT') {
          // Se paciente está tentando acessar rota de médico/admin, redirecionar
          if (isDoctorRoute || isAdminRoute) {
            console.log('Middleware: Patient trying to access doctor/admin route, redirecting to /patient/protocols');
            return NextResponse.redirect(new URL('/patient/protocols', request.url));
          }
        } else if (userRole === 'DOCTOR') {
          // Se médico está tentando acessar rota de paciente (exceto doctor-info), redirecionar
          if (isPatientRoute && !request.nextUrl.pathname.startsWith('/doctor-info')) {
            console.log('Middleware: Doctor trying to access patient route, redirecting to /doctor/dashboard');
            return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
          }
        } else if (userRole === 'SUPER_ADMIN') {
          // Se admin está tentando acessar rota de paciente/médico (exceto doctor-info), redirecionar
          if ((isPatientRoute || isDoctorRoute) && !request.nextUrl.pathname.startsWith('/doctor-info')) {
            console.log('Middleware: Super admin trying to access patient/doctor route, redirecting to /admin');
            return NextResponse.redirect(new URL('/admin', request.url));
          }
        }
      }
    } catch (error) {
      console.error('Error checking user role in middleware:', error)
      // Em caso de erro, permitir acesso (fallback)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/protocols/:path*',
    '/checklist/:path*',
    '/oneweek/:path*',
    '/circles/:path*',
    '/tasks/:path*',
    '/thoughts/:path*',
    '/checkpoints/:path*',
    '/timeblocking/:path*',
    '/profile/:path*',
    '/doctor/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/patient/:path*',
    '/courses/:path*',
    '/clinic/:path*',
    '/doctor-info/:path*'
  ]
} 