'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getDBUserOrThrow() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to perform this action.')

    const dbUser = await prisma.aPP_USER.findUnique({ where: { email: user.email } })
    if (!dbUser) throw new Error('Database user missing')

    return dbUser
}

export async function flagLocation(locationId: number) {
    try {
        await getDBUserOrThrow() // Requires auth

        // Fetch current flag count
        const loc = await prisma.lOCATION.findUnique({ where: { location_id: BigInt(locationId) } })
        if (!loc) return { error: 'Location not found' }

        const newFlagCount = (loc.flagCount || 0) + 1
        const newStatus = newFlagCount >= 3 ? 'flagged' : loc.status

        await prisma.lOCATION.update({
            where: { location_id: BigInt(locationId) },
            data: {
                flagCount: newFlagCount,
                status: newStatus
            }
        })

        revalidatePath(`/location/${locationId}`)
        revalidatePath('/')
        return { success: true, flagged: newStatus === 'flagged' }
    } catch (err: any) {
        return { error: err.message || 'Failed to flag location' }
    }
}

export async function toggleSaveLocation(locationId: number) {
    try {
        const dbUser = await getDBUserOrThrow()

        // Check if saved
        const existing = await prisma.uSER_LOCATION.findFirst({
            where: { user_id: dbUser.user_id, location_id: BigInt(locationId) }
        })

        if (existing) {
            // Unsave
            await prisma.uSER_LOCATION.delete({
                where: { user_location_id: existing.user_location_id }
            })
            revalidatePath('/')
            return { saved: false }
        } else {
            // Save
            await prisma.uSER_LOCATION.create({
                data: {
                    user_id: dbUser.user_id,
                    location_id: BigInt(locationId),
                }
            })
            revalidatePath('/')
            return { saved: true }
        }
    } catch (err: any) {
        return { error: err.message || 'Failed to toggle save' }
    }
}
