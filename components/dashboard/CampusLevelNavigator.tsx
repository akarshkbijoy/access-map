'use client'

import { useState } from 'react'
import { Layers, MapPin, Search, ArrowUpRight, Check, Compass, Info } from 'lucide-react'

export interface FloorPOI {
    poi_id: number;
    name: string;
    category: string; // 'elevator', 'restroom', 'ramp', 'tactile_path', 'help_desk', 'quiet_room', 'parking'
    x_coord?: number | null;
    y_coord?: number | null;
    description?: string | null;
}

export interface CampusFloor {
    floor_id: number;
    floor_number: number;
    floor_name: string;
    map_image_url?: string | null;
    description?: string | null;
    pois: FloorPOI[];
}

export interface CampusBuilding {
    building_id: number;
    name: string;
    description?: string | null;
    total_floors: number;
    display_order: number;
    floors: CampusFloor[];
}

interface CampusLevelNavigatorProps {
    buildings: CampusBuilding[];
}

export default function CampusLevelNavigator({ buildings }: CampusLevelNavigatorProps) {
    if (!buildings || buildings.length === 0) return null

    const [selectedBuildingId, setSelectedBuildingId] = useState<number>(buildings[0]?.building_id || 0)
    const currentBuilding = buildings.find(b => b.building_id === selectedBuildingId) || buildings[0]

    const floors = currentBuilding?.floors || []
    const [selectedFloorId, setSelectedFloorId] = useState<number>(floors[0]?.floor_id || 0)
    const currentFloor = floors.find(f => f.floor_id === selectedFloorId) || floors[0]

    const [activePoi, setActivePoi] = useState<FloorPOI | null>(null)
    const [filterCategory, setFilterCategory] = useState<string>('all')

    const pois = currentFloor?.pois || []
    const filteredPois = filterCategory === 'all'
        ? pois
        : pois.filter(p => p.category === filterCategory)

    const getPoiCategoryDetails = (category: string) => {
        switch (category) {
            case 'elevator':
                return { label: 'Elevator', icon: '🛗', color: 'bg-blue-50 text-blue-700 border-blue-200' }
            case 'restroom':
                return { label: 'Accessible Restroom', icon: '🚻', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
            case 'ramp':
                return { label: 'Ramp / Step-free Entrance', icon: '♿', color: 'bg-lime-50 text-lime-800 border-lime-300' }
            case 'help_desk':
                return { label: 'Assistance / Information', icon: 'ℹ️', color: 'bg-purple-50 text-purple-700 border-purple-200' }
            case 'quiet_room':
                return { label: 'Quiet / Sensory Room', icon: '🌿', color: 'bg-teal-50 text-teal-700 border-teal-200' }
            case 'parking':
                return { label: 'Accessible Parking Bay', icon: '🅿️', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
            default:
                return { label: 'Feature', icon: '📍', color: 'bg-gray-50 text-gray-700 border-gray-200' }
        }
    }

    return (
        <div className="bg-white rounded-[24px] border border-[#E4E9F0] shadow-sm overflow-hidden mb-8">
            {/* Header & Building Switcher */}
            <div className="p-6 border-b border-[#E4E9F0] bg-[#F8FAFC]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 rounded-lg bg-[#c3f832] text-[#292928]">
                                <Layers size={18} strokeWidth={2.5} />
                            </span>
                            <h2 className="text-xl font-black text-[#292928] tracking-tight">
                                Campus & Multi-Level Accessibility Map
                            </h2>
                        </div>
                        <p className="text-xs text-[#6B7280]">
                            Navigate floors, elevators, step-free access paths, and accessible amenities
                        </p>
                    </div>

                    {/* Building Selector if more than 1 building */}
                    {buildings.length > 1 && (
                        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E4E9F0] rounded-xl shadow-xs overflow-x-auto">
                            {buildings.map((b) => (
                                <button
                                    key={b.building_id}
                                    onClick={() => {
                                        setSelectedBuildingId(b.building_id)
                                        if (b.floors[0]) setSelectedFloorId(b.floors[0].floor_id)
                                        setActivePoi(null)
                                    }}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        selectedBuildingId === b.building_id
                                            ? 'bg-[#292928] text-white shadow-xs'
                                            : 'text-[#6B7280] hover:text-[#292928] hover:bg-[#F1F5F9]'
                                    }`}
                                >
                                    {b.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Floor Level Tabs */}
                {floors.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#9CA3AF] shrink-0 mr-1">
                            Floor:
                        </span>
                        {floors.map((floor) => {
                            const isSelected = (currentFloor?.floor_id === floor.floor_id)
                            return (
                                <button
                                    key={floor.floor_id}
                                    onClick={() => {
                                        setSelectedFloorId(floor.floor_id)
                                        setActivePoi(null)
                                    }}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                                        isSelected
                                            ? 'bg-[#c3f832] text-[#292928] border-[#c3f832] shadow-xs'
                                            : 'bg-white text-[#6B7280] border-[#E4E9F0] hover:border-[#292928] hover:text-[#292928]'
                                    }`}
                                >
                                    <span>{floor.floor_name}</span>
                                    {floor.pois?.length > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                            isSelected ? 'bg-black/10 text-[#292928]' : 'bg-[#E4E9F0] text-[#6B7280]'
                                        }`}>
                                            {floor.pois.length}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Interactive Floor View & POI Explorer */}
            <div className="p-6">
                {currentFloor ? (
                    <div>
                        {currentFloor.description && (
                            <p className="text-xs text-[#4B5563] mb-4 bg-[#F8FAFC] p-3 rounded-xl border border-[#E4E9F0]">
                                <span className="font-bold text-[#292928]">{currentFloor.floor_name}: </span>
                                {currentFloor.description}
                            </p>
                        )}

                        {/* Interactive Blueprint Canvas */}
                        <div className="relative w-full h-72 sm:h-96 bg-[#F1F5F9] rounded-[20px] border border-[#E2E8F0] overflow-hidden mb-6 flex items-center justify-center shadow-inner">
                            {currentFloor.map_image_url ? (
                                <img
                                    src={currentFloor.map_image_url}
                                    alt={`${currentFloor.floor_name} Plan`}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none">
                                    {/* Architectural grid background */}
                                    <div
                                        className="absolute inset-0 opacity-20 pointer-events-none"
                                        style={{
                                            backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
                                            backgroundSize: '24px 24px'
                                        }}
                                    />
                                    <div className="relative z-0 max-w-sm">
                                        <div className="w-12 h-12 rounded-2xl bg-white/80 border border-[#CBD5E1] shadow-xs flex items-center justify-center mx-auto mb-2 text-[#64748B]">
                                            <Compass size={24} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider text-[#64748B] block">
                                            {currentBuilding.name} — {currentFloor.floor_name} Layout
                                        </span>
                                        <p className="text-[11px] text-[#94A3B8] mt-1">
                                            Interactive accessibility points of interest indicated on floor level.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* POI Markers overlay */}
                            {filteredPois.map((poi, idx) => {
                                const details = getPoiCategoryDetails(poi.category)
                                const isSelected = activePoi?.poi_id === poi.poi_id

                                // Default fallback coordinates spread evenly if not set
                                const defaultX = 20 + ((idx * 25) % 65)
                                const defaultY = 30 + ((idx * 28) % 45)
                                const x = poi.x_coord !== null && poi.x_coord !== undefined ? poi.x_coord : defaultX
                                const y = poi.y_coord !== null && poi.y_coord !== undefined ? poi.y_coord : defaultY

                                return (
                                    <button
                                        key={poi.poi_id}
                                        onClick={() => setActivePoi(poi)}
                                        style={{ left: `${x}%`, top: `${y}%` }}
                                        className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform duration-200 z-10 ${
                                            isSelected ? 'scale-125 z-20' : 'hover:scale-115'
                                        }`}
                                    >
                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl shadow-md border text-xs font-bold transition-all ${
                                            isSelected
                                                ? 'bg-[#292928] text-white border-black ring-4 ring-[#c3f832]/50'
                                                : `${details.color} hover:shadow-lg`
                                        }`}>
                                            <span className="text-sm">{details.icon}</span>
                                            <span className="truncate max-w-[120px]">{poi.name}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Selected POI Details Card */}
                        {activePoi && (
                            <div className="bg-[#fcfdfa] border-2 border-[#c3f832] rounded-[20px] p-4.5 mb-6 shadow-sm animate-in fade-in duration-150">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E9F0] flex items-center justify-center text-xl shadow-xs shrink-0">
                                            {getPoiCategoryDetails(activePoi.category).icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h4 className="text-sm font-black text-[#292928]">{activePoi.name}</h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPoiCategoryDetails(activePoi.category).color}`}>
                                                    {getPoiCategoryDetails(activePoi.category).label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#4B5563] leading-relaxed">
                                                {activePoi.description || 'Full accessible feature verified at this location.'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActivePoi(null)}
                                        className="text-[#9CA3AF] hover:text-[#292928] text-xs font-bold p-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Filter Categories Bar */}
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                            <span className="text-xs font-bold text-[#6B7280] shrink-0">Filter Amenities:</span>
                            {['all', 'restroom', 'elevator', 'ramp', 'help_desk', 'quiet_room'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors shrink-0 cursor-pointer ${
                                        filterCategory === cat
                                            ? 'bg-[#292928] text-white'
                                            : 'bg-[#f8f8f8] text-[#6B7280] hover:text-[#292928] border border-[#E4E9F0]'
                                    }`}
                                >
                                    {cat === 'all' ? 'All Points' : cat.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        {/* POI Directory Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {filteredPois.map((poi) => {
                                const details = getPoiCategoryDetails(poi.category)
                                const isSelected = activePoi?.poi_id === poi.poi_id

                                return (
                                    <div
                                        key={poi.poi_id}
                                        onClick={() => setActivePoi(poi)}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                                            isSelected
                                                ? 'bg-[#fcfdfa] border-[#c3f832] shadow-xs'
                                                : 'bg-white border-[#E4E9F0] hover:border-[#292928] hover:bg-[#F8FAFC]'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[#f8f8f8] border border-[#E4E9F0] flex items-center justify-center text-base shrink-0">
                                            {details.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-bold text-[#292928] truncate block">
                                                {poi.name}
                                            </span>
                                            <span className="text-[11px] text-[#9CA3AF] block truncate">
                                                {poi.description || details.label}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-[#9CA3AF]">
                        <p className="text-sm font-medium">No floor plan data configured for this campus building yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
