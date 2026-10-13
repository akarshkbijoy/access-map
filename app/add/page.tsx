'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Phone, FileText, Compass, Check, Map } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const LocationPickerModal = dynamic(() => import('@/components/LocationPickerModal'), { ssr: false })

export default function AddLocationPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [isMapModalOpen, setIsMapModalOpen] = useState(false)
    const [selectedLocationName, setSelectedLocationName] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        description: '',
        contact: ''
    })

    const [features, setFeatures] = useState({
        wheelchairAccessible: false,
        accessibleRestrooms: false,
        accessibleParking: false,
        rampAccess: false,
        elevatorAccess: false,
        visualAudioAssistance: false,
        wideDoorways: false,
        levelSurfaces: false
    })

    const handleFeatureToggle = (feature: keyof typeof features) => {
        setFeatures(prev => ({
            ...prev,
            [feature]: !prev[feature]
        }))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        // Basic validation
        if (!formData.name || !formData.address || !formData.latitude || !formData.longitude) {
            setError('Please fill out all required fields (Name, Address, Coordinates).')
            setIsSubmitting(false)
            return
        }

        try {
            const res = await fetch('/api/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, features })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Failed to add location')
            }

            // Success! Redirect back to map with a hard reload to clear the Next.js Client Cache and fetch new markers
            window.location.href = '/'

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred')
            setIsSubmitting(false)
        }
    }

    // Convert camelCase feature name to readable string
    const formatFeatureName = (str: string) => {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
    }

    return (
        <div className="min-h-screen bg-[#E8ECF0] flex justify-center py-10 px-4">
            <div className="bg-white w-full max-w-[700px] rounded-[24px] shadow-sm border border-[#E4E9F0] overflow-hidden flex flex-col relative">

                {/* Header */}
                <div className="p-6 border-b border-[#E4E9F0] flex items-center gap-4 bg-[#f8f8f8]">
                    <Link href="/map" className="h-10 w-10 bg-white border border-[#E4E9F0] hover:border-[#c3f832] rounded-[12px] flex items-center justify-center text-[#292928] cursor-pointer transition-colors shadow-sm">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-[#292928] tracking-tight">Add New Location</h1>
                        <p className="text-sm font-medium text-[#6B7280]">Help improve the map by adding accessible places.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 p-8 overflow-y-auto space-y-8">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                            <MapPin size={16} /> Basic Details
                        </h2>

                        <div>
                            <label className="block text-sm font-bold text-[#292928] mb-1.5">Location Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full h-[52px] bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] px-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all"
                                placeholder="e.g. Central City Park"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#292928] mb-1.5">Full Address *</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full h-[52px] bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] px-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all"
                                placeholder="123 Main St, City, Country"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#292928] mb-1.5 flex items-center gap-2"><Map size={14} className="text-[#9CA3AF]" /> Location Coordinates *</label>
                            
                            {!formData.latitude ? (
                                <button
                                    type="button"
                                    onClick={() => setIsMapModalOpen(true)}
                                    className="w-full h-[52px] bg-white border-2 border-dashed border-[#E4E9F0] hover:border-[#c3f832] hover:bg-[#fcfdfa] rounded-[14px] flex items-center justify-center gap-2 font-bold text-[#6B7280] hover:text-[#292928] transition-all"
                                >
                                    <MapPin size={18} />
                                    Choose Location on Map
                                </button>
                            ) : (
                                <div className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[#292928] truncate">
                                            {selectedLocationName || 'Location Selected'}
                                        </p>
                                        <p className="text-[11px] font-medium text-[#6B7280]">
                                            Ready to submit ({Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)})
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsMapModalOpen(true)}
                                        className="shrink-0 px-4 py-2 bg-white border border-[#E4E9F0] hover:border-[#292928] text-[#292928] text-xs font-bold rounded-[10px] transition-colors"
                                    >
                                        Change
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-[#E4E9F0]" />

                    {/* Features Section */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                            <Check size={16} /> Accessibility Features
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(features).map(([key, value]) => (
                                <label key={key} onClick={(e) => { e.preventDefault(); handleFeatureToggle(key as keyof typeof features) }} className="flex items-start space-x-3 cursor-pointer group p-3 rounded-xl hover:bg-[#f8f8f8] border border-transparent hover:border-[#E4E9F0] transition-colors">
                                    <div className={`mt-0.5 w-5 h-5 shrink-0 rounded-[6px] border flex items-center justify-center transition-colors 
                                        ${value ? 'bg-[#c3f832] border-[#c3f832] text-[#292928]' : 'bg-white border-[#D1D5DB] group-hover:border-[#c3f832]'}
                                    `}>
                                        {value && <Check size={14} strokeWidth={3} />}
                                    </div>
                                    <span className={`text-[14px] leading-tight font-medium ${value ? 'text-[#292928]' : 'text-[#4B5563]'}`}>
                                        {formatFeatureName(key)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <hr className="border-[#E4E9F0]" />

                    {/* Additional Details */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} /> Additional Details
                        </h2>

                        <div>
                            <label className="block text-sm font-bold text-[#292928] mb-1.5 flex items-center gap-2"><Phone size={14} className="text-[#9CA3AF]" /> Phone Number (Optional)</label>
                            <input
                                type="tel"
                                name="contact"
                                value={formData.contact}
                                onChange={handleInputChange}
                                className="w-full h-[52px] bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] px-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all"
                                placeholder="+1 234 567 8900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#292928] mb-1.5 flex items-center gap-2"><FileText size={14} className="text-[#9CA3AF]" /> Description (Optional)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] p-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all resize-y"
                                placeholder="Describe the accessibility features or any other relevant information..."
                            />
                        </div>
                    </div>

                    {/* Submit Section */}
                    <div className="pt-4 pb-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full h-[56px] rounded-[16px] font-black text-[16px] flex items-center justify-center transition-all ${isSubmitting ? 'bg-[#E4E9F0] text-[#9CA3AF] cursor-not-allowed' : 'bg-[#c3f832] text-[#292928] hover:bg-[#b0df2c] hover:scale-[1.02] shadow-[0_8px_30px_rgb(195,248,50,0.2)]'}`}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Location for Review'}
                        </button>
                    </div>

                </form>
            </div>

            {isMapModalOpen && (
                <LocationPickerModal
                    onCancel={() => setIsMapModalOpen(false)}
                    onConfirm={(lat, lng, addressName) => {
                        setFormData(prev => ({
                            ...prev,
                            latitude: String(lat),
                            longitude: String(lng),
                            address: prev.address || addressName // auto-fill if empty
                        }))
                        setSelectedLocationName(addressName)
                        setIsMapModalOpen(false)
                    }}
                />
            )}
        </div>
    )
}
