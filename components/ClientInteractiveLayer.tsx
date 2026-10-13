'use client'

import { useState, useMemo } from 'react'
import LocationList, { CardLocation } from './LocationList'
import MapViewer from './MapViewer'
import LocationDetailPanel from './LocationDetailPanel'
import { Search, SlidersHorizontal, Plus, X, Check } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { Suspense } from 'react'

export interface ClientInteractiveLayerProps {
    locations: CardLocation[];
}

export default function ClientInteractiveLayerWrapper(props: ClientInteractiveLayerProps) {
    return (
        <Suspense fallback={<div className="h-full w-full bg-[#E8ECF0]" />}>
            <ClientInteractiveLayerWithParams {...props} />
        </Suspense>
    )
}

function ClientInteractiveLayerWithParams({ locations }: ClientInteractiveLayerProps) {
    const searchParams = useSearchParams()
    return <ClientInteractiveLayer locations={locations} initialLocationId={searchParams.get('locationId')} />
}

function ClientInteractiveLayer({ locations, initialLocationId }: ClientInteractiveLayerProps & { initialLocationId?: string | null }) {
    const [activeLocationId, setActiveLocationId] = useState<number | null>(initialLocationId ? Number(initialLocationId) : null)
    const [isListOpen, setIsListOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

    // Extract all unique accessibility features available in the current dataset
    const availableFeatures = useMemo(() => {
        const features = new Set<string>();
        locations.forEach(loc => {
            if (loc.features && Array.isArray(loc.features)) {
                loc.features.forEach(fObj => {
                    Object.entries(fObj).forEach(([key, val]) => {
                        if (val === true && key !== 'feature_id' && key !== 'location_id') {
                            const readable = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
                            features.add(readable);
                        }
                    });
                });
            }
        })
        return Array.from(features).sort()
    }, [locations])

    const toggleFeature = (feature: string) => {
        setSelectedFeatures(prev =>
            prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
        )
    }

    // Filter locations based on search query and selected features
    const filteredLocations = useMemo(() => {
        return locations.filter(loc => {
            // Search filter
            const matchesSearch = !searchQuery.trim() ||
                loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (loc.address && loc.address.toLowerCase().includes(searchQuery.toLowerCase()));

            // Feature filter (location must have ALL selected features)
            const matchesFeatures = selectedFeatures.length === 0 ||
                selectedFeatures.every(sf => {
                    return Array.isArray(loc.features) && loc.features.some(fObj => {
                        return Object.entries(fObj).some(([k, v]) => {
                            const readable = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
                            return readable === sf && v === true;
                        });
                    });
                });

            return matchesSearch && matchesFeatures;
        })
    }, [locations, searchQuery, selectedFeatures])

    return (
        <>
            <div className="absolute inset-0 z-0 bg-[#E8ECF0]">
                <MapViewer
                    locations={filteredLocations}
                    activeLocationId={activeLocationId}
                    onLocationClick={(id) => {
                        setActiveLocationId(id)
                        setIsListOpen(true) // Open list when pin is clicked
                    }}
                />
            </div>

            {/* Top Overlay Panel */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 pointer-events-none max-w-full">

                {/* Header Row */}
                <div className="flex items-center gap-3 pointer-events-auto flex-wrap">
                    {/* AccessMap Logo Box */}
                    <div className="bg-[#ffffff] px-5 h-[52px] rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#E4E9F0] flex items-center justify-center">
                        <h1 className="text-[18px] font-black tracking-tighter text-[#292928]">
                            Access<span className="text-[#c3f832]">Map</span>
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-[#ffffff] rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#E4E9F0] flex items-center h-[52px] w-[320px] px-4 transition-all focus-within:ring-2 focus-within:ring-[#c3f832] focus-within:border-transparent">
                        <Search size={18} className="text-[#9CA3AF] mr-3 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsListOpen(true)}
                            className="bg-transparent border-none outline-none text-[14px] w-full text-[#292928] font-medium placeholder:font-normal placeholder:text-[#9CA3AF]"
                        />
                    </div>

                    {/* Filters Button */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={`h-[52px] px-4 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border transition-colors flex items-center justify-center gap-2 font-bold text-[13px] cursor-pointer
                            ${selectedFeatures.length > 0 ? 'bg-[#292928] text-white border-[#292928]' : 'bg-[#ffffff] text-[#292928] border-[#E4E9F0] hover:bg-[#f8f8f8]'}
                        `}
                    >
                        <SlidersHorizontal size={16} />
                        <span>Filters {selectedFeatures.length > 0 && `(${selectedFeatures.length})`}</span>
                    </button>

                    {/* Toggly List Button manually */}
                    <button
                        onClick={() => {
                            if (isListOpen || activeLocationId) {
                                setIsListOpen(false)
                                setActiveLocationId(null)
                            } else {
                                setIsListOpen(true)
                            }
                        }}
                        className={`h-[52px] px-4 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border transition-colors font-bold text-[13px] cursor-pointer
                            ${isListOpen || activeLocationId ? 'bg-[#292928] text-white border-[#292928]' : 'bg-[#ffffff] text-[#292928] border-[#E4E9F0] hover:bg-[#f8f8f8]'}
                        `}
                    >
                        {isListOpen || activeLocationId ? 'Hide List' : 'View List'}
                    </button>
                </div>

                {/* Location List Panel - Toggleable */}
                <div className={`w-[420px] h-[calc(100vh-100px)] transition-all duration-300 transform origin-top-left pointer-events-auto
                    ${isListOpen && !activeLocationId ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-4 pointer-events-none absolute'}
                `}>
                    <LocationList
                        locations={filteredLocations}
                        activeLocationId={activeLocationId}
                        onLocationClick={(id) => setActiveLocationId(id)}
                    />
                </div>

                {/* Location Detail Panel */}
                <div className={`w-[420px] h-[calc(100vh-100px)] transition-all duration-300 transform origin-top-left pointer-events-auto
                    ${activeLocationId ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-x-8 pointer-events-none absolute'}
                `}>
                    {activeLocationId && (
                        <LocationDetailPanel
                            location={locations.find(l => l.location_id === activeLocationId)!}
                            onClose={() => { setActiveLocationId(null); setIsListOpen(false); }}
                        />
                    )}
                </div>
            </div>

            {/* Floating Add Location Button (Bottom Right) */}
            <Link
                href="/add"
                className="absolute bottom-6 right-6 z-20 w-14 h-14 bg-[#c3f832] rounded-full shadow-[0_8px_30px_rgb(195,248,50,0.3)] flex items-center justify-center text-[#292928] hover:scale-110 transition-transform cursor-pointer"
                title="Add New Location"
            >
                <Plus size={24} strokeWidth={2.5} />
            </Link>

            {/* Filter Modal */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1F2E]/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-[500px] max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[#E4E9F0] flex justify-between items-center">
                            <h2 className="text-xl font-black tracking-tight text-[#292928]">Platform Filters</h2>
                            <button onClick={() => setIsFilterOpen(false)} className="text-[#9CA3AF] hover:text-[#292928] transition-colors rounded-full hover:bg-[#f8f8f8] p-1"><X size={24} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <h3 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-4">Accessibility Features</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {availableFeatures.map(feature => (
                                    <label key={feature} onClick={() => toggleFeature(feature)} className="flex items-start space-x-3 cursor-pointer group p-3 rounded-xl hover:bg-[#f8f8f8] border border-transparent hover:border-[#E4E9F0] transition-colors">
                                        <div className={`mt-0.5 w-5 h-5 shrink-0 rounded-[6px] border flex items-center justify-center transition-colors 
                                            ${selectedFeatures.includes(feature) ? 'bg-[#c3f832] border-[#c3f832] text-[#292928]' : 'bg-white border-[#D1D5DB] group-hover:border-[#c3f832]'}
                                        `}>
                                            {selectedFeatures.includes(feature) && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <span className={`text-[14px] leading-tight font-medium ${selectedFeatures.includes(feature) ? 'text-[#292928]' : 'text-[#4B5563]'}`}>
                                            {feature}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#E4E9F0] bg-[#F8F9FA] flex justify-end gap-3 rounded-b-[24px]">
                            <button
                                onClick={() => setSelectedFeatures([])}
                                className="px-5 py-2.5 rounded-xl font-bold text-[#6B7280] hover:bg-[#E4E9F0] hover:text-[#292928] transition-colors"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="px-5 py-2.5 rounded-xl font-bold bg-[#c3f832] text-[#292928] hover:bg-[#b0df2c] transition-colors"
                            >
                                Show {filteredLocations.length} results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
