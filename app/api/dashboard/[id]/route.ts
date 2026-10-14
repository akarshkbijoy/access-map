import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const locationId = parseInt(resolvedParams.id, 10)
        if (isNaN(locationId)) {
            return NextResponse.json({ message: 'Invalid location ID' }, { status: 400 })
        }

        const session = await getSession()
        const locationBig = BigInt(locationId)

        const location = await prisma.lOCATION.findUnique({
            where: { location_id: locationBig },
            include: {
                features: true,
                dashboardModules: {
                    orderBy: { display_order: 'asc' }
                },
                campusBuildings: {
                    include: {
                        floors: {
                            include: {
                                pois: true
                            },
                            orderBy: { floor_number: 'asc' }
                        }
                    },
                    orderBy: { display_order: 'asc' }
                },
                alerts: {
                    where: { is_active: true },
                    orderBy: { created_at: 'desc' }
                },
                photos: {
                    where: { status: 'verified' },
                    take: 10
                }
            }
        })

        if (!location) {
            return NextResponse.json({ message: 'Location not found' }, { status: 404 })
        }

        const isOwner = session && location.owner_id ? Number(location.owner_id) === Number(session.user_id) : false
        const isAdmin = session?.role === 'admin'
        const canManage = Boolean(isOwner || isAdmin)

        const safeLocation = {
            location_id: Number(location.location_id),
            name: location.name,
            address: location.address,
            description: location.description,
            contact: location.contact,
            rating: location.rating ? Number(location.rating) : null,
            accessibilityScore: location.accessibilityScore ? Number(location.accessibilityScore) : null,
            is_claimed: location.is_claimed,
            owner_id: location.owner_id ? Number(location.owner_id) : null,
            status: location.status,
            latitude: location.latitude ? Number(location.latitude) : null,
            longitude: location.longitude ? Number(location.longitude) : null,
            features: location.features[0] || null,
            can_manage: canManage,
            modules: location.dashboardModules.map(m => ({
                module_id: Number(m.module_id),
                module_type: m.module_type,
                is_enabled: m.is_enabled,
                display_order: m.display_order,
                title: m.title,
                content: m.content,
                updated_at: m.updated_at?.toISOString() || null
            })),
            buildings: location.campusBuildings.map(b => ({
                building_id: Number(b.building_id),
                name: b.name,
                description: b.description,
                total_floors: b.total_floors,
                display_order: b.display_order,
                floors: b.floors.map(f => ({
                    floor_id: Number(f.floor_id),
                    floor_number: f.floor_number,
                    floor_name: f.floor_name,
                    map_image_url: f.map_image_url,
                    description: f.description,
                    pois: f.pois.map(p => ({
                        poi_id: Number(p.poi_id),
                        name: p.name,
                        category: p.category,
                        x_coord: p.x_coord ? Number(p.x_coord) : null,
                        y_coord: p.y_coord ? Number(p.y_coord) : null,
                        description: p.description
                    }))
                }))
            })),
            alerts: location.alerts.map(a => ({
                alert_id: Number(a.alert_id),
                title: a.title,
                message: a.message,
                severity: a.severity,
                is_active: a.is_active,
                starts_at: a.starts_at?.toISOString() || null,
                expires_at: a.expires_at?.toISOString() || null,
                created_at: a.created_at?.toISOString() || null
            })),
            photos: location.photos.map(p => ({
                photo_id: Number(p.photo_id),
                url: p.url,
                caption: p.caption
            }))
        }

        return NextResponse.json(safeLocation, { status: 200 })
    } catch (error: any) {
        console.error('Error fetching dashboard data:', error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const locationId = parseInt(resolvedParams.id, 10)
        if (isNaN(locationId)) {
            return NextResponse.json({ message: 'Invalid location ID' }, { status: 400 })
        }

        const session = await getSession()
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const locationBig = BigInt(locationId)
        const location = await prisma.lOCATION.findUnique({
            where: { location_id: locationBig }
        })

        if (!location) {
            return NextResponse.json({ message: 'Location not found' }, { status: 404 })
        }

        const isOwner = location.owner_id ? Number(location.owner_id) === Number(session.user_id) : false
        const isAdmin = session.role === 'admin'

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ message: 'Forbidden. Only the verified owner or admin can edit this dashboard.' }, { status: 403 })
        }

        const body = await req.json()
        const { action } = body

        // Action 1: Update or save modules
        if (action === 'save_modules') {
            const { modules } = body
            if (!Array.isArray(modules)) {
                return NextResponse.json({ message: 'Modules must be an array' }, { status: 400 })
            }

            for (const mod of modules) {
                await prisma.dASHBOARD_MODULE.upsert({
                    where: {
                        location_id_module_type: {
                            location_id: locationBig,
                            module_type: mod.module_type
                        }
                    },
                    create: {
                        location_id: locationBig,
                        module_type: mod.module_type,
                        is_enabled: mod.is_enabled ?? true,
                        display_order: mod.display_order ?? 0,
                        title: mod.title,
                        content: mod.content || {}
                    },
                    update: {
                        is_enabled: mod.is_enabled ?? true,
                        display_order: mod.display_order ?? 0,
                        title: mod.title,
                        content: mod.content || {}
                    }
                })
            }

            return NextResponse.json({ success: true, message: 'Modules updated successfully' }, { status: 200 })
        }

        // Action 2: Add or update an alert
        if (action === 'save_alert') {
            const { alert_id, title, message, severity, is_active } = body
            if (!title || !message) {
                return NextResponse.json({ message: 'Title and message are required' }, { status: 400 })
            }

            if (alert_id) {
                await prisma.lOCATION_ALERT.update({
                    where: { alert_id: BigInt(alert_id) },
                    data: {
                        title,
                        message,
                        severity: severity || 'info',
                        is_active: is_active ?? true
                    }
                })
            } else {
                await prisma.lOCATION_ALERT.create({
                    data: {
                        location_id: locationBig,
                        title,
                        message,
                        severity: severity || 'info',
                        is_active: is_active ?? true
                    }
                })
            }

            return NextResponse.json({ success: true, message: 'Alert saved' }, { status: 200 })
        }

        // Action 3: Delete an alert
        if (action === 'delete_alert') {
            const { alert_id } = body
            if (!alert_id) return NextResponse.json({ message: 'alert_id required' }, { status: 400 })

            await prisma.lOCATION_ALERT.delete({
                where: { alert_id: BigInt(alert_id) }
            })

            return NextResponse.json({ success: true, message: 'Alert deleted' }, { status: 200 })
        }

        // Action 4: Save building / floor / POI
        if (action === 'save_campus') {
            const { buildings } = body
            if (Array.isArray(buildings)) {
                for (const b of buildings) {
                    let buildingIdBig: bigint
                    if (b.building_id && Number(b.building_id) > 0) {
                        buildingIdBig = BigInt(b.building_id)
                        await prisma.cAMPUS_BUILDING.update({
                            where: { building_id: buildingIdBig },
                            data: {
                                name: b.name,
                                description: b.description,
                                total_floors: b.total_floors || 1
                            }
                        })
                    } else {
                        const newB = await prisma.cAMPUS_BUILDING.create({
                            data: {
                                location_id: locationBig,
                                name: b.name || 'Main Building',
                                description: b.description,
                                total_floors: b.total_floors || 1
                            }
                        })
                        buildingIdBig = newB.building_id
                    }

                    if (Array.isArray(b.floors)) {
                        for (const f of b.floors) {
                            let floorIdBig: bigint
                            if (f.floor_id && Number(f.floor_id) > 0) {
                                floorIdBig = BigInt(f.floor_id)
                                await prisma.cAMPUS_FLOOR.update({
                                    where: { floor_id: floorIdBig },
                                    data: {
                                        floor_name: f.floor_name,
                                        floor_number: f.floor_number ?? 0,
                                        description: f.description,
                                        map_image_url: f.map_image_url
                                    }
                                })
                            } else {
                                const newF = await prisma.cAMPUS_FLOOR.create({
                                    data: {
                                        building_id: buildingIdBig,
                                        floor_name: f.floor_name || 'Floor',
                                        floor_number: f.floor_number ?? 0,
                                        description: f.description,
                                        map_image_url: f.map_image_url
                                    }
                                })
                                floorIdBig = newF.floor_id
                            }

                            if (Array.isArray(f.pois)) {
                                for (const p of f.pois) {
                                    if (p.poi_id && Number(p.poi_id) > 0) {
                                        await prisma.fLOOR_POI.update({
                                            where: { poi_id: BigInt(p.poi_id) },
                                            data: {
                                                name: p.name,
                                                category: p.category,
                                                description: p.description,
                                                x_coord: p.x_coord !== undefined ? p.x_coord : null,
                                                y_coord: p.y_coord !== undefined ? p.y_coord : null
                                            }
                                        })
                                    } else {
                                        await prisma.fLOOR_POI.create({
                                            data: {
                                                floor_id: floorIdBig,
                                                name: p.name,
                                                category: p.category || 'help_desk',
                                                description: p.description,
                                                x_coord: p.x_coord !== undefined ? p.x_coord : null,
                                                y_coord: p.y_coord !== undefined ? p.y_coord : null
                                            }
                                        })
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return NextResponse.json({ success: true, message: 'Campus layout saved' }, { status: 200 })
        }

        // Action 5: Save general details (overview, description, contact)
        if (action === 'save_general') {
            const { description, contact } = body
            await prisma.lOCATION.update({
                where: { location_id: locationBig },
                data: {
                    ...(description !== undefined && { description }),
                    ...(contact !== undefined && { contact }),
                    lastUpdated: new Date()
                }
            })
            return NextResponse.json({ success: true, message: 'General info updated' }, { status: 200 })
        }

        return NextResponse.json({ message: 'Invalid action parameter' }, { status: 400 })
    } catch (error: any) {
        console.error('Error updating dashboard:', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
