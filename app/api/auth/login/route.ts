import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        // Find user
        const user = await prisma.aPP_USER.findUnique({
            where: { email }
        })

        if (!user || !user.password) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        const role = user.role || (user.username.toLowerCase().includes('admin') ? 'admin' : 'user')

        const token = await signToken({
            user_id: Number(user.user_id),
            email: user.email!,
            role: role
        })

        const response = NextResponse.json({ 
            success: true, 
            user: { 
                id: Number(user.user_id), 
                username: user.username, 
                email: user.email,
                role 
            } 
        }, { status: 200 })

        // Set HTTP-only cookie
        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        return response
    } catch (error: any) {
        console.error('Login error:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
