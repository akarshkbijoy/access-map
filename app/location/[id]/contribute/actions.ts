'use server'

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function submitContribution(locationId: number, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to contribute.' }
    }

    const comment = (formData.get('comment') as string) || ''
    
    let media_urls: string[] = []
    const mediaUrlsStr = formData.get('media_urls') as string
    if (mediaUrlsStr) {
        try {
            media_urls = JSON.parse(mediaUrlsStr)
        } catch (e) {
            console.error("Failed to parse media_urls array")
        }
    }

    // Extract features checklist
    const features = {
        wheelchairAccessible: formData.get('wheelchairAccessible') === 'on',
        accessibleRestrooms: formData.get('accessibleRestrooms') === 'on',
        accessibleParking: formData.get('accessibleParking') === 'on',
        rampAccess: formData.get('rampAccess') === 'on',
        elevatorAccess: formData.get('elevatorAccess') === 'on',
        visualAudioAssistance: formData.get('visualAudioAssistance') === 'on',
        wideDoorways: formData.get('wideDoorways') === 'on',
        levelSurfaces: formData.get('levelSurfaces') === 'on',
    }

    try {
        // Look up APP_USER via email mapped from Supabase
        // Using findFirst because we don't have unique constraint on email strictly if multiple users
        let dbUser = user ? await prisma.aPP_USER.findFirst({
            where: { email: user.email }
        }) : null;

        if (!dbUser) {
            // Fall back to anonymous user for testing
            dbUser = await prisma.aPP_USER.findFirst({ where: { username: 'anonymous' } });
            if (!dbUser) {
                dbUser = await prisma.aPP_USER.create({
                    data: { username: 'anonymous', email: 'anon@test.com', password: 'none' }
                });
            }
        }

        let contributionStatus = 'verified';
        if (media_urls.length > 0) {
            const photos = await prisma.lOCATION_PHOTO.findMany({
                where: { url: { in: media_urls } }
            });
            if (photos.some(p => !p.ml_pushed)) {
                contributionStatus = 'pending';
            }
        }

        // 2. Create Contribution Record
        await prisma.cONTRIBUTION.create({
            data: {
                location_id: BigInt(locationId),
                user_id: dbUser.user_id,
                comment: comment,
                media_urls: media_urls,
                feature_snapshot: features,
                status: contributionStatus
            }
        })

        // Revalidate location page
        revalidatePath(`/location/${locationId}`)

        return { success: true }
    } catch (error) {
        console.error('Failed to submit contribution', error)
        return { error: 'Failed to submit your contribution. Please try again later.' }
    }
}
