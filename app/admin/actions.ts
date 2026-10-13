'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // In a real app we'd check if user.role === 'admin' 
    // For the prototype we're assuming any logged-in user can access admin
    return user
}

export async function approveContribution(formData: FormData) {
    const dbUser = await checkAdmin() // checkAdmin should return Supabase user object, we must lookup admin ID

    const contributionId = BigInt(formData.get('contributionId') as string)
    const locationId = BigInt(formData.get('locationId') as string)
    const score = parseFloat(formData.get('score') as string)

    try {
        const adminRecord = await prisma.aPP_USER.findUnique({ where: { email: dbUser.email } })

        // 1. Mark contribution as approved
        await prisma.cONTRIBUTION.update({
            where: { contribution_id: contributionId },
            data: { status: 'approved', reviewed_by: adminRecord?.user_id, reviewed_at: new Date() }
        })

        // 2. Update Location score (in reality this would be an aggregate, but prototype just sets it)
        await prisma.lOCATION.update({
            where: { location_id: locationId },
            data: {
                accessibilityScore: score,
                status: 'verified',
                // lastUpdated is auto-updated by DB trigger
            }
        })

        revalidatePath('/admin')
        revalidatePath(`/location/${locationId}`)
        revalidatePath('/')
    } catch (error) {
        console.error('Failed to approve', error)
    }
}

export async function rejectContribution(formData: FormData) {
    const dbUser = await checkAdmin()

    const contributionId = BigInt(formData.get('contributionId') as string)

    try {
        const adminRecord = await prisma.aPP_USER.findUnique({ where: { email: dbUser.email } })

        await prisma.cONTRIBUTION.update({
            where: { contribution_id: contributionId },
            data: { status: 'rejected', reviewed_by: adminRecord?.user_id, reviewed_at: new Date() }
        })

        revalidatePath('/admin')
    } catch (error) {
        console.error('Failed to reject', error)
    }
}
