'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { X, MapPin } from 'lucide-react'

interface LocationPickerModalProps {
    onConfirm: (lat: number, lng: number, addressName: string) => void
    onCancel: () => void
}

export default function LocationPickerModal({ onConfirm, onCancel }: LocationPickerModalProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<maplibregl.Map | null>(null)
    const markerRef = useRef<maplibregl.Marker | null>(null)

    const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null)
    const [addressName, setAddressName] = useState<string>('')
    const [isLoadingAddress, setIsLoadingAddress] = useState(false)

    useEffect(() => {
        if (!mapContainer.current) return

        let mapInstance: maplibregl.Map | null = null;
        
        // Delay initialization to ensure DOM is painted and avoid React Strict Mode double-mount collisions
        const timeoutId = setTimeout(() => {
            if (!mapContainer.current) return;
            
            mapInstance = new maplibregl.Map({
                container: mapContainer.current,
                style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // Carto Voyager style suitable for Native
                center: [76.2144, 10.5276], // Default Thrissur center
                zoom: 11,
                minZoom: 2,
                maxZoom: 18,
                attributionControl: false,
            })

            map.current = mapInstance;

            const navControl = new maplibregl.NavigationControl({
                showCompass: false,
            })
            mapInstance.addControl(navControl, 'top-left')

            // Listen for map clicks
            mapInstance.on('click', async (e) => {
                const { lng, lat } = e.lngLat
                setSelectedCoords({ lat, lng })

                // Place or update marker
                if (!markerRef.current && map.current) {
                    const el = document.createElement('div')
                    el.innerHTML = `
                        <div class="text-[#E53935] drop-shadow-md cursor-pointer hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin">
                                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                                <circle cx="12" cy="10" r="3" fill="white" />
                            </svg>
                        </div>
                    `
                    markerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                        .setLngLat([lng, lat])
                        .addTo(map.current)
                } else if (markerRef.current) {
                    markerRef.current.setLngLat([lng, lat])
                }

                // Fetch address from Nominatim
                setIsLoadingAddress(true)
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                    const data = await res.json()
                    if (data && data.display_name) {
                        const parts = data.display_name.split(', ')
                        const shortName = parts.slice(0, 3).join(', ')
                        setAddressName(shortName)
                    } else {
                        setAddressName('Unknown location')
                    }
                } catch (err) {
                    console.error('Failed to reverse geocode', err)
                    setAddressName('Could not fetch address')
                } finally {
                    setIsLoadingAddress(false)
                }
            })
        }, 150) // 150ms delay for DOM ready

        return () => {
            clearTimeout(timeoutId)
            if (mapInstance) {
                mapInstance.remove()
            }
            map.current = null
        }
    }, [])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-[800px] bg-white rounded-[24px] shadow-xl overflow-hidden flex flex-col h-[80vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#E4E9F0] bg-[#f8f8f8]">
                    <div>
                        <h2 className="text-lg font-black text-[#292928]">Choose Location on Map</h2>
                        <p className="text-sm font-medium text-[#6B7280]">Click anywhere on the map to place a pin</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-[#E4E9F0] rounded-full transition-colors">
                        <X size={24} className="text-[#292928]" />
                    </button>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative bg-[#E8ECF0]">
                    <div ref={mapContainer} className="absolute inset-0 maplibregl-crosshair" style={{ width: '100%', height: '100%', minHeight: '400px' }} />
                    
                    {/* Selected Info Overlay */}
                    {selectedCoords && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-[#E4E9F0] p-4 w-[90%] max-w-[400px]">
                            <div className="flex items-start gap-3">
                                <MapPin className="text-[#E53935] shrink-0 mt-0.5" size={20} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#292928] truncate mb-1">
                                        {isLoadingAddress ? 'Getting address...' : addressName || 'Selected Location'}
                                    </p>
                                    <p className="text-[11px] font-medium text-[#6B7280]">
                                        {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => onConfirm(selectedCoords.lat, selectedCoords.lng, addressName)}
                                disabled={isLoadingAddress}
                                className="mt-4 w-full h-[40px] bg-[#c3f832] text-[#292928] hover:bg-[#b0df2c] disabled:opacity-50 font-bold rounded-[12px] transition-colors"
                            >
                                Confirm Location
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
