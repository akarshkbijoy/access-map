'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, ShieldAlert, Sparkles, Settings } from 'lucide-react'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import OperationalAlertBanner from '@/components/dashboard/OperationalAlertBanner'
import CampusLevelNavigator from '@/components/dashboard/CampusLevelNavigator'
import DynamicFeatureGrid from '@/components/dashboard/DynamicFeatureGrid'
import ClaimBusinessModal from '@/components/ClaimBusinessModal'

export default function LocationDashboardPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = use(params)
    const router = useRouter()
    const locationId = parseInt(resolvedParams.id, 10)

    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)

    useEffect(() => {
        if (isNaN(locationId)) {
            setError('Invalid location ID')
            setIsLoading(false)
            return
        }

        const fetchDashboardData = async () => {
            try {
                const res = await fetch(`/api/dashboard/${locationId}`)
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Location not found')
                    throw new Error('Failed to load dashboard data')
                }
                const result = await res.json()
                setData(result)
            } catch (err: any) {
                setError(err.message || 'Error loading dashboard')
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [locationId])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#E8ECF0] flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#E4E9F0] flex items-center justify-center shadow-sm animate-pulse mb-3">
                    <Building2 className="text-[#292928]" size={24} />
                </div>
                <p className="text-sm font-bold text-[#292928]">Loading accessibility dashboard...</p>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#E8ECF0] flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-8 max-w-md w-full text-center shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
                        <ShieldAlert size={24} />
                    </div>
                    <h2 className="text-lg font-black text-[#292928] mb-1">Unable to Load Dashboard</h2>
                    <p className="text-xs text-[#6B7280] mb-6">{error || 'Location could not be found.'}</p>
                    <Link
                        href="/map"
                        className="inline-flex items-center gap-2 bg-[#292928] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Map
                    </Link>
                </div>
            </div>
        )
    }

    // Calculate score percentage
    const totalPossible = 8
    let confirmedCount = 0
    if (data.features) {
        Object.entries(data.features).forEach(([key, val]) => {
            if (val === true && !['feature_id', 'location_id'].includes(key)) confirmedCount++
        })
    }
    const scorePercentage = Math.round((confirmedCount / totalPossible) * 100)

    // Check if campus levels module is enabled and has building data
    const campusModule = data.modules?.find((m: any) => m.module_type === 'campus_levels')
    const showCampusMap = campusModule ? campusModule.is_enabled : (data.buildings && data.buildings.length > 0)

    // Get overview module for direct phone
    const overviewModule = data.modules?.find((m: any) => m.module_type === 'overview')
    const contactPhone = overviewModule?.content?.directHelpPhone || data.contact

    // Cover photo
    const coverPhoto = data.photos && data.photos.length > 0 ? data.photos[0].url : null

    return (
        <div className="min-h-screen bg-[#E8ECF0] py-8 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header with hero, score, verification status, and share */}
                <DashboardHeader
                    locationId={data.location_id}
                    name={data.name}
                    address={data.address}
                    isClaimed={data.is_claimed}
                    scorePercentage={scorePercentage}
                    canManage={data.can_manage}
                    contactPhone={contactPhone}
                    coverPhotoUrl={coverPhoto}
                />

                {/* Claim CTA Banner if unclaimed */}
                {!data.is_claimed && (
                    <div className="bg-white rounded-[20px] border border-[#E4E9F0] p-4.5 mb-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#c3f832]/30 border border-[#c3f832] flex items-center justify-center text-[#292928] shrink-0">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-[#292928]">Are you the owner or manager of this location?</h4>
                                <p className="text-xs text-[#6B7280]">
                                    Claim this location to publish floor maps, operational alerts, and tailored accessibility information.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsClaimModalOpen(true)}
                            className="bg-[#292928] text-white hover:bg-black px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                        >
                            Claim Business
                        </button>
                    </div>
                )}

                {/* Live Operational Alerts Banner */}
                <OperationalAlertBanner alerts={data.alerts} />

                {/* Multi-Level / Campus Blueprint Navigator (if configured) */}
                {showCampusMap && data.buildings && data.buildings.length > 0 && (
                    <CampusLevelNavigator buildings={data.buildings} />
                )}

                {/* Dynamic Feature Grid (renders only modules configured/enabled by owner) */}
                <DynamicFeatureGrid
                    modules={data.modules}
                    confirmedFeatures={data.features}
                />

                {/* Footer Notice */}
                <div className="text-center py-6 text-xs text-[#9CA3AF]">
                    <p>AccessMap Certified Accessibility Profile • Updated regularly for inclusive mobility</p>
                </div>
            </div>

            {/* Claim Modal */}
            <ClaimBusinessModal
                locationId={data.location_id}
                locationName={data.name}
                locationAddress={data.address}
                isOpen={isClaimModalOpen}
                onClose={() => setIsClaimModalOpen(false)}
                onClaimSuccess={() => {
                    setIsClaimModalOpen(false)
                }}
            />
        </div>
    )
}
