'use client'

import { useState } from 'react'
import { CardLocation } from './LocationList'
import { ArrowLeft, MapPin, Upload, MessageSquare, Star, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react'

interface LocationDetailPanelProps {
    location: CardLocation;
    onClose: () => void;
}

export default function LocationDetailPanel({ location, onClose }: LocationDetailPanelProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [comment, setComment] = useState('')
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [localContributions, setLocalContributions] = useState<any[]>(location.contributions || [])

    const [selectedFiles, setSelectedFiles] = useState<{file: File, preview: string}[]>([])
    const [uploadProgress, setUploadProgress] = useState('')
    const fileInputRef = import('react').then(React => React.useRef<HTMLInputElement>(null)).catch(() => ({current: null as HTMLInputElement | null})) as any

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type))
            .map(file => ({ file, preview: URL.createObjectURL(file) }))
        
        setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5))
        if (e.target) e.target.value = ''
    }

    // Simplified format for feature names
    const formatFeatureName = (str: string) => str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

    const submitContribution = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!comment.trim()) return

        setIsSubmitting(true)
        setMessage(null)

        try {
            const uploadedPhotoUrls: string[] = []

            if (selectedFiles.length > 0) {
                setUploadProgress('Uploading photos...')
                for (let i = 0; i < selectedFiles.length; i++) {
                    const photoForm = new FormData()
                    photoForm.append('file', selectedFiles[i].file)
                    photoForm.append('location_id', String(location.location_id))
                    
                    const res = await fetch('/api/photos/upload', {
                        method: 'POST',
                        body: photoForm
                    })
                    if (!res.ok) throw new Error(`Failed to upload photo ${i + 1}`)
                    const data = await res.json()
                    if (data.url) uploadedPhotoUrls.push(data.url)
                }
            }

            setUploadProgress('Submitting comment...')
            // Placeholder user_id since we haven't implemented auth yet. 
            // In a real app, this comes from the session.
            const res = await fetch('/api/contributions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location_id: location.location_id,
                    user_id: 1, // Dummy user ID for now
                    comment: comment,
                    media_urls: uploadedPhotoUrls
                })
            })

            if (!res.ok) throw new Error('Failed to submit contribution')
            const responseData = await res.json()

            setComment('')
            setSelectedFiles([])
            
            if (responseData.contribution) {
                if (responseData.contribution.status === 'verified') {
                    setLocalContributions(prev => [responseData.contribution, ...prev])
                }
                setMessage({ type: 'success', text: 'Contribution published successfully!' })
            } else {
                setMessage({ type: 'success', text: 'Contribution submitted successfully!' })
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Something went wrong.' })
        } finally {
            setIsSubmitting(false)
            setUploadProgress('')
        }
    }

    const availableFeatures: string[] = [];
    let totalFeatures = 0;

    if (location.features && Array.isArray(location.features)) {
        location.features.forEach((fObj) => {
            Object.entries(fObj).forEach(([key, value]) => {
                if (key !== 'feature_id' && key !== 'location_id') {
                    totalFeatures++;
                    if (value === true) {
                        availableFeatures.push(formatFeatureName(key));
                    }
                }
            });
        });
    }

    const scorePercentage = totalFeatures > 0 ? Math.round((availableFeatures.length / totalFeatures) * 100) : 0;

    return (
        <div className="flex flex-col bg-[#ffffff] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] h-[calc(100vh-100px)] overflow-hidden pointer-events-auto border border-[#E4E9F0] animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-5 border-b border-[#E4E9F0] flex justify-between items-center bg-[#f8f8f8] sticky top-0 z-10 shrink-0">
                <button
                    onClick={onClose}
                    className="h-10 w-10 flex border-[1.5px] border-[#E4E9F0] rounded-xl items-center justify-center text-[#292928] bg-white hover:border-[#292928] transition-colors cursor-pointer shadow-sm"
                >
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <div className="flex gap-2">
                    <span className="bg-[#c3f832] text-[#292928] px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> {scorePercentage}% Score
                    </span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* Hero / Basic Info */}
                <div className="p-6">
                    <div className="mb-4">
                        <h2 className="text-2xl font-black text-[#292928] tracking-tight leading-none mb-2">{location.name}</h2>
                        <p className="text-[14px] text-[#6B7280] font-medium flex items-start gap-1.5">
                            <MapPin size={16} className="mt-0.5 shrink-0" />
                            <span>{location.address || 'Address not listed'}</span>
                        </p>
                    </div>

                    {location.description && (
                         <div className="mb-6">
                            <p className="text-[14px] text-[#4B5563] leading-relaxed bg-[#f8f8f8] p-4 rounded-xl border border-[#E4E9F0]">
                                {location.description}
                            </p>
                         </div>
                    )}

                    {/* Status Badge */}
                    <div className="inline-flex mb-6">
                        {location.status === 'verified' && <span className="flex items-center gap-1.5 bg-green-50 text-green-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-green-200"><CheckCircle size={14} /> Verified Location</span>}
                        {location.status === 'pending' && <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-yellow-200"><Clock size={14} /> Pending Review</span>}
                        {location.status === 'flagged' && <span className="flex items-center gap-1.5 bg-red-50 text-red-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-red-200"><AlertTriangle size={14} /> Flagged</span>}
                    </div>

                    <hr className="border-[#E4E9F0] mb-6" />

                    {/* Accessibility Features */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-[#292928] uppercase tracking-wider mb-4">Confirmed Features</h3>
                        {availableFeatures.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {availableFeatures.map(f => (
                                    <span key={f} className="px-3 py-1.5 bg-[#f8f8f8] border border-[#E4E9F0] rounded-lg text-xs font-bold text-[#292928] shadow-sm">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[#9CA3AF] italic">No specific features recorded yet.</p>
                        )}
                    </div>

                    {/* Community Contributions Area */}
                    <div>
                        <h3 className="text-sm font-bold text-[#292928] uppercase tracking-wider mb-4 border-b border-[#E4E9F0] pb-2">Community Updates</h3>

                        {/* Contribution Form */}
                        <div className="bg-[#f8f8f8] rounded-[16px] p-4 border border-[#E4E9F0] mb-6 shadow-inner">
                            <h4 className="text-xs font-bold text-[#6B7280] mb-3 flex justify-between items-center">
                                ADD A CONTRIBUTION
                                {uploadProgress && <span className="text-[#1A73E8] lowercase text-[10px]">{uploadProgress}</span>}
                            </h4>

                            {message && (
                                <div className={`mb-3 p-2 rounded text-xs font-bold ${message.type === 'success' ? 'bg-[#c3f832]/20 text-[#292928]' : 'bg-red-50 text-red-600'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={submitContribution}>
                                <textarea
                                    className="w-full bg-white border border-[#E4E9F0] rounded-[12px] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c3f832] resize-none mb-3 placeholder:text-[#9CA3AF]"
                                    rows={3}
                                    placeholder="Add a comment about accessibility (e.g., 'Ramp is under construction')..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                ></textarea>

                                {selectedFiles.length > 0 && (
                                    <div className="flex gap-2 mb-3 overflow-x-auto">
                                        {selectedFiles.map((sf, i) => (
                                            <div key={i} className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-[#E4E9F0]">
                                                <img src={sf.preview} className="h-full w-full object-cover" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} 
                                                    className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl-md hover:bg-black"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between items-center">
                                    <div className="relative text-[#9CA3AF] hover:text-[#292928] transition-colors p-2 rounded-lg hover:bg-[#E4E9F0] cursor-pointer">
                                        <Upload size={18} />
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            multiple
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || (!comment.trim() && selectedFiles.length === 0)}
                                        className="bg-[#292928] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSubmitting ? 'Sending...' : <><MessageSquare size={14} /> Post Update</>}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* List of existing approved contributions */}
                        {localContributions && localContributions.length > 0 ? (
                            <div className="space-y-4">
                                {localContributions.map((contrib) => (
                                    <div key={contrib.contribution_id} className="bg-white rounded-[16px] p-4 border border-[#E4E9F0] shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[13px] font-bold text-[#292928]">{contrib.user?.username || 'Community Member'}</span>
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">{new Date(contrib.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {contrib.comment && (
                                            <p className="text-[13px] text-[#4B5563] leading-relaxed mb-2">{contrib.comment}</p>
                                        )}
                                        {contrib.media_urls && contrib.media_urls.length > 0 && (
                                            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                                                {contrib.media_urls.map((url: string, i: number) => (
                                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="flex-shrink-0 block rounded-lg overflow-hidden border border-[#E4E9F0]">
                                                        <img src={url} className="h-20 w-20 object-cover" alt="Contribution photo" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <MessageSquare className="mx-auto text-[#E4E9F0] mb-2" size={32} />
                                <p className="text-sm text-[#9CA3AF] font-medium">Be the first to contribute to this location's data.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E4E9F0; border-radius: 10px; }
            `}</style>
        </div>
    )
}
