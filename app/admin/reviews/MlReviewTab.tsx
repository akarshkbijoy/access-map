'use client'

import { useState, useEffect } from 'react'
import { Brain, CheckCircle, X, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

interface MlPhoto {
    photo_id: number
    location_id: number
    url: string
    caption: string | null
    status: string
    created_at: string | null
    declared_classes: string[]
    ml_analysis: any
    ml_pushed: boolean
    location: { name: string; address: string }
    user: { username: string; email: string }
}

function BoundingBoxOverlay({ photo, analysis }: { photo: MlPhoto; analysis: any }) {
    const bboxes: any[] = analysis?.bboxes_percent || []
    const [imgLoaded, setImgLoaded] = useState(false)

    return (
        <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
            <img
                src={photo.url}
                alt="ML analyzed"
                className="w-full h-full object-contain rounded-lg bg-[#f8f8f8]"
                onLoad={() => setImgLoaded(true)}
            />
            {imgLoaded && bboxes.map((box, i) => (
                <div
                    key={i}
                    className="absolute border-2 pointer-events-none"
                    style={{
                        left: `${box.x_pct}%`,
                        top: `${box.y_pct}%`,
                        width: `${box.w_pct}%`,
                        height: `${box.h_pct}%`,
                        borderColor: box.is_declared ? '#16a34a' : '#f59e0b',
                        boxShadow: `0 0 0 1px ${box.is_declared ? '#16a34a' : '#f59e0b'}`,
                    }}
                >
                    <span className="absolute -top-5 left-0 text-[10px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
                        style={{ background: box.is_declared ? '#16a34a' : '#f59e0b', color: '#fff' }}>
                        {box.display_name} {Math.round(box.confidence * 100)}%
                    </span>
                </div>
            ))}
            {bboxes.length === 0 && imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/50 text-white text-[11px] px-2 py-1 rounded">No detections</span>
                </div>
            )}
        </div>
    )
}

export default function MlReviewTab() {
    const [photos, setPhotos] = useState<MlPhoto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [actionLoading, setActionLoading] = useState<number | null>(null)
    const [filter, setFilter] = useState<'all' | 'pending' | 'pushed'>('all')

    useEffect(() => { fetchPhotos() }, [])

    async function fetchPhotos() {
        try {
            const res = await fetch('/api/ml/photos')
            if (!res.ok) throw new Error('Failed to fetch ML photos')
            const data = await res.json()
            setPhotos(data.photos || [])
        } catch (e: any) {
            setError(e.message)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleAction(photoId: number, action: 'push' | 'pull') {
        setActionLoading(photoId)
        try {
            const res = await fetch('/api/ml/photos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_id: photoId, action })
            })
            if (!res.ok) throw new Error('Action failed')
            const d = await res.json()
            setPhotos(prev => prev.map(p =>
                p.photo_id === photoId
                    ? { ...p, ml_pushed: d.ml_pushed, status: d.status }
                    : p
            ))
        } catch (e: any) {
            alert(e.message)
        } finally {
            setActionLoading(null)
        }
    }

    async function handleDelete(photoId: number) {
        if (!confirm('Are you sure you want to permanently delete this photo and its associated contribution?')) return;
        setActionLoading(photoId)
        try {
            const res = await fetch(`/api/ml/photos?photo_id=${photoId}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete photo')
            setPhotos(prev => prev.filter(p => p.photo_id !== photoId))
        } catch (e: any) {
            alert(e.message)
        } finally {
            setActionLoading(null)
        }
    }

    const filtered = photos.filter(p => {
        if (filter === 'pushed') return p.ml_pushed
        if (filter === 'pending') return !p.ml_pushed
        return true
    })

    if (isLoading) return <div className="py-12 text-center text-[#6B7280] font-medium">Loading ML analysis results...</div>

    return (
        <div>
            {/* Filters */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
                {(['all', 'pending', 'pushed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-[13px] font-bold border transition-all ${filter === f ? 'bg-[#292928] text-white border-[#292928]' : 'bg-white text-[#6B7280] border-[#E4E9F0] hover:border-[#292928]'}`}>
                        {f === 'all' ? `All (${photos.length})` : f === 'pushed' ? `Pushed to Map (${photos.filter(p => p.ml_pushed).length})` : `Pending (${photos.filter(p => !p.ml_pushed).length})`}
                    </button>
                ))}
            </div>

            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

            {filtered.length === 0 && (
                <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-12 flex flex-col items-center text-center shadow-sm">
                    <div className="h-20 w-20 bg-[#f8f8f8] rounded-full flex items-center justify-center text-[#d1d5db] mb-4">
                        <Brain size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-[#292928] mb-2">No ML-analyzed photos</h3>
                    <p className="text-[#6B7280] font-medium max-w-sm">Photos analyzed by the AI model will appear here. Users must classify features when uploading.</p>
                </div>
            )}

            <div className="space-y-4">
                {filtered.map(photo => {
                    const analysis = photo.ml_analysis as any
                    const isExpanded = expandedId === photo.photo_id
                    const found = analysis?.found ?? false
                    const analyzedAt = analysis?.analyzed_at ? new Date(analysis.analyzed_at).toLocaleString() : null

                    return (
                        <div key={photo.photo_id} className="bg-white rounded-[20px] border border-[#E4E9F0] shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            {/* Card Header */}
                            <div className="p-5 flex gap-4 items-start">
                                {/* Thumbnail with bbox preview */}
                                <div className="relative flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden border border-[#E4E9F0] cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : photo.photo_id)}>
                                    <img src={photo.url} alt="Photo" className="w-full h-full object-cover" />
                                    {/* Mini bbox dots */}
                                    {(analysis?.bboxes_percent || []).map((box: any, bi: number) => (
                                        <div key={bi} className="absolute border pointer-events-none"
                                            style={{
                                                left: `${box.x_pct}%`, top: `${box.y_pct}%`,
                                                width: `${box.w_pct}%`, height: `${box.h_pct}%`,
                                                borderColor: box.is_declared ? '#16a34a' : '#f59e0b',
                                                borderWidth: '1.5px',
                                            }} />
                                    ))}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-[14px] font-bold text-[#292928] truncate">{photo.location.name}</p>
                                            <p className="text-[12px] text-[#6B7280]">{photo.location.address}</p>
                                            <p className="text-[11px] text-[#9CA3AF] mt-0.5">by {photo.user.username} · {photo.created_at ? new Date(photo.created_at).toLocaleDateString() : '—'}</p>
                                        </div>
                                        {/* Status badges */}
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${photo.ml_pushed ? 'bg-[#E6F4EA] text-[#0F9D58]' : 'bg-[#FFF8E1] text-[#F4A100]'}`}>
                                                {photo.ml_pushed ? '✓ On Map' : '⏳ Not Pushed'}
                                            </span>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${found ? 'bg-[#E6F4EA] text-[#0F9D58]' : 'bg-[#FFEBEE] text-[#E53935]'}`}>
                                                AI: {found ? '✓ Detected' : '✗ Not Found'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Declared vs detected classes */}
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        <span className="text-[10px] font-bold text-[#6B7280] mr-1">Declared:</span>
                                        {photo.declared_classes.map(c => (
                                            <span key={c} className="text-[10px] bg-[#E8F0FE] text-[#1A73E8] px-1.5 py-0.5 rounded-full font-bold">{c}</span>
                                        ))}
                                    </div>
                                    {analysis?.filtered_detections?.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            <span className="text-[10px] font-bold text-[#6B7280] mr-1">AI found:</span>
                                            {analysis.filtered_detections.map((d: any, i: number) => (
                                                <span key={i} className="text-[10px] bg-[#E6F4EA] text-[#0F9D58] px-1.5 py-0.5 rounded-full font-bold">
                                                    {d.display_name} {Math.round(d.confidence * 100)}%
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {analyzedAt && <p className="text-[10px] text-[#9CA3AF] mt-1">Analyzed: {analyzedAt}</p>}
                                </div>
                            </div>

                            {/* Action bar */}
                            <div className="px-5 pb-4 flex items-center gap-3 border-t border-[#f8f8f8] pt-3">
                                <button onClick={() => setExpandedId(isExpanded ? null : photo.photo_id)}
                                    className="flex items-center gap-1.5 text-[12px] font-bold text-[#6B7280] hover:text-[#292928] transition-colors">
                                    {isExpanded ? <><ChevronUp size={14} /> Hide detail</> : <><ChevronDown size={14} /> View with bboxes</>}
                                </button>
                                <div className="flex-1" />
                                {photo.ml_pushed ? (
                                    <button
                                        onClick={() => handleAction(photo.photo_id, 'pull')}
                                        disabled={actionLoading === photo.photo_id}
                                        className="flex items-center gap-1.5 h-9 px-5 rounded-xl bg-white border border-[#E53935] text-[#E53935] font-bold text-[12px] hover:bg-red-50 transition-colors disabled:opacity-50">
                                        {actionLoading === photo.photo_id ? '...' : <><EyeOff size={14} /> Pull from Map</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAction(photo.photo_id, 'push')}
                                        disabled={actionLoading === photo.photo_id}
                                        className="flex items-center gap-1.5 h-9 px-5 rounded-xl bg-[#c3f832] text-[#292928] font-bold text-[12px] hover:bg-[#b0df2c] transition-all shadow-sm disabled:opacity-50">
                                        {actionLoading === photo.photo_id ? '...' : <><Eye size={14} /> Push to Map</>}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(photo.photo_id)}
                                    disabled={actionLoading === photo.photo_id}
                                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white border border-[#E4E9F0] text-[#E53935] font-bold text-[12px] hover:bg-red-50 hover:border-red-100 transition-colors disabled:opacity-50">
                                    <X size={14} /> Delete
                                </button>
                            </div>

                            {/* Expanded: full image with bounding boxes */}
                            {isExpanded && (
                                <div className="border-t border-[#E4E9F0] p-5 bg-[#f8f8f8]">
                                    <div className="max-w-lg mx-auto">
                                        <BoundingBoxOverlay photo={photo} analysis={analysis} />
                                        {/* Legend */}
                                        <div className="mt-3 flex gap-4 text-[11px] font-medium text-[#6B7280]">
                                            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 border-2 border-[#16a34a]"></span> Declared class detected</span>
                                            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 border-2 border-[#f59e0b]"></span> Other detection</span>
                                        </div>
                                        {/* Summary */}
                                        {analysis?.summary && (
                                            <div className="mt-3 bg-white rounded-lg border border-[#E4E9F0] p-3 text-[12px]">
                                                <p className="font-bold text-[#292928] mb-1">AI Assessment</p>
                                                <p className="text-[#6B7280]">{analysis.summary.assessment}</p>
                                                {analysis.processing_time_ms && (
                                                    <p className="text-[#9CA3AF] mt-1">Processed in {analysis.processing_time_ms}ms</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
