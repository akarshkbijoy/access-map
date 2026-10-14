import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ user: null }, { status: 200 })
        }

        const user = await prisma.aPP_USER.findUnique({
            where: { user_id: BigInt(session.user_id) },
            select: {
                user_id: true,
                username: true,
                email: true,
                role: true,
                name: true
            }
        })

        if (!user) {
            return NextResponse.json({ user: null }, { status: 200 })
        }

        return NextResponse.json({
            user: {
                user_id: Number(user.user_id),
                username: user.username,
                email: user.email,
                role: user.role || session.role || 'user',
                name: user.name
            }
        }, { status: 200 })
    } catch (error: any) {
        console.error('Error fetching auth session:', error)
        return NextResponse.json({ user: null }, { status: 200 })
    }
}
