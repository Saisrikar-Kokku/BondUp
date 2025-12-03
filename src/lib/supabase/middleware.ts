import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    const supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        supabaseResponse.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protected routes - redirect to login if not authenticated
    if (
        !user &&
        (request.nextUrl.pathname.startsWith('/feed') ||
            request.nextUrl.pathname.startsWith('/profile') ||
            request.nextUrl.pathname.startsWith('/messages') ||
            request.nextUrl.pathname.startsWith('/notifications'))
    ) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages
    if (
        user &&
        (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')
    ) {
        const url = request.nextUrl.clone();
        url.pathname = '/feed';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
