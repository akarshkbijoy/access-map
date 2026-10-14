import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized. Please log in first.' }, { status: 401 })
        }

        const body = await req.json()
        const {
            location_id,
            business_name,
            claimant_name,
            claimant_role,
            contact_email,
            contact_phone,
            verification_docs = [],
            notes = ''
        } = body

        if (!location_id || !business_name || !claimant_name || !claimant_role || !contact_email || !contact_phone) {
            return NextResponse.json({ message: 'Please provide all required fields.' }, { status: 400 })
        }

        const locId = BigInt(location_id)
        const location = await prisma.lOCATION.findUnique({
            where: { location_id: locId }
        })

        if (!location) {
            return NextResponse.json({ message: 'Location not found.' }, { status: 404 })
        }

        if (location.is_claimed && location.owner_id) {
            return NextResponse.json({ message: 'This business has already been claimed and verified.' }, { status: 400 })
        }

        // Check if user already submitted a pending claim for this location
        const existingClaim = await prisma.bUSINESS_CLAIM.findFirst({
            where: {
                location_id: locId,
                user_id: BigInt(session.user_id),
                status: 'pending'
            }
        })

        if (existingClaim) {
            return NextResponse.json({ message: 'You already have a pending claim for this location under review.' }, { status: 400 })
        }

        const claim = await prisma.bUSINESS_CLAIM.create({
            data: {
                location_id: locId,
                user_id: BigInt(session.user_id),
                business_name,
                claimant_name,
                claimant_role,
                contact_email,
                contact_phone,
                verification_docs: Array.isArray(verification_docs) ? verification_docs : [verification_docs],
                notes,
                status: 'pending'
            }
        })

        return NextResponse.json({
            success: true,
            claim: {
                claim_id: Number(claim.claim_id),
                location_id: Number(claim.location_id),
                status: claim.status,
                created_at: claim.created_at
            }
        }, { status: 201 })
    } catch (error: any) {
        console.error('Error creating business claim:', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(req.url)
        const locationIdParam = url.searchParams.get('location_id')
        const statusParam = url.searchParams.get('status')

        // If admin, can view all claims (or filter by status/location)
        if (session.role === 'admin') {
            const whereClause: any = {}
            if (locationIdParam) whereClause.location_id = BigInt(locationIdParam)
            if (statusParam) whereClause.status = statusParam

            const claims = await prisma.bUSINESS_CLAIM.findMany({
                where: whereClause,
                include: {
                    location: {
                        select: {
                            location_id: true,
                            name: true,
                            address: true,
                            is_claimed: true,
                            owner_id: true
                        }
                    },
                    user: {
                        select: {
                            user_id: true,
                            username: true,
                            email: true,
                            name: true
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            })

            const safeClaims = claims.map(c => ({
                claim_id: Number(c.claim_id),
                location_id: Number(c.location_id),
                user_id: Number(c.user_id),
                business_name: c.business_name,
                claimant_name: c.claimant_name,
                claimant_role: c.claimant_role,
                contact_email: c.contact_email,
                contact_phone: c.contact_phone,
                verification_docs: c.verification_docs,
                notes: c.notes,
                status: c.status,
                created_at: c.created_at?.toISOString() || null,
                reviewed_at: c.reviewed_at?.toISOString() || null,
                location: c.location ? {
                    location_id: Number(c.location.location_id),
                    name: c.location.name,
                    address: c.location.address,
                    is_claimed: c.location.is_claimed,
                    owner_id: c.location.owner_id ? Number(c.location.owner_id) : null
                } : null,
                user: c.user ? {
                    user_id: Number(c.user.user_id),
                    username: c.user.username,
                    email: c.user.email,
                    name: c.user.name
                } : null
            }))

            return NextResponse.json({ claims: safeClaims }, { status: 200 })
        }

        // Regular user: fetch only their own claims
        const userClaims = await prisma.bUSINESS_CLAIM.findMany({
            where: {
                user_id: BigInt(session.user_id),
                ...(locationIdParam ? { location_id: BigInt(locationIdParam) } : {})
            },
            include: {
                location: {
                    select: {
                        location_id: true,
                        name: true,
                        address: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        const safeUserClaims = userClaims.map(c => ({
            claim_id: Number(c.claim_id),
            location_id: Number(c.location_id),
            user_id: Number(c.user_id),
            business_name: c.business_name,
            claimant_name: c.claimant_name,
            claimant_role: c.claimant_role,
            contact_email: c.contact_email,
            contact_phone: c.contact_phone,
            verification_docs: c.verification_docs,
            notes: c.notes,
            status: c.status,
            created_at: c.created_at?.toISOString() || null,
            location: c.location ? {
                location_id: Number(c.location.location_id),
                name: c.location.name,
                address: c.location.address
            } : null
        }))

        return NextResponse.json({ claims: safeUserClaims }, { status: 200 })
    } catch (error: any) {
        console.error('Error fetching claims:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 401 })
        }

        const body = await req.json()
        const { claim_id, status } = body

        if (!claim_id || !status || !['verified', 'declined'].includes(status)) {
            return NextResponse.json({ message: 'Invalid claim ID or status.' }, { status: 400 })
        }

        const claimIdBig = BigInt(claim_id)
        const claim = await prisma.bUSINESS_CLAIM.findUnique({
            where: { claim_id: claimIdBig }
        })

        if (!claim) {
            return NextResponse.json({ message: 'Claim not found.' }, { status: 404 })
        }

        const updatedClaim = await prisma.bUSINESS_CLAIM.update({
            where: { claim_id: claimIdBig },
            data: {
                status,
                reviewed_by: BigInt(session.user_id),
                reviewed_at: new Date()
            }
        })

        if (status === 'verified') {
            // 1. Assign ownership to location
            await prisma.lOCATION.update({
                where: { location_id: claim.location_id },
                data: {
                    owner_id: claim.user_id,
                    is_claimed: true
                }
            })

            // 2. Upgrade user role to business_owner if they are standard user
            const claimantUser = await prisma.aPP_USER.findUnique({
                where: { user_id: claim.user_id }
            })
            if (claimantUser && claimantUser.role === 'user') {
                await prisma.aPP_USER.update({
                    where: { user_id: claim.user_id },
                    data: { role: 'business_owner' }
                })
            }

            // 3. Initialize default dashboard modules if none exist
            const existingModules = await prisma.dASHBOARD_MODULE.findMany({
                where: { location_id: claim.location_id }
            })

            if (existingModules.length === 0) {
                const defaultModules = [
                    {
                        location_id: claim.location_id,
                        module_type: 'overview',
                        is_enabled: true,
                        display_order: 1,
                        title: 'Facility Overview & Direct Assistance',
                        content: {
                            welcomeMessage: `Welcome to ${claim.business_name}. We are dedicated to providing accessible experiences for all visitors.`,
                            directHelpPhone: claim.contact_phone,
                            accessibilityOfficer: claim.claimant_name,
                            operatingHours: 'Mon - Sun: 9:00 AM - 10:00 PM',
                            serviceAnimalsAllowed: true,
                            wheelchairRentalAvailable: true,
                            sightedGuideAvailable: false
                        }
                    },
                    {
                        location_id: claim.location_id,
                        module_type: 'campus_levels',
                        is_enabled: true,
                        display_order: 2,
                        title: 'Building & Level Directory',
                        content: {
                            hasMultipleFloors: true,
                            description: 'Interactive directory of accessible entrances, elevators, and facilities across levels.'
                        }
                    },
                    {
                        location_id: claim.location_id,
                        module_type: 'alerts',
                        is_enabled: true,
                        display_order: 3,
                        title: 'Live Operational & Accessibility Status',
                        content: {
                            autoBroadcast: true
                        }
                    },
                    {
                        location_id: claim.location_id,
                        module_type: 'sensory_guide',
                        is_enabled: true,
                        display_order: 4,
                        title: 'Sensory & Neurodivergent Guide',
                        content: {
                            crowdPeakHours: 'Weekends 2:00 PM - 6:00 PM',
                            lightingType: 'Warm indirect LED, low glare',
                            quietSpaces: 'Quiet resting lounge located on Level 1 near East Wing',
                            soundLevel: 'Moderate background music'
                        }
                    },
                    {
                        location_id: claim.location_id,
                        module_type: 'transit_parking',
                        is_enabled: true,
                        display_order: 5,
                        title: 'Accessible Parking & Arrival',
                        content: {
                            vanAccessibleSpaces: 4,
                            standardAccessibleSpaces: 12,
                            dropOffZoneDistanceMeters: 15,
                            evChargingAccessible: true,
                            transitNotes: 'Step-free route from main bus terminal directly to Entrance A.'
                        }
                    }
                ]

                for (const mod of defaultModules) {
                    await prisma.dASHBOARD_MODULE.create({ data: mod })
                }

                // Also initialize default Campus Building and Ground Floor
                const building = await prisma.cAMPUS_BUILDING.create({
                    data: {
                        location_id: claim.location_id,
                        name: 'Main Building',
                        description: 'Primary structure with full step-free accessibility',
                        total_floors: 2,
                        display_order: 1
                    }
                })

                const groundFloor = await prisma.cAMPUS_FLOOR.create({
                    data: {
                        building_id: building.building_id,
                        floor_number: 0,
                        floor_name: 'Ground Level',
                        description: 'Main atrium, accessible restrooms, reception, and elevator hub.'
                    }
                })

                await prisma.fLOOR_POI.createMany({
                    data: [
                        {
                            floor_id: groundFloor.floor_id,
                            name: 'Main Accessible Entrance',
                            category: 'ramp',
                            x_coord: 15.0,
                            y_coord: 80.0,
                            description: 'Automatic wide sliding doors with zero threshold.'
                        },
                        {
                            floor_id: groundFloor.floor_id,
                            name: 'Central Accessible Restroom',
                            category: 'restroom',
                            x_coord: 45.0,
                            y_coord: 30.0,
                            description: 'Grab bars, emergency pull cord, adult changing table.'
                        },
                        {
                            floor_id: groundFloor.floor_id,
                            name: 'Atrium Elevator Hub',
                            category: 'elevator',
                            x_coord: 60.0,
                            y_coord: 40.0,
                            description: 'Braille buttons, voice floor announcements, 120cm wide door.'
                        }
                    ]
                })
            }
        }

        return NextResponse.json({
            success: true,
            claim: {
                claim_id: Number(updatedClaim.claim_id),
                status: updatedClaim.status,
                reviewed_at: updatedClaim.reviewed_at
            }
        }, { status: 200 })
    } catch (error: any) {
        console.error('Error updating claim:', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
