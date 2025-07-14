import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'

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

  // Redirect clinic-specific login URLs to standard login
  if (request.nextUrl.pathname.startsWith('/login/')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

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

  // Note: Role-based redirects are now handled in individual pages/API routes
  // since Prisma cannot be used in Edge Runtime middleware
  // Each protected page should check user role and redirect accordingly

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
    '/doctor-info/:path*',
    '/login/:path*'  // Add login path to matcher
  ]
} 