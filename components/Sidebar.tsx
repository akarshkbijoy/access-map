'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, Suspense } from 'react'

const MOBILITY_OPTIONS = ['Wheelchair', 'Vision', 'Hearing', 'Cognitive', 'Any']
const FEATURES = [
    { id: 'wheelchairAccessible', icon: '♿', label: 'Wheelchair Access' },
    { id: 'accessibleRestrooms', icon: '🚻', label: 'Accessible Restrooms' },
    { id: 'accessibleParking', icon: '🅿️', label: 'Accessible Parking' },
    { id: 'rampAccess', icon: '📐', label: 'Ramp Access' },
    { id: 'elevatorAccess', icon: '🔼', label: 'Elevator / Lift' },
    { id: 'visualAudioAssistance', icon: '🔊', label: 'Audio/Visual Assist' },
    { id: 'wideDoorways', icon: '🚪', label: 'Wide Doorways' },
    { id: 'levelSurfaces', icon: '⬜', label: 'Level Surfaces' }
]

export default function Sidebar() {
    return (
        <Suspense fallback={<aside className="w-[268px] h-full bg-white border-r border-[#E4E9F0] flex-shrink-0 pt-[64px]" />}>
            <SidebarContent />
        </Suspense>
    )
}

function SidebarContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // State synced with generic URL Params
    const getParam = (key: string) => searchParams.get(key)
    const getParamBool = (key: string) => searchParams.get(key) === 'true'

    const mobility = getParam('mobility') || 'Any'
    const activeFeatures = FEATURES.filter(f => getParamBool(f.id)).map(f => f.id)

    const updateFilters = useCallback((key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === null) {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        router.replace(`/?${params.toString()}`, { scroll: false })
    }, [router, searchParams])

    const toggleFeature = (id: string, active: boolean) => {
        updateFilters(id, active ? null : 'true')
    }

    const clearAll = () => {
        router.replace('/', { scroll: false })
    }

    const filterCount = activeFeatures.length + (mobility !== 'Any' ? 1 : 0)

    return (
        <aside className="w-[268px] h-full bg-white border-r border-[#E4E9F0] overflow-y-auto flex-shrink-0 flex flex-col pt-[64px] pointer-events-auto">
            <div className="p-4 flex items-center justify-between border-b border-[#E4E9F0]">
                <h2 className="text-[15px] font-bold text-[#1A1F2E]">Filters</h2>
                {filterCount > 0 && (
                    <button onClick={clearAll} className="text-[13px] font-bold text-[#1A73E8] hover:underline">
                        Clear all ({filterCount})
                    </button>
                )}
            </div>

            {/* Mobility Need */}
            <div className="p-4 border-b border-[#E4E9F0]">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#6B7280] mb-3">Mobility Need</h3>
                <div className="flex flex-wrap gap-2">
                    {MOBILITY_OPTIONS.map(opt => {
                        const isActive = mobility === opt
                        return (
                            <button
                                key={opt}
                                onClick={() => updateFilters('mobility', opt !== 'Any' ? opt : null)}
                                className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-1 ${isActive
                                    ? 'bg-[#1A73E8] text-white border border-[#1A73E8]'
                                    : 'bg-white text-[#6B7280] border border-[#E4E9F0] hover:border-[#1A73E8] hover:text-[#1A73E8]'
                                    }`}
                            >
                                {opt}
                            </button>
                        )
                    })}
                </div>
            </div>



            {/* Accessibility Features */}
            <div className="p-4 flex-1">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#6B7280] mb-3">Accessibility Features</h3>
                <div className="space-y-2">
                    {FEATURES.map(f => {
                        const isActive = activeFeatures.includes(f.id)
                        return (
                            <button
                                key={f.id}
                                onClick={() => toggleFeature(f.id, isActive)}
                                className={`w-full flex items-center justify-between p-3 rounded-[10px] border-[1.5px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A73E8] ${isActive ? 'bg-[#E8F0FE] border-[#1A73E8]' : 'bg-white border-[#E4E9F0] hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center space-x-2 text-[14px] font-medium text-[#1A1F2E]">
                                    <span>{f.icon}</span>
                                    <span>{f.label}</span>
                                </div>

                                {/* Toggle Switch */}
                                <div className={`relative inline-flex h-[18px] w-[32px] items-center rounded-full transition-colors ${isActive ? 'bg-[#1A73E8]' : 'bg-[#E4E9F0]'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-[14px]' : 'translate-x-[2px]'}`} />
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </aside>
    )
}
