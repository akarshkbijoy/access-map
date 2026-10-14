'use client'

import { useState } from 'react'
import { X, Building2, ShieldCheck, Check, AlertCircle, FileText, Phone, Mail, User, Briefcase } from 'lucide-react'

interface ClaimBusinessModalProps {
    locationId: number;
    locationName: string;
    locationAddress?: string | null;
    isOpen: boolean;
    onClose: () => void;
    onClaimSuccess?: () => void;
}

export default function ClaimBusinessModal({
    locationId,
    locationName,
    locationAddress,
    isOpen,
    onClose,
    onClaimSuccess
}: ClaimBusinessModalProps) {
    const [businessName, setBusinessName] = useState(locationName || '')
    const [claimantName, setClaimantName] = useState('')
    const [claimantRole, setClaimantRole] = useState('Store Manager')
    const [contactEmail, setContactEmail] = useState('')
    const [contactPhone, setContactPhone] = useState('')
    const [verificationDocUrl, setVerificationDocUrl] = useState('')
    const [notes, setNotes] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorMessage('')

        try {
            const res = await fetch('/api/claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location_id: locationId,
                    business_name: businessName,
                    claimant_name: claimantName,
                    claimant_role: claimantRole,
                    contact_email: contactEmail,
                    contact_phone: contactPhone,
                    verification_docs: verificationDocUrl.trim() ? [verificationDocUrl.trim()] : [],
                    notes: notes.trim()
                })
            })

            const data = await res.json()
            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error('Please log in to claim a business location.')
                }
                throw new Error(data.message || 'Failed to submit claim.')
            }

            setIsSuccess(true)
            if (onClaimSuccess) onClaimSuccess()
        } catch (err: any) {
            setErrorMessage(err.message || 'An error occurred while submitting your claim.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-[24px] border border-[#E4E9F0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-[#E4E9F0] flex items-center justify-between bg-[#F8FAFC]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#c3f832] flex items-center justify-center text-[#292928] shadow-sm">
                            <Building2 size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#292928]">Claim This Business</h3>
                            <p className="text-xs text-[#6B7280]">Official owner verification request</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl border border-[#E4E9F0] flex items-center justify-center text-[#6B7280] hover:text-[#292928] hover:bg-white transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {isSuccess ? (
                        <div className="py-8 text-center flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-[#c3f832]/30 text-[#292928] flex items-center justify-center mb-4 border border-[#c3f832]">
                                <ShieldCheck size={36} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-xl font-black text-[#292928] mb-2">Claim Submitted for Approval</h4>
                            <p className="text-sm text-[#4B5563] max-w-sm mb-6 leading-relaxed">
                                Our administration team is reviewing your ownership credentials for <strong>{locationName}</strong>. 
                                Once approved, you will have exclusive access to manage its official accessibility dashboard, floor levels, and live updates.
                            </p>
                            <button
                                onClick={onClose}
                                className="bg-[#292928] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="p-3.5 bg-[#f8f8f8] rounded-xl border border-[#E4E9F0] text-xs text-[#6B7280]">
                                <span className="font-bold text-[#292928]">Claiming: </span> {locationName}
                                {locationAddress && <span className="block text-[11px] mt-0.5 text-[#9CA3AF]">{locationAddress}</span>}
                            </div>

                            {errorMessage && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1.5">
                                    Official Business Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    className="w-full bg-[#ffffff] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832]"
                                    placeholder="e.g., Westfield City Mall"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <User size={13} /> Your Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={claimantName}
                                        onChange={(e) => setClaimantName(e.target.value)}
                                        className="w-full bg-[#ffffff] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832]"
                                        placeholder="Alex Miller"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Briefcase size={13} /> Role / Title *
                                    </label>
                                    <select
                                        value={claimantRole}
                                        onChange={(e) => setClaimantRole(e.target.value)}
                                        className="w-full bg-[#ffffff] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832]"
                                    >
                                        <option value="Owner / Founder">Owner / Founder</option>
                                        <option value="Store / Facility Manager">Store / Facility Manager</option>
                                        <option value="Accessibility Coordinator">Accessibility Coordinator</option>
                                        <option value="Authorized Representative">Authorized Representative</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Mail size={13} /> Official Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        className="w-full bg-[#ffffff] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832]"
                                        placeholder="alex@westfield.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Phone size={13} /> Contact Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        className="w-full bg-[#ffffff] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832]"
                                        placeholder="+1 (555) 019-2834"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <FileText size={13} /> Verification Link / Document URL
                                </label>
                                <input
                                    type="text"
                                    value={verificationDocUrl}
                                    onChange={(e) => setVerificationDocUrl(e.target.value)}
                                    className="w-full bg-[#ffffff] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832]"
                                    placeholder="Business registration link, Google Maps listing, or official website"
                                />
                                <span className="text-[11px] text-[#9CA3AF] mt-1 block">
                                    Helps our review team expedite your approval.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1.5">
                                    Notes for Administrators
                                </label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-[#ffffff] border border-[#E4E9F0] rounded-xl p-3 text-sm text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] resize-none"
                                    placeholder="Any additional details regarding your business verification..."
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E4E9F0]">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 rounded-xl border border-[#E4E9F0] text-xs font-bold text-[#6B7280] hover:text-[#292928] hover:bg-[#F8FAFC] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#292928] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Claim Request'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
