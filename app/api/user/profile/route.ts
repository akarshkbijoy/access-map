import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(req: Request) {
    try {
        const authUser = await getSession()

        if (!authUser || !authUser.email) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        
        // Extract updatable fields
        const { name, username, address, phone, description } = body
        
        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (username !== undefined) updateData.username = username
        if (address !== undefined) updateData.address = address
        if (phone !== undefined) updateData.phone = phone
        if (description !== undefined) updateData.description = description

        // Validate username uniqueness if changed
        if (username !== undefined) {
            const existing = await prisma.aPP_USER.findFirst({
                where: { 
                    username, 
                    NOT: { email: authUser.email } 
                }
            })
            if (existing) {
                return NextResponse.json({ message: 'Username is already taken' }, { status: 400 })
            }
        }

        const updatedUser = await prisma.aPP_USER.update({
            where: { email: authUser.email },
            data: updateData
        })

        return NextResponse.json({ success: true, user: updatedUser })

    } catch (error: any) {
        console.error('Profile update error:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
