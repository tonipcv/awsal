import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request })
  const isAuthenticated = !!token

  // Lista de rotas protegidas para pacientes
  const patientRoutes = [
    '/protocols',
    '/checklist',
    '/oneweek', 
    '/circles',
    '/tasks',
    '/thoughts',
    '/checkpoints',
    '/timeblocking',
    '/profile'
  ]

  // Lista de rotas protegidas para médicos
  const doctorRoutes = [
    '/doctor'
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
    '/auth/:path*'
  ]
} 