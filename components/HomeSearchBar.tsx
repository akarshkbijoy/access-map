'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function HomeSearchBar() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchLocations = async () => {
            if (query.length < 2) {
                setResults([])
                setIsOpen(false)
                return
            }
            try {
                const res = await fetch(`/api/locations?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                if (data.locations) {
                    setResults(data.locations)
                    setIsOpen(true)
                }
            } catch (err) {
                console.error(err)
            }
        }
        
        const timeoutId = setTimeout(() => {
            fetchLocations()
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [query])

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            router.push(`/map`)
        }
    }

    return (
        <div ref={wrapperRef} className="w-full max-w-2xl relative mb-8 z-50">
            <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-4 shadow-2xl flex flex-col md:flex-row items-center molded-inner border-2 border-white/40 gap-4">
                <div className="flex flex-1 items-center w-full">
                    <span className="material-symbols-outlined ml-4 text-primary" data-icon="accessible">accessible</span>
                    <input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => { if(results.length > 0) setIsOpen(true) }}
                        className="bg-transparent border-none focus:ring-0 w-full px-4 text-lg font-medium placeholder:text-on-surface-variant/50 outline-none" 
                        placeholder="Where is your next barrier-free adventure?" 
                        type="text"
                    />
                </div>
                <button type="button" onClick={() => router.push('/map')} className="bg-[#9b3f00] hover:bg-[#883600] transition-colors text-white rounded-full w-full md:w-auto px-8 py-4 font-bold text-lg text-center inline-block cursor-pointer">
                    Search Map
                </button>
            </form>
            
            {isOpen && results.length > 0 && (
                <div className="absolute top-[100%] left-0 w-full bg-white mt-2 rounded-[1.5rem] shadow-2xl border border-[#E4E9F0] overflow-hidden max-h-64 overflow-y-auto">
                    {results.map(loc => (
                        <div 
                            key={loc.location_id}
                            onClick={() => router.push(`/map?locationId=${loc.location_id}`)}
                            className="p-4 border-b border-[#f8f8f8] hover:bg-[#f7f4e1] cursor-pointer transition-colors"
                        >
                            <h4 className="font-bold text-[#292928]">{loc.name}</h4>
                            <p className="text-sm text-[#9CA3AF] truncate">{loc.address}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
