'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CardLocation } from './LocationList'

export default function MapViewer({ locations, activeLocationId, onLocationClick }: { locations: CardLocation[], activeLocationId: number | null, onLocationClick: (id: number) => void }) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<maplibregl.Map | null>(null)
    const markersRef = useRef<{ [key: number]: maplibregl.Marker }>({})
    const [isMapLoaded, setIsMapLoaded] = useState(false)

    useEffect(() => {
        if (map.current || !mapContainer.current) return // initialize map only once

        let initialCenter: [number, number] = [76.2144, 10.5276]
        let initialZoom = 11

        if (activeLocationId) {
            const loc = locations.find(l => l.location_id === activeLocationId)
            if (loc && loc.longitude !== null && loc.latitude !== null) {
                initialCenter = [loc.longitude, loc.latitude]
                initialZoom = 14
            }
        }

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // Carto Voyager style suitable for Native
            center: initialCenter,
            zoom: initialZoom,
            minZoom: 9,
            maxZoom: 18,
            attributionControl: false,
        })

        map.current.on('load', () => {
            setIsMapLoaded(true)
            map.current?.resize()
        })

        // Custom Navigation Control (top-left)
        const navControl = new maplibregl.NavigationControl({
            showCompass: false,
        })
        map.current.addControl(navControl, 'top-left')

        return () => {
            map.current?.remove()
            map.current = null
        }
    }, [])

    // Update markers when locations change
    useEffect(() => {
        if (!map.current || !isMapLoaded) return

        // Remove old markers that are not in the new locations array
        const locIds = locations.map(l => l.location_id)
        Object.keys(markersRef.current).forEach(key => {
            const id = parseInt(key, 10)
            if (!locIds.includes(id)) {
                markersRef.current[id].remove()
                delete markersRef.current[id]
            }
        })

        // Add new markers
        locations.forEach(loc => {
            if (!markersRef.current[loc.location_id] && loc.latitude && loc.longitude) {

                // Pin wrapper
                const el = document.createElement('div')
                el.className = 'group relative cursor-pointer z-10 hover:z-50'

                // Calculate Feature Percentage
                let activeCount = 0;
                let totalCount = 0;
                if (loc.features && Array.isArray(loc.features)) {
                    loc.features.forEach(fObj => {
                        Object.entries(fObj).forEach(([k, v]) => {
                            if (k !== 'feature_id' && k !== 'location_id') {
                                totalCount++;
                                if (v === true) activeCount++;
                            }
                        });
                    });
                }
                const score = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;

                let borderColor = 'border-[#E53935]'
                let dotColor = 'bg-[#E53935]'
                if (score >= 75) {
                    borderColor = 'border-[#0F9D58]'
                    dotColor = 'bg-[#0F9D58]'
                } else if (score >= 50) {
                    borderColor = 'border-[#F4B400]'
                    dotColor = 'bg-[#F4B400]'
                } else if (score >= 25) {
                    borderColor = 'border-[#FF9800]'
                    dotColor = 'bg-[#FF9800]'
                }

                // Active State
                const isActive = activeLocationId === loc.location_id

                el.innerHTML = `
          <div class="flex items-center space-x-1.5 rounded-full border-[1.5px] ${borderColor} ${isActive ? dotColor : 'bg-white'} px-2 py-1 shadow-sm transition-all duration-200 hover:scale-110">
            <div class="h-2 w-2 rounded-full ${isActive ? 'bg-white' : dotColor}"></div>
            <span class="max-w-[100px] truncate text-[11px] font-bold ${isActive ? 'text-white' : 'text-[#1A1F2E]'}">${loc.name}</span>
          </div>
        `

                el.addEventListener('click', () => {
                    onLocationClick(loc.location_id)
                })

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([loc.longitude, loc.latitude])
                    .addTo(map.current!)

                markersRef.current[loc.location_id] = marker
            } else if (markersRef.current[loc.location_id]) {
                // Update active state class manually
                const el = markersRef.current[loc.location_id].getElement()
                const isActive = activeLocationId === loc.location_id

                // Dynamic active hover score re-calibration
                let activeCount = 0;
                let totalCount = 0;
                if (loc.features && Array.isArray(loc.features)) {
                    loc.features.forEach(fObj => {
                        Object.entries(fObj).forEach(([k, v]) => {
                            if (k !== 'feature_id' && k !== 'location_id') {
                                totalCount++;
                                if (v === true) activeCount++;
                            }
                        });
                    });
                }
                const score = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;

                let borderColor = 'border-[#E53935]'
                let dotColor = 'bg-[#E53935]'
                if (score >= 75) {
                    borderColor = 'border-[#0F9D58]'
                    dotColor = 'bg-[#0F9D58]'
                } else if (score >= 50) {
                    borderColor = 'border-[#F4B400]'
                    dotColor = 'bg-[#F4B400]'
                } else if (score >= 25) {
                    borderColor = 'border-[#FF9800]'
                    dotColor = 'bg-[#FF9800]'
                }

                el.innerHTML = `
          <div class="flex items-center space-x-1.5 rounded-full border-[1.5px] ${borderColor} ${isActive ? dotColor : 'bg-white'} px-2 py-1 shadow-sm transition-all duration-200 hover:scale-110">
            <div class="h-2 w-2 rounded-full ${isActive ? 'bg-white' : dotColor}"></div>
            <span class="max-w-[100px] truncate text-[11px] font-bold ${isActive ? 'text-white' : 'text-[#1A1F2E]'}">${loc.name}</span>
          </div>
        `
                if (isActive) {
                    el.classList.add('z-20')
                } else {
                    el.classList.remove('z-20')
                }
            }
        })

        // If an active location is selected, fly to it
        if (activeLocationId && markersRef.current[activeLocationId]) {
            const loc = locations.find(l => l.location_id === activeLocationId)
            if (loc && map.current && loc.latitude !== null && loc.longitude !== null) {
                map.current.flyTo({
                    center: [loc.longitude, loc.latitude],
                    zoom: 14,
                    speed: 1.2
                })
            }
        }

    }, [locations, activeLocationId, onLocationClick])

    return (
        <div className="relative h-full w-full overflow-hidden bg-[#E8ECF0]">
            <div ref={mapContainer} className="h-full w-full maplibregl-crosshair" />

            {/* Legend */}
            <div className="absolute bottom-4 right-4 rounded-[12px] bg-white/80 backdrop-blur-md border border-white/20 p-3 shadow-md">
                <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wide mb-2">Accessibility Score</div>
                <div className="space-y-1.5">
                    <div className="flex items-center text-[12px] text-[#1A1F2E] font-medium"><div className="w-2 h-2 rounded-full bg-[#0F9D58] mr-2"></div>75% - 100%</div>
                    <div className="flex items-center text-[12px] text-[#1A1F2E] font-medium"><div className="w-2 h-2 rounded-full bg-[#F4B400] mr-2"></div>50% - 74%</div>
                    <div className="flex items-center text-[12px] text-[#1A1F2E] font-medium"><div className="w-2 h-2 rounded-full bg-[#FF9800] mr-2"></div>25% - 49%</div>
                    <div className="flex items-center text-[12px] text-[#1A1F2E] font-medium"><div className="w-2 h-2 rounded-full bg-[#E53935] mr-2"></div>Below 25%</div>
                </div>
            </div>
        </div>
    )
}
