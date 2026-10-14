'use client'

import { MapPin, MoreVertical, Box, ChevronRight, MessageSquare, Phone, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export interface CardLocation {
    location_id: number;
    name: string;
    address: string | null;
    status: string;
    rating: number | null;
    accessibilityScore: number | null;
    lastUpdated: Date | null;
    latitude: number | null;
    longitude: number | null;
    description: string | null;
    features: any;
    contributions?: any[];
}

interface LocationListProps {
    locations: CardLocation[];
    activeLocationId: number | null;
    onLocationClick: (id: number) => void;
}


export default function LocationList({ locations, activeLocationId, onLocationClick }: LocationListProps) {
    const filteredLocations = locations

    return (
        <div className="flex flex-col bg-[#ffffff] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] h-full overflow-hidden pointer-events-auto border border-[#E4E9F0]">
            {/* Header Area */}
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <a href="/" className="h-10 w-10 flex border-[1.5px] border-[#292928] rounded-xl items-center justify-center text-[#292928] hover:bg-[#f8f8f8] transition-colors cursor-pointer" title="Go to Homepage">
                            <Box size={20} strokeWidth={2.5} />
                        </a>
                        <h2 className="text-[20px] font-bold text-[#292928]">Locations</h2>
                    </div>
                    <button className="h-10 w-10 border border-[#E4E9F0] rounded-xl flex items-center justify-center text-[#292928] hover:bg-[#f8f8f8] transition-colors cursor-pointer">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 custom-scrollbar">
                {filteredLocations.map((loc) => {
                    const isActive = activeLocationId === loc.location_id
                    const daysAgo = loc.lastUpdated
                        ? Math.floor((new Date().getTime() - new Date(loc.lastUpdated).getTime()) / (1000 * 3600 * 24))
                        : 0

                    return (
                        <div
                            key={loc.location_id}
                            onClick={() => onLocationClick(loc.location_id)}
                            className={`group cursor-pointer rounded-[20px] border-[1.5px] bg-[#ffffff] transition-all duration-200 overflow-hidden
                                ${isActive ? 'border-[#292928]' : 'border-[#E4E9F0] hover:border-[#292928]'}
                            `}
                        >
                            <div className="p-5">
                                {/* Top info matching design */}
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="text-[16px] font-bold text-[#292928] leading-tight pr-2">
                                        <Link
                                            href={`/location/${loc.location_id}/dashboard`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="hover:underline hover:text-[#1A73E8] transition-colors"
                                            title="View Location Dashboard"
                                        >
                                            {loc.name}
                                        </Link>
                                    </h3>
                                    <span className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0 bg-[#E8F0FE] text-[#1A73E8]">
                                        {loc.status}
                                    </span>
                                </div>
                                <p className="text-[12px] text-[#9CA3AF] font-medium mb-4 flex items-center">
                                    <MapPin size={12} className="mr-1 inline shrink-0" />
                                    <span className="truncate">{loc.address ? loc.address : 'Address unavailable'}</span>
                                </p>

                                {/* Lime Green badge equivalent matching design */}
                                <div className="flex justify-center mb-6">
                                    <span className="bg-[#c3f832] text-[#292928] px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest shadow-sm">
                                        Accessibility
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-1.5 w-full bg-[#f8f8f8] rounded-full overflow-hidden mb-6">
                                    <div
                                        className="h-full bg-[#292928] rounded-full transition-all duration-300"
                                        style={{ width: `${((loc.accessibilityScore || 0) / 5) * 100}%` }}
                                    />
                                </div>

                                {/* Stats row */}
                                <div className="flex items-center justify-between text-[11px] mb-6 pt-1">
                                    <div className="flex flex-col">
                                        <span className="text-[#9CA3AF] font-bold mb-1">Features</span>
                                        <span className="text-[#292928] font-bold">
                                            {loc.features && Object.keys(loc.features).length > 2 ? 'Multiple' : 'Basic'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col text-center">
                                        <span className="text-[#9CA3AF] font-bold mb-1">Last Updated</span>
                                        <span className="text-[#292928] font-bold">
                                            {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
                                        </span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[#9CA3AF] font-bold mb-1">Rating</span>
                                        <span className="text-[#292928] font-bold">
                                            {loc.rating ? `★ ${loc.rating}` : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Bottom user / actions area */}
                                <div className="flex items-center justify-between pt-4 border-t border-[#f8f8f8]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#E4E9F0] flex items-center justify-center overflow-hidden shrink-0">
                                            <span className="text-[16px] text-[#9CA3AF]">⚲</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-[#9CA3AF] font-bold">AccessMap</span>
                                            <span className="text-[12px] text-[#292928] font-bold">Community</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="w-10 h-10 rounded-full border border-[#E4E9F0] flex items-center justify-center text-[#292928] hover:bg-[#f8f8f8] transition-colors cursor-pointer" aria-label="Comment">
                                            <MessageSquare size={16} />
                                        </button>
                                        <button className="w-10 h-10 rounded-full border border-[#E4E9F0] flex items-center justify-center text-[#292928] hover:bg-[#f8f8f8] transition-colors cursor-pointer" aria-label="Call">
                                            <Phone size={16} />
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {/* Expand Section */}
                            <div className="px-5 py-3 border-t border-[#E4E9F0] bg-[#fdfdfd] flex items-center justify-between text-[#292928] text-[12px] font-bold">
                                <Link
                                    href={`/location/${loc.location_id}/dashboard`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 text-[#292928] hover:text-[#1A73E8] transition-colors"
                                    title="View Accessibility Dashboard"
                                >
                                    <LayoutDashboard size={14} className="text-[#1A73E8]" />
                                    <span>View Dashboard</span>
                                </Link>
                                <div className="flex items-center gap-1 text-[#9CA3AF] group-hover:text-[#292928] transition-colors">
                                    <span>Details</span>
                                    <ChevronRight size={15} />
                                </div>
                            </div>
                        </div>
                    )
                })}

                {filteredLocations.length === 0 && (
                    <div className="mt-10 flex flex-col items-center text-center text-[#9CA3AF]">
                        <span className="mb-2 text-3xl">📭</span>
                        <p className="text-[13px] font-bold text-[#292928]">No locations found.</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #E4E9F0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    )
}
