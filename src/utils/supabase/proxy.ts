import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Rotas públicas (não precisam de login ou são APIs)
  const publicRoutes = ['/', '/auth', '/api'];
  const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith(r));

  // Rotas de onboarding (não redirecionar de volta)
  const isOnboarding = pathname.startsWith('/onboarding');

  // 1. Usuário não logado tentando acessar rota protegida → login
  if (!user && !isPublic && !isOnboarding) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 2. Usuário logado — checar se já completou onboarding
  if (user && !isOnboarding && pathname !== '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('genres')
      .eq('id', user.id)
      .single();

    const hasCompletedOnboarding = profile?.genres && profile.genres.length > 0;

    // Usuário logado sem onboarding tentando acessar app → redirecionar para onboarding
    if (!hasCompletedOnboarding && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
  }

  // 3. Usuário logado acessando a tela de login com onboarding já feito → discover
  if (user && pathname === '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('genres')
      .eq('id', user.id)
      .single();

    const hasCompleted = profile?.genres && profile.genres.length > 0;
    const url = request.nextUrl.clone();
    url.pathname = hasCompleted ? '/discover' : '/onboarding';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
