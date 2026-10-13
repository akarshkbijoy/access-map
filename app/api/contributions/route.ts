import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { location_id, user_id, comment, media_urls } = body

        if (!location_id || (!comment && (!media_urls || media_urls.length === 0))) {
            return NextResponse.json(
                { message: 'You must provide either a comment or at least one photo.' },
                { status: 400 }
            )
        }

        let userIdToUse = user_id;
        if (!userIdToUse) {
            let anon = await prisma.aPP_USER.findFirst({ where: { username: 'anonymous' } });
            if (!anon) {
                anon = await prisma.aPP_USER.create({
                    data: { username: 'anonymous', email: 'anon@test.com', password: 'none' }
                });
            }
            userIdToUse = Number(anon.user_id);
        }

        let contributionStatus = 'verified'; // Auto-approved by default
        
        // If there are photos, check their ML status. If ML rejected any, hold the contribution as pending.
        if (media_urls && media_urls.length > 0) {
            const photos = await prisma.lOCATION_PHOTO.findMany({
                where: { url: { in: media_urls } }
            });
            const anyRejected = photos.some(p => !p.ml_pushed);
            if (anyRejected) {
                contributionStatus = 'pending';
            }
        }

        // Create the contribution
        const newContribution = await prisma.cONTRIBUTION.create({
            data: {
                location_id: Number(location_id),
                user_id: Number(userIdToUse),
                comment,
                media_urls: media_urls || [],
                status: contributionStatus,
            }
        })

        const safeObj = {
            ...newContribution,
            contribution_id: Number(newContribution.contribution_id),
            location_id: Number(newContribution.location_id),
            user_id: Number(newContribution.user_id)
        }

        return NextResponse.json({ success: true, contribution: safeObj }, { status: 201 })
    } catch (error: any) {
        console.error('Error creating contribution:', error)
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        )
    }
}
