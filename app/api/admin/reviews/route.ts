import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: Request) {
    try {
        const session = await getSession()

        if (!session || session.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const pendingContributions = await prisma.cONTRIBUTION.findMany({
            where: {
                status: 'pending'
            },
            include: {
                location: true,
                user: {
                    select: {
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        })

        const pendingLocations = await prisma.lOCATION.findMany({
            where: { status: 'pending' },
            orderBy: { lastUpdated: 'desc' }
        })

        const allLocations = await prisma.lOCATION.findMany({
            where: { status: 'verified' },
            include: {
                contributions: {
                    where: { status: 'verified' },
                    include: {
                        user: {
                            select: { username: true }
                        }
                    },
                    orderBy: { created_at: 'desc' }
                }
            },
            orderBy: { lastUpdated: 'desc' }
        })

        const safeContributions = pendingContributions.map(c => ({
            ...c,
            contribution_id: Number(c.contribution_id),
            location_id: Number(c.location_id),
            user_id: Number(c.user_id),
            location: c.location ? {
                ...c.location,
                location_id: Number(c.location.location_id),
                latitude: Number(c.location.latitude),
                longitude: Number(c.location.longitude),
                rating: c.location.rating ? Number(c.location.rating) : null,
                accessibilityScore: c.location.accessibilityScore ? Number(c.location.accessibilityScore) : null
            } : null
        }))

        const safeLocations = pendingLocations.map(l => ({
            ...l,
            location_id: Number(l.location_id),
            latitude: Number(l.latitude),
            longitude: Number(l.longitude),
            rating: l.rating ? Number(l.rating) : null,
            accessibilityScore: l.accessibilityScore ? Number(l.accessibilityScore) : null
        }))

        const safeAllLocations = allLocations.map(l => ({
            ...l,
            location_id: Number(l.location_id),
            latitude: Number(l.latitude),
            longitude: Number(l.longitude),
            rating: l.rating ? Number(l.rating) : null,
            accessibilityScore: l.accessibilityScore ? Number(l.accessibilityScore) : null,
            contributions: l.contributions ? l.contributions.map((c: any) => ({
                ...c,
                contribution_id: Number(c.contribution_id),
                location_id: Number(c.location_id),
                user_id: Number(c.user_id),
                reviewed_by: c.reviewed_by ? Number(c.reviewed_by) : null
            })) : []
        }))

        return NextResponse.json({ 
            contributions: safeContributions, 
            locations: safeLocations,
            allLocations: safeAllLocations
        }, { status: 200 })
    } catch (error: any) {
        console.error('Error fetching contributions:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getSession()

        if (!session || session.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { contribution_id, location_id, photo_id, status } = body

        if (status && !['verified', 'declined'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
        }

        if (contribution_id) {
            const updatedContribution = await prisma.cONTRIBUTION.update({
                where: { contribution_id: Number(contribution_id) },
                data: {
                    status,
                    reviewed_by: session.user_id,
                    reviewed_at: new Date()
                }
            })

            const safeContribution = {
                ...updatedContribution,
                contribution_id: Number(updatedContribution.contribution_id),
                location_id: Number(updatedContribution.location_id),
                user_id: Number(updatedContribution.user_id),
                reviewed_by: updatedContribution.reviewed_by ? Number(updatedContribution.reviewed_by) : null
            }
            return NextResponse.json({ success: true, contribution: safeContribution }, { status: 200 })

        } else if (location_id) {
            
            // if we are updating verifying status
            if (status) {
                const updatedLocation = await prisma.lOCATION.update({
                    where: { location_id: Number(location_id) },
                    data: { status }
                })
                
                const safeLocation = {
                    ...updatedLocation,
                    location_id: Number(updatedLocation.location_id),
                    latitude: Number(updatedLocation.latitude),
                    longitude: Number(updatedLocation.longitude),
                    rating: updatedLocation.rating ? Number(updatedLocation.rating) : null,
                    accessibilityScore: updatedLocation.accessibilityScore ? Number(updatedLocation.accessibilityScore) : null
                }
                return NextResponse.json({ success: true, location: safeLocation }, { status: 200 })
            }

            // if we are editing text fields
            const { name, address, description } = body
            if (name || address || description !== undefined) {
                 const updatedLocation = await prisma.lOCATION.update({
                    where: { location_id: Number(location_id) },
                    data: {
                        ...(name && { name }),
                        ...(address && { address }),
                        ...(description !== undefined && { description }),
                        lastUpdated: new Date()
                    }
                })

                const safeLocation = {
                    ...updatedLocation,
                    location_id: Number(updatedLocation.location_id),
                    latitude: Number(updatedLocation.latitude),
                    longitude: Number(updatedLocation.longitude),
                    rating: updatedLocation.rating ? Number(updatedLocation.rating) : null,
                    accessibilityScore: updatedLocation.accessibilityScore ? Number(updatedLocation.accessibilityScore) : null
                }
                return NextResponse.json({ success: true, location: safeLocation }, { status: 200 })
            }
        }

        return NextResponse.json({ message: 'Missing ID' }, { status: 400 })


    } catch (error: any) {
        console.error('Error updating contribution:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getSession()

        if (!session || session.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(req.url)
        const location_id = url.searchParams.get('id')
        const contribution_id = url.searchParams.get('contribution_id')

        if (contribution_id) {
            const contribution = await prisma.cONTRIBUTION.findUnique({
                where: { contribution_id: Number(contribution_id) }
            })
            
            if (contribution && contribution.media_urls && Array.isArray(contribution.media_urls) && contribution.media_urls.length > 0) {
                await prisma.lOCATION_PHOTO.deleteMany({
                    where: { url: { in: contribution.media_urls as string[] } }
                })
            }

            await prisma.cONTRIBUTION.delete({
                where: { contribution_id: Number(contribution_id) }
            })
            return NextResponse.json({ success: true, message: 'Contribution deleted' }, { status: 200 })
        }

        if (location_id) {
            await prisma.cONTRIBUTION.deleteMany({
                where: { location_id: Number(location_id) }
            })

            await prisma.uSER_LOCATION.deleteMany({
                where: { location_id: Number(location_id) }
            })

            await prisma.aCCESSIBILITY_FEATURE.deleteMany({
                where: { location_id: Number(location_id) }
            })

            await prisma.lOCATION.delete({
                where: { location_id: Number(location_id) }
            })

            return NextResponse.json({ success: true }, { status: 200 })
        }

        return NextResponse.json({ message: 'Missing Location ID or Contribution ID' }, { status: 400 })

    } catch (error: any) {
        console.error('Error deleting location:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
