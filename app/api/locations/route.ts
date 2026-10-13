import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, address, latitude, longitude, description, contact, features } = body

        // Basic validation
        if (!name || !address || !latitude || !longitude) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Create Location with nested features
        const newLocation = await prisma.lOCATION.create({
            data: {
                name,
                address,
                latitude: parseFloat(Number(latitude).toFixed(6)),
                longitude: parseFloat(Number(longitude).toFixed(6)),
                description,
                contact,
                status: 'pending', // Default to pending so admin can review
                features: {
                    create: {
                        wheelchairAccessible: features.wheelchairAccessible || false,
                        accessibleRestrooms: features.accessibleRestrooms || false,
                        accessibleParking: features.accessibleParking || false,
                        rampAccess: features.rampAccess || false,
                        elevatorAccess: features.elevatorAccess || false,
                        visualAudioAssistance: features.visualAudioAssistance || false,
                        wideDoorways: features.wideDoorways || false,
                        levelSurfaces: features.levelSurfaces || false,
                    }
                }
            }
        })

        const safeLocation = {
            ...newLocation,
            location_id: Number(newLocation.location_id),
            latitude: Number(newLocation.latitude || 0),
            longitude: Number(newLocation.longitude || 0)
        }
        return NextResponse.json({ success: true, location: safeLocation }, { status: 201 })
    } catch (error: any) {
        console.error('Error creating location:', error)
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        )
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const q = searchParams.get('q')
        
        let whereClause = { status: 'verified' } as any
        if (q) {
            whereClause = {
                ...whereClause,
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { address: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } }
                ]
            }
        }

        const locations = await prisma.lOCATION.findMany({
            where: whereClause,
            take: 10,
            select: { location_id: true, name: true, address: true, latitude: true, longitude: true }
        })

        const safeLocations = locations.map(l => ({
            ...l, location_id: Number(l.location_id), latitude: Number(l.latitude), longitude: Number(l.longitude)
        }))

        return NextResponse.json({ locations: safeLocations }, { status: 200 })
    } catch (error: any) {
        console.error('Error fetching locations:', error)
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
    }
}
