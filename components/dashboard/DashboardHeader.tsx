'use client'

import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, Phone, ShieldCheck, Settings, Star, AlertCircle, Share2, Compass } from 'lucide-react'

interface DashboardHeaderProps {
    locationId: number;
    name: string;
    address?: string | null;
    isClaimed?: boolean | null;
    scorePercentage: number;
    canManage: boolean;
    contactPhone?: string | null;
    coverPhotoUrl?: string | null;
}

export default function DashboardHeader({
    locationId,
    name,
    address,
    isClaimed,
    scorePercentage,
    canManage,
    contactPhone,
    coverPhotoUrl
}: DashboardHeaderProps) {
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${name} Accessibility Dashboard`,
                url: window.location.href
            }).catch(() => {})
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Dashboard link copied to clipboard!')
        }
    }

    return (
        <div className="bg-white rounded-[24px] border border-[#E4E9F0] shadow-sm overflow-hidden mb-8">
            {/* Cover image or Banner */}
            <div className="relative h-48 md:h-64 w-full bg-gradient-to-r from-[#1A1F2E] via-[#2A3447] to-[#1A1F2E] overflow-hidden">
                {coverPhotoUrl ? (
                    <img
                        src={coverPhotoUrl}
                        alt={name}
                        className="w-full h-full object-cover opacity-60"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <Building2 size={120} className="text-white" />
                    </div>
                )}
                
                {/* Floating Navigation Controls */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <Link
                        href="/map"
                        className="bg-white/90 backdrop-blur-md text-[#292928] px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-white transition-all flex items-center gap-1.5 shadow-md border border-[#E4E9F0]"
                    >
                        <ArrowLeft size={14} /> Back to Map
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="bg-white/90 backdrop-blur-md text-[#292928] p-2 rounded-xl hover:bg-white transition-all shadow-md border border-[#E4E9F0]"
                            title="Share Dashboard"
                        >
                            <Share2 size={15} />
                        </button>
                        {canManage && (
                            <Link
                                href={`/location/${locationId}/manage`}
                                className="bg-[#c3f832] text-[#292928] px-3.5 py-2 rounded-xl text-xs font-black hover:bg-[#b3ea25] transition-all flex items-center gap-1.5 shadow-md"
                            >
                                <Settings size={14} /> Manage Studio
                            </Link>
                        )}
                    </div>
                </div>

                {/* Score Pill in cover */}
                <div className="absolute bottom-4 right-4">
                    <div className="bg-[#c3f832] text-[#292928] px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                        <Star size={14} fill="currentColor" /> {scorePercentage}% Accessible
                    </div>
                </div>
            </div>

            {/* Location Details Bar */}
            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h1 className="text-2xl md:text-3xl font-black text-[#292928] tracking-tight">
                                {name}
                            </h1>
                            {isClaimed ? (
                                <span className="inline-flex items-center gap-1 bg-[#E6F4EA] text-[#0F9D58] border border-[#CEEAD6] text-xs font-bold px-2.5 py-1 rounded-lg">
                                    <ShieldCheck size={14} /> Official Verified Dashboard
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 bg-gray-100 text-[#6B7280] border border-[#E4E9F0] text-xs font-bold px-2.5 py-1 rounded-lg">
                                    Community Profile
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-[#6B7280] font-medium flex items-center gap-1.5">
                            <MapPin size={15} className="shrink-0 text-[#9CA3AF]" />
                            {address || 'Address not listed'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {contactPhone && (
                            <a
                                href={`tel:${contactPhone}`}
                                className="inline-flex items-center gap-2 bg-[#f8f8f8] border border-[#E4E9F0] hover:border-[#292928] text-[#292928] px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                            >
                                <Phone size={14} /> Direct Assistance: {contactPhone}
                            </a>
                        )}

                        <Link
                            href={`/location/${locationId}`}
                            className="inline-flex items-center gap-1.5 bg-[#292928] text-white hover:bg-black px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                            <Compass size={14} /> View Location History
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
