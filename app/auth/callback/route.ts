import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/map'

    if (code) {
        const supabase = await createClient()
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            // Sync user to APP_USER
            const existingUser = await prisma.aPP_USER.findFirst({
                where: { email: data.user.email },
            })

            if (!existingUser && data.user.email) {
                // Create a dummy bcrypt hash as password since Supabase handles real auth
                const dummyHash = await bcrypt.hash('supabase-auth', 10)

                // Generate a username based on email explicitly
                const username = data.user.email.split('@')[0] + '_' + Math.floor(Math.random() * 10000)

                await prisma.aPP_USER.create({
                    data: {
                        email: data.user.email,
                        username: username,
                        password: dummyHash,
                        name: data.user.user_metadata?.full_name || username,
                    }
                })
            }

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalhost = process.env.NODE_ENV === 'development'
            if (isLocalhost) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-error`)
}
