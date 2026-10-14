'use client'

import { Check, Phone, Clock, Volume2, Sun, HeartHandshake, Car, Bus, Eye, Sparkles } from 'lucide-react'

export interface DashboardModuleData {
    module_id: number;
    module_type: string;
    is_enabled: boolean;
    display_order: number;
    title?: string | null;
    content: any;
}

interface DynamicFeatureGridProps {
    modules: DashboardModuleData[];
    confirmedFeatures?: any;
}

export default function DynamicFeatureGrid({ modules, confirmedFeatures }: DynamicFeatureGridProps) {
    const enabledModules = (modules || []).filter(m => m.is_enabled)

    // Helper to format accessibility boolean flags
    const formatFeatureName = (str: string) => str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

    const activeConfirmedFeatures: string[] = []
    if (confirmedFeatures) {
        Object.entries(confirmedFeatures).forEach(([key, val]) => {
            if (val === true && !['feature_id', 'location_id'].includes(key)) {
                activeConfirmedFeatures.push(formatFeatureName(key))
            }
        })
    }

    return (
        <div className="space-y-6 mb-8">
            {/* Confirmed Structural Features Pill Card (always shown if features exist) */}
            {activeConfirmedFeatures.length > 0 && (
                <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="p-1.5 rounded-lg bg-[#c3f832] text-[#292928]">
                            <Sparkles size={16} strokeWidth={2.5} />
                        </span>
                        <h3 className="text-lg font-black text-[#292928] tracking-tight">
                            Verified Structural Accessibility
                        </h3>
                    </div>
                    <p className="text-xs text-[#6B7280] mb-4">
                        Core physical access criteria verified on location
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                        {activeConfirmedFeatures.map(f => (
                            <div
                                key={f}
                                className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E4E9F0] text-xs font-bold text-[#292928] flex items-center gap-2 shadow-2xs"
                            >
                                <span className="w-4 h-4 rounded-full bg-[#c3f832] flex items-center justify-center text-[#292928] text-[10px]">
                                    ✓
                                </span>
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Dynamically enabled modules chosen by the business owner */}
            {enabledModules.map((mod) => {
                const c = mod.content || {}

                // MODULE: Overview & Direct Assistance
                if (mod.module_type === 'overview') {
                    return (
                        <div key={mod.module_id} className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 md:p-8 shadow-sm">
                            <h3 className="text-lg font-black text-[#292928] tracking-tight mb-1">
                                {mod.title || 'Facility Overview & Direct Assistance'}
                            </h3>
                            <p className="text-xs text-[#6B7280] mb-6">
                                Direct accessibility guidelines and personal assistance contact
                            </p>

                            {c.welcomeMessage && (
                                <p className="text-sm text-[#4B5563] leading-relaxed mb-6 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E4E9F0]">
                                    {c.welcomeMessage}
                                </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {c.directHelpPhone && (
                                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0]">
                                        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase block mb-1">Accessibility Hotline</span>
                                        <a href={`tel:${c.directHelpPhone}`} className="text-sm font-black text-[#1A73E8] flex items-center gap-1.5 hover:underline">
                                            <Phone size={14} /> {c.directHelpPhone}
                                        </a>
                                        {c.accessibilityOfficer && (
                                            <span className="text-[11px] text-[#6B7280] block mt-1">Lead: {c.accessibilityOfficer}</span>
                                        )}
                                    </div>
                                )}

                                {c.operatingHours && (
                                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0]">
                                        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase block mb-1">Hours of Access</span>
                                        <span className="text-sm font-bold text-[#292928] flex items-center gap-1.5">
                                            <Clock size={14} className="text-[#6B7280]" /> {c.operatingHours}
                                        </span>
                                    </div>
                                )}

                                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0] space-y-1.5">
                                    <span className="text-[11px] font-bold text-[#9CA3AF] uppercase block mb-1">Assistance Policies</span>
                                    {c.serviceAnimalsAllowed !== undefined && (
                                        <div className="text-xs font-semibold text-[#292928] flex items-center gap-1.5">
                                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${c.serviceAnimalsAllowed ? 'bg-[#c3f832] text-black' : 'bg-gray-200'}`}>✓</span>
                                            Service Animals {c.serviceAnimalsAllowed ? 'Welcome' : 'Check with desk'}
                                        </div>
                                    )}
                                    {c.wheelchairRentalAvailable !== undefined && (
                                        <div className="text-xs font-semibold text-[#292928] flex items-center gap-1.5">
                                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${c.wheelchairRentalAvailable ? 'bg-[#c3f832] text-black' : 'bg-gray-200'}`}>✓</span>
                                            Complimentary Wheelchairs {c.wheelchairRentalAvailable ? 'Available at Guest Services' : 'Not available'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                // MODULE: Sensory & Neurodivergent Guide
                if (mod.module_type === 'sensory_guide') {
                    return (
                        <div key={mod.module_id} className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                                    <HeartHandshake size={16} strokeWidth={2.5} />
                                </span>
                                <h3 className="text-lg font-black text-[#292928] tracking-tight">
                                    {mod.title || 'Sensory & Neurodivergent Guide'}
                                </h3>
                            </div>
                            <p className="text-xs text-[#6B7280] mb-6">
                                Lighting conditions, auditory environment, and designated quiet spaces
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {c.lightingType && (
                                    <div className="p-4.5 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0]">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#292928] mb-1.5">
                                            <Sun size={15} className="text-amber-500" />
                                            <span>Lighting & Atmosphere</span>
                                        </div>
                                        <p className="text-xs text-[#4B5563] leading-relaxed">
                                            {c.lightingType}
                                        </p>
                                    </div>
                                )}

                                {c.soundLevel && (
                                    <div className="p-4.5 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0]">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#292928] mb-1.5">
                                            <Volume2 size={15} className="text-indigo-500" />
                                            <span>Sound Levels</span>
                                        </div>
                                        <p className="text-xs text-[#4B5563] leading-relaxed">
                                            {c.soundLevel}
                                        </p>
                                    </div>
                                )}

                                {c.quietSpaces && (
                                    <div className="p-4.5 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0]">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#292928] mb-1.5">
                                            <span className="text-sm">🌿</span>
                                            <span>Quiet Zones / Calming Spaces</span>
                                        </div>
                                        <p className="text-xs text-[#4B5563] leading-relaxed">
                                            {c.quietSpaces}
                                        </p>
                                    </div>
                                )}

                                {c.crowdPeakHours && (
                                    <div className="p-4.5 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0]">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#292928] mb-1.5">
                                            <Clock size={15} className="text-purple-500" />
                                            <span>Peak Busy Times (High Traffic)</span>
                                        </div>
                                        <p className="text-xs text-[#4B5563] leading-relaxed">
                                            {c.crowdPeakHours}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                // MODULE: Transit & Accessible Parking
                if (mod.module_type === 'transit_parking') {
                    return (
                        <div key={mod.module_id} className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                                    <Car size={16} strokeWidth={2.5} />
                                </span>
                                <h3 className="text-lg font-black text-[#292928] tracking-tight">
                                    {mod.title || 'Accessible Parking & Transit Arrival'}
                                </h3>
                            </div>
                            <p className="text-xs text-[#6B7280] mb-6">
                                Accessible parking bays, drop-off routes, and public transportation proximity
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                {c.standardAccessibleSpaces !== undefined && (
                                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0] text-center">
                                        <span className="text-2xl font-black text-[#292928] block">{c.standardAccessibleSpaces}</span>
                                        <span className="text-[11px] font-bold text-[#6B7280]">Accessible Bays</span>
                                    </div>
                                )}

                                {c.vanAccessibleSpaces !== undefined && (
                                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0] text-center">
                                        <span className="text-2xl font-black text-[#292928] block">{c.vanAccessibleSpaces}</span>
                                        <span className="text-[11px] font-bold text-[#6B7280]">Van / Lift Bays</span>
                                    </div>
                                )}

                                {c.dropOffZoneDistanceMeters !== undefined && (
                                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0] text-center">
                                        <span className="text-2xl font-black text-[#292928] block">{c.dropOffZoneDistanceMeters}m</span>
                                        <span className="text-[11px] font-bold text-[#6B7280]">Drop-off to Door</span>
                                    </div>
                                )}

                                {c.evChargingAccessible && (
                                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0] text-center flex flex-col justify-center items-center">
                                        <span className="text-xs font-black text-[#0F9D58] bg-[#E6F4EA] px-2.5 py-1 rounded-md mb-1">Available</span>
                                        <span className="text-[11px] font-bold text-[#6B7280]">Accessible EV Charger</span>
                                    </div>
                                )}
                            </div>

                            {c.transitNotes && (
                                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0] flex items-start gap-3">
                                    <Bus size={18} className="text-[#1A73E8] shrink-0 mt-0.5" />
                                    <div className="text-xs text-[#4B5563] leading-relaxed">
                                        <span className="font-bold text-[#292928] block mb-0.5">Transit & Pathway Instructions:</span>
                                        {c.transitNotes}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                // Generic custom module if added
                if (c.customDetails) {
                    return (
                        <div key={mod.module_id} className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 md:p-8 shadow-sm">
                            <h3 className="text-lg font-black text-[#292928] tracking-tight mb-2">
                                {mod.title || 'Additional Accessibility Information'}
                            </h3>
                            <p className="text-xs text-[#4B5563] leading-relaxed">
                                {c.customDetails}
                            </p>
                        </div>
                    )
                }

                return null
            })}
        </div>
    )
}
