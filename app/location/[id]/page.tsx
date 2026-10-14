import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, CheckCircle, AlertTriangle, ShieldAlert, Camera, LayoutDashboard } from 'lucide-react'

export default async function LocationProfilePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)
    if (isNaN(id)) notFound()

    const location = await prisma.lOCATION.findUnique({
        where: { location_id: id },
        include: { features: true }
    })

    if (!location) notFound()

    // Fetch verified photos for this location
    const photos = await prisma.lOCATION_PHOTO.findMany({
        where: {
            location_id: id,
            status: 'verified'
        },
        include: {
            user: {
                select: { username: true }
            }
        },
        orderBy: { created_at: 'desc' }
    })

    const safePhotos = photos.map(p => ({
        photo_id: Number(p.photo_id),
        url: p.url,
        caption: p.caption,
        username: p.user.username,
        created_at: p.created_at?.toISOString() || null
    }))

    const features = location.features[0] || {}

    const daysAgo = location.lastUpdated
        ? Math.floor((new Date().getTime() - new Date(location.lastUpdated).getTime()) / (1000 * 3600 * 24))
        : null

    // Use first verified photo as cover image
    const coverPhoto = safePhotos.length > 0 ? safePhotos[0] : null

    return (
        <main className="flex min-h-screen flex-col bg-[#F7F9FC] pt-[64px]">
            <div className="mx-auto w-full max-w-4xl px-4 py-8">

                {/* Back navigation */}
                <Link href="/map" className="mb-6 inline-flex items-center text-[14px] font-bold text-[#6B7280] hover:text-[#1A73E8]">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to map
                </Link>

                {/* Header Cover & Basic Info */}
                <div className="relative mb-8 overflow-hidden rounded-[14px] bg-white shadow-sm border border-[#E4E9F0]">
                    {/* Cover Image */}
                    {coverPhoto ? (
                        <div className="h-[240px] w-full overflow-hidden">
                            <img
                                src={coverPhoto.url}
                                alt={coverPhoto.caption || location.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-[240px] w-full bg-gradient-to-r from-[#E8F0FE] to-[#F7F9FC] flex items-center justify-center">
                            <span className="text-6xl opacity-20">🖼️</span>
                        </div>
                    )}

                    <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                            <div>
                                <h1 className="text-[28px] font-bold text-[#1A1F2E] font-serif">{location.name}</h1>
                                <p className="mt-2 flex items-center text-[15px] text-[#6B7280]">
                                    <MapPin size={16} className="mr-1.5 shrink-0" />
                                    {location.address || "Address not provided"}
                                </p>
                                <div className="mt-4">
                                    <Link
                                        href={`/location/${id}/dashboard`}
                                        className="inline-flex items-center gap-2 bg-[#c3f832] text-[#292928] px-4 py-2.5 rounded-xl text-xs font-black hover:bg-[#b3ea25] transition-all shadow-xs"
                                    >
                                        <LayoutDashboard size={15} strokeWidth={2.5} />
                                        <span>View Comprehensive Dashboard & Campus Map</span>
                                    </Link>
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0 flex flex-col items-end">
                                <div className="flex items-center space-x-3">
                                    {location.status === 'verified' && (
                                        <span className="inline-flex items-center rounded-full bg-[#E6F4EA] px-3 py-1 text-[13px] font-bold text-[#0F9D58]">
                                            <CheckCircle size={14} className="mr-1.5" />
                                            Verified
                                        </span>
                                    )}
                                    {location.status === 'pending' && (
                                        <span className="inline-flex items-center rounded-full bg-[#FFF8E1] px-3 py-1 text-[13px] font-bold text-[#F4A100]">
                                            <AlertTriangle size={14} className="mr-1.5" />
                                            Pending Review
                                        </span>
                                    )}
                                    {location.status === 'flagged' && (
                                        <span className="inline-flex items-center rounded-full bg-[#FFEBEE] px-3 py-1 text-[13px] font-bold text-[#E53935]">
                                            <ShieldAlert size={14} className="mr-1.5" />
                                            Flagged Issue
                                        </span>
                                    )}
                                </div>
                                {daysAgo !== null && (
                                    <p className="mt-2 text-[12px] text-[#9CA3AF]">
                                        Last verified {daysAgo === 0 ? 'today' : `${daysAgo} days ago`}
                                    </p>
                                )}
                            </div>
                        </div>

                        {location.description && (
                            <p className="mt-6 text-[15px] leading-relaxed text-[#1A1F2E]">
                                {location.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Photo Gallery Section */}
                <div className="mb-8 rounded-[14px] bg-white p-6 shadow-sm border border-[#E4E9F0]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-bold text-[#1A1F2E] flex items-center gap-2">
                            <Camera size={18} className="text-[#6B7280]" />
                            Photos
                            {safePhotos.length > 0 && (
                                <span className="text-[12px] font-medium text-[#9CA3AF]">({safePhotos.length})</span>
                            )}
                        </h3>
                        <Link
                            href={`/location/${location.location_id}/contribute`}
                            className="text-[13px] font-bold text-[#1A73E8] hover:underline"
                        >
                            + Add Photo
                        </Link>
                    </div>

                    {safePhotos.length > 0 ? (
                        <div className="overflow-x-auto pb-2">
                            <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                                {safePhotos.map((photo) => (
                                    <div key={photo.photo_id} className="flex-shrink-0 group">
                                        <div className="w-[200px] h-[150px] rounded-lg overflow-hidden border border-[#E4E9F0] bg-[#F7F9FC]">
                                            <img
                                                src={photo.url}
                                                alt={photo.caption || 'Location photo'}
                                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="mt-1.5 w-[200px]">
                                            {photo.caption && (
                                                <p className="text-[12px] text-[#1A1F2E] font-medium truncate">{photo.caption}</p>
                                            )}
                                            <p className="text-[11px] text-[#9CA3AF]">by {photo.username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F9FC] mb-3">
                                <Camera size={24} className="text-[#9CA3AF]" />
                            </div>
                            <p className="text-[14px] font-medium text-[#6B7280] mb-1">No photos yet</p>
                            <p className="text-[13px] text-[#9CA3AF] mb-4">Be the first to add a photo of this location</p>
                            <Link
                                href={`/location/${location.location_id}/contribute`}
                                className="rounded-md bg-[#1A73E8] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-blue-700"
                            >
                                Add a Photo
                            </Link>
                        </div>
                    )}
                </div>

                {/* Detailed Stats and Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Score & Contact Box */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="rounded-[14px] bg-white p-6 shadow-sm border border-[#E4E9F0]">
                            <h3 className="mb-4 text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">Accessibility Score</h3>
                            <div className="flex items-end space-x-2">
                                <span className="text-4xl font-bold font-serif text-[#1A73E8]">
                                    {Number(location.accessibilityScore || 0).toFixed(1)}
                                </span>
                                <span className="mb-1 text-[18px] font-medium text-[#9CA3AF]">/ 5</span>
                            </div>
                        </div>

                        {location.contact && (
                            <div className="rounded-[14px] bg-white p-6 shadow-sm border border-[#E4E9F0]">
                                <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">Contact Info</h3>
                                <p className="text-[15px] font-medium text-[#1A1F2E]">{location.contact}</p>
                            </div>
                        )}
                    </div>

                    {/* Features Checklist */}
                    <div className="md:col-span-2 rounded-[14px] bg-white p-6 shadow-sm border border-[#E4E9F0]">
                        <h3 className="mb-6 text-[15px] font-bold text-[#1A1F2E]">Verified Features</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                            {[
                                { key: 'wheelchairAccessible', label: 'Wheelchair Accessible', icon: '♿' },
                                { key: 'accessibleRestrooms', label: 'Accessible Restrooms', icon: '🚻' },
                                { key: 'accessibleParking', label: 'Accessible Parking', icon: '🅿️' },
                                { key: 'rampAccess', label: 'Ramp Access Available', icon: '📐' },
                                { key: 'elevatorAccess', label: 'Elevator / Lift', icon: '🔼' },
                                { key: 'visualAudioAssistance', label: 'Visual/Audio Assistance', icon: '🔊' },
                                { key: 'wideDoorways', label: 'Wide Doorways', icon: '🚪' },
                                { key: 'levelSurfaces', label: 'Level Surfaces', icon: '⬜' },
                            ].map(f => {
                                const isChecked = features[f.key as keyof typeof features]
                                return (
                                    <div key={f.key} className="flex items-center space-x-3">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${isChecked ? 'border-[#0F9D58] bg-[#E6F4EA]' : 'border-[#E4E9F0] bg-[#F7F9FC]'}`}>
                                            {isChecked ? (
                                                <CheckCircle size={16} className="text-[#0F9D58]" />
                                            ) : (
                                                <span className="text-[12px] opacity-30">{f.icon}</span>
                                            )}
                                        </div>
                                        <span className={`text-[14px] font-medium ${isChecked ? 'text-[#1A1F2E]' : 'text-[#9CA3AF] line-through decoration-[#9CA3AF]/30'}`}>
                                            {f.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-8 border-t border-[#E4E9F0] pt-6 flex justify-between items-center">
                            <span className="text-[14px] font-medium text-[#6B7280]">Notice missing info?</span>
                            <Link href={`/location/${location.location_id}/contribute`} className="rounded-md bg-[#1A73E8] px-4 py-2 text-[14px] font-bold text-white transition hover:bg-blue-700">
                                Add Contribution
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    )
}
