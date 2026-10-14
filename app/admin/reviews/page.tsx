'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Box, Check, X, MessageSquare, MapPin, Clock, Camera, Image as ImageIcon, Brain, Building2, ExternalLink, ShieldCheck } from 'lucide-react'
import MlReviewTab from './MlReviewTab'

interface Contribution {
    contribution_id: number;
    comment: string;
    media_urls?: string[];
    status: string;
    created_at: string;
    location: {
        name: string;
        address: string;
    };
    user: {
        username: string;
        email: string;
    };
}

interface PendingPhoto {
    photo_id: number;
    url: string;
    caption: string | null;
    status: string;
    created_at: string | null;
    location: {
        name: string;
        address: string;
    };
    user: {
        username: string;
        email: string;
    };
}

export default function AdminReviewsPage() {
    const router = useRouter()
    const [contributions, setContributions] = useState<Contribution[]>([])
    const [locations, setLocations] = useState<any[]>([])
    const [allLocations, setAllLocations] = useState<any[]>([])
    const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
    const [claims, setClaims] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'locations' | 'photos' | 'all' | 'ml' | 'claims'>('ml')
    const [editingLocation, setEditingLocation] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchContributions()
        fetchClaims()
    }, [])

    const fetchClaims = async () => {
        try {
            const res = await fetch('/api/claims')
            if (res.ok) {
                const data = await res.json()
                setClaims(data.claims || [])
            }
        } catch (err: any) {
            console.error('Failed to fetch claims:', err)
        }
    }

    const fetchContributions = async () => {
        try {
            const res = await fetch('/api/admin/reviews')
            if (res.status === 401) {
                router.push('/login')
                return
            }

            if (!res.ok) throw new Error('Failed to fetch contributions')

            const data = await res.json()
            setContributions(data.contributions || [])
            setLocations(data.locations || [])
            setAllLocations(data.allLocations || [])
            setPendingPhotos(data.pendingPhotos || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleReview = async (id: number, type: 'contribution' | 'location', status: 'verified' | 'declined') => {
        try {
            const payload = type === 'contribution'
                ? { contribution_id: id, status }
                : { location_id: id, status };

            const res = await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error(`Failed to ${status} ${type}`)

            // Remove from list
            if (type === 'contribution') setContributions(prev => prev.filter(c => c.contribution_id !== id))
            else {
                const verifiedLoc = locations.find(l => l.location_id === id)
                setLocations(prev => prev.filter(l => l.location_id !== id))
                if (status === 'verified' && verifiedLoc) {
                    setAllLocations(prev => [verifiedLoc, ...prev])
                }
            }
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleContributionDelete = async (locationId: number, contributionId: number) => {
        if (!confirm('Are you sure you want to permanently delete this contribution?')) return;
        try {
            const res = await fetch(`/api/admin/reviews?contribution_id=${contributionId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete contribution')
            
            setAllLocations(prev => prev.map(l => {
                if (l.location_id === locationId) {
                    return {
                        ...l,
                        contributions: (l.contributions || []).filter((c: any) => c.contribution_id !== contributionId)
                    }
                }
                return l
            }))
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to permanently delete this location?')) return;
        try {
            const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete location')
            setAllLocations(prev => prev.filter(l => l.location_id !== id))
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleClaimReview = async (claimId: number, status: 'verified' | 'declined') => {
        try {
            const res = await fetch('/api/claims', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claim_id: claimId, status })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || `Failed to ${status} claim`)
            }

            setClaims(prev => prev.map(c => c.claim_id === claimId ? { ...c, status } : c))
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleEditSave = async (id: number, updates: any) => {
        try {
            const res = await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_id: id, ...updates })
            })
            if (!res.ok) throw new Error('Failed to update location')
            
            setAllLocations(prev => prev.map(l => l.location_id === id ? { ...l, ...updates } : l))
            setEditingLocation(null)
        } catch (err: any) {
            alert(err.message)
        }
    }

    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-[#292928] font-bold">Loading dashboard...</div>

    return (
        <div className="min-h-screen bg-[#E8ECF0]">
            {/* Top Navigation */}
            <nav className="h-[72px] bg-white border-b border-[#E4E9F0] px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-white border-[1.5px] border-[#292928] h-10 w-10 rounded-xl flex items-center justify-center text-[#292928]">
                        <Box size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-[#292928] leading-none">AccessMap</h1>
                        <span className="text-[11px] font-bold text-[#1A73E8] uppercase tracking-wider">Admin Dashboard</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <a href="/map" className="text-sm font-bold text-[#6B7280] hover:text-[#292928] transition-colors">Return to Map</a>
                    <div className="h-8 w-8 bg-[#c3f832] rounded-full flex items-center justify-center text-[#292928] font-bold text-sm shadow-sm ring-2 ring-white">A</div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto p-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-[#292928] tracking-tight mb-2">Pending Reviews</h2>
                    <p className="text-[#6B7280] font-medium mb-6">Review community contributions before they appear on the public map.</p>

                    {/* Tab Switcher */}
                    <div className="flex flex-wrap gap-1 p-1 bg-white border border-[#E4E9F0] rounded-2xl mb-6 shadow-sm">
                        <button
                            onClick={() => setActiveTab('ml')}
                            className={`flex-1 py-2 px-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'ml' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#1A73E8] hover:bg-[#E8F0FE]'}`}
                        >
                            <Brain size={14} /> AI Analysis
                        </button>
                        <button
                            onClick={() => setActiveTab('claims')}
                            className={`flex-1 py-2 px-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'claims' ? 'bg-[#292928] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#292928]'}`}
                        >
                            <Building2 size={14} /> Business Claims ({claims.filter(c => c.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('locations')}
                            className={`flex-1 py-2 px-3 text-[13px] font-bold rounded-xl transition-all ${activeTab === 'locations' ? 'bg-[#292928] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#292928]'}`}
                        >
                            New Locations ({locations.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 py-2 px-3 text-[13px] font-bold rounded-xl transition-all ${activeTab === 'all' ? 'bg-[#292928] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#292928]'}`}
                        >
                            All Locations ({allLocations.length})
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Locations Tab */}
                {activeTab === 'locations' && locations.length === 0 && (
                    <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-12 flex flex-col items-center text-center shadow-sm">
                        <div className="h-20 w-20 bg-[#f8f8f8] rounded-full flex items-center justify-center text-[#d1d5db] mb-4">
                            <Check size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-[#292928] mb-2">All caught up!</h3>
                        <p className="text-[#6B7280] font-medium max-w-sm">There are no pending locations to review at the moment.</p>
                    </div>
                )}

                {activeTab === 'locations' && locations.map((loc) => (
                    <div key={loc.location_id} className="bg-white rounded-[20px] border border-[#E4E9F0] p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow mb-4">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-[#292928] leading-tight mb-1">{loc.name}</h3>
                                    <p className="text-[13px] text-[#6B7280] font-medium flex items-center gap-1">
                                        <MapPin size={14} /> {loc.address}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end text-right">
                                    <span className="text-[12px] font-bold text-[#292928]">Community User</span>
                                    <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1">
                                        <Clock size={12} /> {new Date(loc.lastUpdated || Date.now()).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-[#f8f8f8] rounded-2xl p-4 border border-[#E4E9F0]/60 relative">
                                <div className="absolute top-4 left-4 text-[#d1d5db]">
                                    <MapPin size={16} />
                                </div>
                                <p className="text-[14px] text-[#292928] font-medium leading-relaxed pl-8">
                                    "{loc.description || 'No description provided.'}"
                                </p>
                            </div>
                        </div>

                        <div className="flex md:flex-col gap-3 justify-center shrink-0 border-t md:border-t-0 md:border-l border-[#f8f8f8] pt-4 md:pt-0 md:pl-6">
                            <button
                                onClick={() => handleReview(loc.location_id, 'location', 'verified')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#c3f832] text-[#292928] font-bold text-sm hover:scale-[1.02] hover:bg-[#b0df2c] transition-all shadow-[0_4px_14px_rgb(195,248,50,0.2)]"
                            >
                                <Check size={18} strokeWidth={2.5} /> Accept
                            </button>
                            <button
                                onClick={() => handleReview(loc.location_id, 'location', 'declined')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white border border-[#E4E9F0] text-[#E53935] font-bold text-sm hover:bg-red-50 hover:border-red-100 transition-colors"
                            >
                                <X size={18} strokeWidth={2.5} /> Decline
                            </button>
                        </div>
                    </div>
                ))}



                {/* All Locations Tab */}
                {activeTab === 'all' && allLocations.length === 0 && (
                    <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-12 flex flex-col items-center text-center shadow-sm">
                        <div className="h-20 w-20 bg-[#f8f8f8] rounded-full flex items-center justify-center text-[#d1d5db] mb-4">
                            <MapPin size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-[#292928] mb-2">No verified locations</h3>
                        <p className="text-[#6B7280] font-medium max-w-sm">There are no approved locations on the map yet.</p>
                    </div>
                )}

                {activeTab === 'all' && allLocations.map((loc) => (
                    <div key={loc.location_id} className="bg-white rounded-[20px] border border-[#E4E9F0] p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow mb-4">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-[#292928] leading-tight mb-1">{loc.name}</h3>
                                    <p className="text-[13px] text-[#6B7280] font-medium flex items-center gap-1">
                                        <MapPin size={14} /> {loc.address}
                                    </p>
                                </div>
                            </div>
                            {loc.description && (
                                <p className="text-[14px] text-[#292928] font-medium leading-relaxed">
                                    {loc.description}
                                </p>
                            )}

                            {loc.contributions && loc.contributions.length > 0 && (
                                <details className="mt-4 border border-[#E4E9F0] rounded-xl overflow-hidden group">
                                    <summary className="bg-[#f8f8f8] px-4 py-3 font-bold text-[14px] text-[#292928] cursor-pointer hover:bg-[#E4E9F0] transition-colors flex justify-between items-center">
                                        <span>Verified Contributions ({loc.contributions.length})</span>
                                        <span className="text-[#9CA3AF] group-open:rotate-180 transition-transform text-xs">▼</span>
                                    </summary>
                                    <div className="bg-white p-4 divide-y divide-[#E4E9F0]">
                                        {loc.contributions.map((c: any) => (
                                            <div key={c.contribution_id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-4">
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[13px] font-bold text-[#292928]">{c.user.username || 'User'}</span>
                                                        <span className="text-[11px] text-[#9CA3AF]">{new Date(c.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    {c.comment && (
                                                        <p className="text-[13px] text-[#6B7280] mb-3">{c.comment}</p>
                                                    )}
                                                    {c.media_urls && c.media_urls.length > 0 && (
                                                        <div className="flex gap-2 overflow-x-auto pb-2 min-h-[72px]">
                                                            {c.media_urls.map((url: string, i: number) => (
                                                                <img key={i} src={url} alt="Contribution photo" className="h-16 w-16 object-cover rounded-lg border border-[#E4E9F0]" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-start shrink-0">
                                                    <button
                                                        onClick={() => handleContributionDelete(loc.location_id, c.contribution_id)}
                                                        className="text-[12px] font-bold text-[#E53935] hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </div>

                        <div className="flex md:flex-col gap-3 justify-center shrink-0 border-t md:border-t-0 md:border-l border-[#E4E9F0] pt-4 md:pt-0 md:pl-6">
                            <button
                                onClick={() => setEditingLocation(loc)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-6 rounded-xl bg-[#f8f8f8] border border-[#E4E9F0] text-[#292928] font-bold text-sm hover:bg-[#e4e9f0] transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(loc.location_id)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-6 rounded-xl bg-white border border-[#E4E9F0] text-[#E53935] font-bold text-sm hover:bg-red-50 hover:border-red-100 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {/* Business Claims Tab */}
                {activeTab === 'claims' && (
                    <div className="space-y-4">
                        {claims.length === 0 ? (
                            <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-12 flex flex-col items-center text-center shadow-sm">
                                <div className="h-20 w-20 bg-[#f8f8f8] rounded-full flex items-center justify-center text-[#d1d5db] mb-4">
                                    <Building2 size={36} />
                                </div>
                                <h3 className="text-xl font-bold text-[#292928] mb-2">No Business Claims</h3>
                                <p className="text-[#6B7280] font-medium max-w-sm">No business owners have submitted ownership claims yet.</p>
                            </div>
                        ) : (
                            claims.map((claim) => (
                                <div key={claim.claim_id} className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <span className="bg-[#f8f8f8] border border-[#E4E9F0] text-[#292928] text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-lg">
                                                Claim #{claim.claim_id}
                                            </span>
                                            {claim.status === 'pending' && (
                                                <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1">
                                                    <Clock size={13} /> Pending Review
                                                </span>
                                            )}
                                            {claim.status === 'verified' && (
                                                <span className="bg-[#c3f832]/30 text-[#292928] border border-[#c3f832] text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1">
                                                    <ShieldCheck size={13} /> Approved & Claimed
                                                </span>
                                            )}
                                            {claim.status === 'declined' && (
                                                <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1">
                                                    <X size={13} /> Declined
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-black text-[#292928] mb-1">
                                            {claim.business_name}
                                        </h3>
                                        <p className="text-sm text-[#6B7280] font-medium flex items-center gap-1.5 mb-4">
                                            <MapPin size={15} className="shrink-0" />
                                            {claim.location?.address || 'Address not available'} (Location #{claim.location_id})
                                        </p>

                                        {/* Claimant info card */}
                                        <div className="bg-[#F8FAFC] border border-[#E4E9F0] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                                            <div>
                                                <span className="text-[#9CA3AF] font-bold block mb-0.5">Claimant</span>
                                                <span className="text-[#292928] font-bold">{claim.claimant_name} ({claim.claimant_role})</span>
                                                <span className="text-[#6B7280] block text-[11px]">User: @{claim.user?.username || 'member'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[#9CA3AF] font-bold block mb-0.5">Official Contact</span>
                                                <span className="text-[#292928] font-medium block">{claim.contact_email}</span>
                                                <span className="text-[#292928] font-medium block">{claim.contact_phone}</span>
                                            </div>
                                        </div>

                                        {claim.verification_docs && claim.verification_docs.length > 0 && (
                                            <div className="mb-3">
                                                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">Verification Document / Link:</span>
                                                {claim.verification_docs.map((doc: string, idx: number) => (
                                                    <a
                                                        key={idx}
                                                        href={doc.startsWith('http') ? doc : `https://${doc}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A73E8] hover:underline bg-[#E8F0FE] px-3 py-1.5 rounded-lg border border-[#D2E3FC]"
                                                    >
                                                        <ExternalLink size={13} />
                                                        {doc}
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {claim.notes && (
                                            <div className="text-xs text-[#4B5563] bg-[#f8f8f8] p-3 rounded-xl border border-[#E4E9F0]">
                                                <span className="font-bold text-[#292928]">Claimant Notes: </span>
                                                {claim.notes}
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center gap-3">
                                            <Link
                                                href={`/location/${claim.location_id}/dashboard`}
                                                className="text-xs font-bold text-[#292928] hover:text-[#1A73E8] flex items-center gap-1 underline underline-offset-4"
                                            >
                                                Preview Dashboard <ExternalLink size={12} />
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex md:flex-col gap-3 justify-center shrink-0 border-t md:border-t-0 md:border-l border-[#E4E9F0] pt-4 md:pt-0 md:pl-6">
                                        {claim.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleClaimReview(claim.claim_id, 'verified')}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#c3f832] text-[#292928] font-black text-xs hover:bg-[#b5eb29] transition-all shadow-sm cursor-pointer"
                                                >
                                                    <Check size={16} strokeWidth={3} /> Approve Ownership
                                                </button>
                                                <button
                                                    onClick={() => handleClaimReview(claim.claim_id, 'declined')}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-white border border-[#E4E9F0] text-[#E53935] font-bold text-xs hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer"
                                                >
                                                    <X size={16} /> Decline
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleClaimReview(claim.claim_id, claim.status === 'verified' ? 'declined' : 'verified')}
                                                className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#f8f8f8] border border-[#E4E9F0] text-[#6B7280] font-bold text-xs hover:text-[#292928] transition-colors"
                                            >
                                                Switch to {claim.status === 'verified' ? 'Declined' : 'Approved'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ML Analysis Tab */}
                {activeTab === 'ml' && <MlReviewTab />}
            </main>

            {/* Editing Modal */}
            {editingLocation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1F2E]/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[#292928]">Edit Location</h2>
                            <button onClick={() => setEditingLocation(null)} className="p-1 text-[#9CA3AF] hover:bg-[#f8f8f8] rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const fd = new FormData(e.currentTarget)
                            handleEditSave(editingLocation.location_id, {
                                name: fd.get('name'),
                                address: fd.get('address'),
                                description: fd.get('description')
                            })
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[#6B7280] mb-1">Name</label>
                                <input name="name" defaultValue={editingLocation.name} required className="w-full border border-[#E4E9F0] rounded-xl px-4 py-2 bg-[#f8f8f8] focus:ring-2 focus:ring-[#c3f832] focus:outline-none text-[#292928] font-medium" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#6B7280] mb-1">Address</label>
                                <input name="address" defaultValue={editingLocation.address} required className="w-full border border-[#E4E9F0] rounded-xl px-4 py-2 bg-[#f8f8f8] focus:ring-2 focus:ring-[#c3f832] focus:outline-none text-[#292928] font-medium" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#6B7280] mb-1">Description</label>
                                <textarea name="description" defaultValue={editingLocation.description} className="w-full border border-[#E4E9F0] rounded-xl px-4 py-2 bg-[#f8f8f8] focus:ring-2 focus:ring-[#c3f832] focus:outline-none text-[#292928] font-medium min-h-[100px] resize-none" />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setEditingLocation(null)} className="flex-1 py-3 font-bold text-[#6B7280] bg-[#f8f8f8] rounded-xl hover:bg-[#E4E9F0] transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 font-bold text-[#292928] bg-[#c3f832] rounded-xl hover:bg-[#b0df2c] transition-colors">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    )
}
