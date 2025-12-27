import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    const publicPaths = ['/login', '/signup', '/api/auth/login', '/api/auth/signup'];

    if (publicPaths.includes(pathname)) {
        if (token && (pathname === '/login' || pathname === '/signup')) {
            // Verify token just in case, if valid, redirect to dashboard
            try {
                const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                await jwtVerify(token, secret);
                return NextResponse.redirect(new URL('/', request.url));
            } catch (e) {
                // Token invalid, allow access to login/signup
            }
        }
        return NextResponse.next();
    }

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch (error) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
