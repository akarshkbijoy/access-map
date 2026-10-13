'use client'

import { useState } from 'react'
import { User, LogOut, FileText } from 'lucide-react'
import Link from 'next/link'
import ProfileModal from './ProfileModal'

interface UserSummary {
    id: number;
    username: string;
    email: string | null;
    name: string | null;
    address: string | null;
    phone: string | null;
    description: string | null;
    role?: string;
}

interface ProfileMenuProps {
    user: UserSummary | null;
}

export default function ProfileMenu({ user }: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    if (!user) {
        return (
            <Link href="/login" className="flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-[#9CA3AF] hover:text-[#292928] hover:bg-[#f8f8f8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#c3f832]" title="Login / Register">
                <User size={22} strokeWidth={2.5} />
            </Link>
        )
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#c3f832] ${isOpen ? 'bg-[#f8f8f8] text-[#292928]' : 'text-[#9CA3AF] hover:text-[#292928] hover:bg-[#f8f8f8]'}`}
                title="Profile Menu"
            >
                <User size={22} strokeWidth={2} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-0 left-12 z-50 w-48 bg-white rounded-2xl shadow-xl border border-[#E4E9F0] py-2 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="px-4 py-2 border-b border-[#E4E9F0] mb-1">
                            <p className="text-[14px] font-bold text-[#292928] truncate">{user.name || user.username}</p>
                            <p className="text-[11px] font-medium text-[#9CA3AF] truncate">{user.email}</p>
                        </div>
                        
                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                setIsModalOpen(true);
                            }}
                            className="w-full flex items-center px-4 py-2.5 text-[13px] font-bold text-[#292928] hover:bg-[#f8f8f8] transition-colors text-left"
                        >
                            <FileText size={16} className="mr-3 text-[#9CA3AF]" />
                            View Profile
                        </button>
                        
                        {user.role === 'admin' && (
                            <Link 
                                href="/admin/reviews"
                                className="w-full flex items-center px-4 py-2.5 text-[13px] font-bold text-[#1A73E8] hover:bg-[#E8F0FE] transition-colors text-left"
                            >
                                <User size={16} className="mr-3" />
                                Admin Dashboard
                            </Link>
                        )}
                        
                        <Link 
                            href="/api/auth/logout"
                            className="w-full flex items-center px-4 py-2.5 text-[13px] font-bold text-[#E53935] hover:bg-red-50 transition-colors text-left border-t border-[#E4E9F0] mt-1"
                        >
                            <LogOut size={16} className="mr-3" />
                            Logout
                        </Link>
                    </div>
                </>
            )}

            {/* Profile Modal */}
            {isModalOpen && (
                <ProfileModal user={user} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    )
}
