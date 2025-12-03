import { signOut } from '@/lib/actions/auth';
import { NextResponse } from 'next/server';

export async function POST() {
    await signOut();
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL!));
}
