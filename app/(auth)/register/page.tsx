'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Box, Lock, Mail, User, FileText } from 'lucide-react'

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        name: '',
        address: '',
        phone: '',
        description: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Failed to register')
            }

            // Route based on role (admins can register test accounts using 'admin' in their username)
            if (data.user.role === 'admin') {
                router.push('/admin/reviews')
            }
            // Success! Redirect to map with a hard reload to clear cache
            window.location.href = '/map'

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#E8ECF0] flex flex-col items-center justify-center p-4">

            {/* Logo Header */}
            <Link href="/map" className="mb-8 flex items-center justify-center gap-3 group">
                <div className="bg-white border-[1.5px] border-[#292928] h-12 w-12 rounded-[16px] flex items-center justify-center text-[#292928] group-hover:bg-[#f8f8f8] transition-colors shadow-sm">
                    <Box size={24} strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-[#292928]">
                    Access<span className="text-[#c3f832]">Map</span>
                </h1>
            </Link>

            {/* Register Card */}
            <div className="bg-white w-full max-w-[420px] rounded-[24px] shadow-sm border border-[#E4E9F0] p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-[#292928] tracking-tight mb-2">Create an account</h2>
                    <p className="text-sm font-medium text-[#6B7280]">Join the community mapping accessibility</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="block text-sm font-bold text-[#292928] mb-1.5 flex items-center gap-2"><User size={14} className="text-[#9CA3AF]" /> Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full h-[52px] bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] px-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#292928] mb-1.5 flex items-center gap-2"><User size={14} className="text-[#9CA3AF]" /> Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            className="w-full h-[52px] bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] px-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all"
                            placeholder="johndoe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#292928] mb-1.5 flex items-center gap-2"><Mail size={14} className="text-[#9CA3AF]" /> Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full h-[52px] bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] px-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all"
                            placeholder="hello@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#292928] mb-1.5 flex items-center gap-2"><Lock size={14} className="text-[#9CA3AF]" /> Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            className="w-full h-[52px] bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] px-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#292928] mb-1.5 flex items-center gap-2"><Lock size={14} className="text-[#9CA3AF]" /> Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            className="w-full h-[52px] bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] px-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all"
                            placeholder="123 Access Street, City"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#292928] mb-1.5 flex items-center gap-2"><User size={14} className="text-[#9CA3AF]" /> Contact Number</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full h-[52px] bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] px-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all"
                            placeholder="+1 234 567 8900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#292928] mb-1.5 flex items-center gap-2"><FileText size={14} className="text-[#9CA3AF]" /> Description / Bio</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full h-[100px] py-4 bg-[#f8f8f8] border border-[#E4E9F0] rounded-[14px] px-4 font-medium text-[#292928] focus:outline-none focus:ring-2 focus:ring-[#c3f832] focus:border-transparent transition-all resize-none"
                            placeholder="Tell us a bit about yourself..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full h-[56px] rounded-[16px] font-black text-[16px] flex items-center justify-center transition-all mt-4 ${isLoading ? 'bg-[#E4E9F0] text-[#9CA3AF] cursor-not-allowed' : 'bg-[#c3f832] text-[#292928] hover:bg-[#b0df2c] hover:scale-[1.02] shadow-[0_8px_30px_rgb(195,248,50,0.2)]'}`}
                    >
                        {isLoading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm font-medium text-[#6B7280]">
                        Already have an account? <Link href="/login" className="text-[#292928] font-bold hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
