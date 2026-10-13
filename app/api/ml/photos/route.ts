import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// GET: fetch all photos that have been ML analyzed (for admin ML review tab)
export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Fetch all photos
        const photos = await prisma.lOCATION_PHOTO.findMany({
            include: {
                location: { select: { name: true, address: true } },
                user:     { select: { username: true, email: true } }
            },
            orderBy: { created_at: 'desc' }
        }) as any[]

        const safePhotos = photos.map((p: any) => ({
            photo_id: Number(p.photo_id),
            location_id: Number(p.location_id),
            url: p.url,
            caption: p.caption,
            status: p.status,
            created_at: p.created_at?.toISOString() || null,
            declared_classes: p.declared_classes || [],
            ml_analysis: p.ml_analysis,
            ml_pushed: p.ml_pushed ?? false,
            location: p.location,
            user: p.user,
        }))

        return NextResponse.json({ photos: safePhotos }, { status: 200 })
    } catch (error: any) {
        console.error('Error fetching ML photos:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH: Admin push or pull a photo from the main map application
// push = set status to 'verified', ml_pushed = true
// pull = set status back to 'pending', ml_pushed = false
export async function PATCH(req: Request) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { photo_id, action } = body // action: 'push' | 'pull'

        if (!photo_id || !action) {
            return NextResponse.json({ message: 'photo_id and action are required.' }, { status: 400 })
        }

        if (!['push', 'pull'].includes(action)) {
            return NextResponse.json({ message: 'action must be "push" or "pull".' }, { status: 400 })
        }

        const updatedPhoto = await prisma.lOCATION_PHOTO.update({
            where: { photo_id: BigInt(photo_id) },
            data: {
                ml_pushed: action === 'push',
                status: action === 'push' ? 'verified' : 'pending',
                reviewed_by: BigInt(session.user_id),
                reviewed_at: new Date(),
            }
        })

        // Sync the status to any associated contributions containing this photo
        const contributions = await prisma.cONTRIBUTION.findMany()
        for (const c of contributions) {
            if (c.media_urls && Array.isArray(c.media_urls) && c.media_urls.includes(updatedPhoto.url)) {
                await prisma.cONTRIBUTION.update({
                    where: { contribution_id: c.contribution_id },
                    data: {
                        status: action === 'push' ? 'verified' : 'pending'
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            photo_id: Number(updatedPhoto.photo_id),
            ml_pushed: updatedPhoto.ml_pushed,
            status: updatedPhoto.status,
        }, { status: 200 })
    } catch (error: any) {
        console.error('Error updating ML photo:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE: Delete a photo and its associated contributions entirely
export async function DELETE(req: Request) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const urlObj = new URL(req.url)
        const photo_id = urlObj.searchParams.get('photo_id')

        if (!photo_id) {
            return NextResponse.json({ message: 'photo_id is required' }, { status: 400 })
        }

        // Find the photo to get its URL
        const photo = await prisma.lOCATION_PHOTO.findUnique({
            where: { photo_id: BigInt(photo_id) }
        })

        if (photo) {
            // Delete the photo
            await prisma.lOCATION_PHOTO.delete({
                where: { photo_id: BigInt(photo_id) }
            })

            // Clean up associated contributions that contain this photo URL
            // (Prisma JSON filtering is limited, so we fetch and filter in memory since dataset is small)
            const contributions = await prisma.cONTRIBUTION.findMany()
            for (const c of contributions) {
                if (c.media_urls && Array.isArray(c.media_urls) && c.media_urls.includes(photo.url)) {
                    await prisma.cONTRIBUTION.delete({
                        where: { contribution_id: c.contribution_id }
                    })
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Photo and associated contribution deleted' }, { status: 200 })
    } catch (error: any) {
        console.error('Error deleting ML photo:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
