import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const { username, email, password, name, address, phone, description } = await req.json()

        if (!username || !email || !password || !name) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
        }

        // Check if user exists
        const existingUser = await prisma.aPP_USER.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        })

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        const userRole = username.toLowerCase().includes('admin') ? 'admin' : 'user'

        // Create user
        const user = await prisma.aPP_USER.create({
            data: {
                username,
                email,
                name,
                address,
                phone,
                description,
                password: hashedPassword,
                role: userRole
            }
        })

        const token = await signToken({
            user_id: Number(user.user_id),
            email: user.email!,
            role: userRole
        })

        const response = NextResponse.json({ 
            success: true, 
            user: { 
                id: Number(user.user_id), 
                username: user.username, 
                email: user.email,
                role: userRole 
            } 
        }, { status: 201 })

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
        console.error('Registration error:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
