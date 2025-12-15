import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Se tentar acessar /admin (exceto login)
  if (req.nextUrl.pathname.startsWith('/admin') && !req.nextUrl.pathname.startsWith('/admin/login')) {
    
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    // Verificar se é admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (!adminUser) {
      // Logado mas não é admin -> manda pra home ou login
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}