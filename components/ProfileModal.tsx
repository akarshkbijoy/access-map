'use client'

import { useState } from 'react'
import { X, Edit2, Check, User as UserIcon, Mail, Phone as PhoneIcon, MapPin, FileText, Loader2 } from 'lucide-react'

// Basic user type structure based on DB schema
interface UserData {
    id: number;
    username: string;
    email: string | null;
    name: string | null;
    address: string | null;
    phone: string | null;
    description: string | null;
}

interface ProfileModalProps {
    user: UserData;
    onClose: () => void;
}

export default function ProfileModal({ user, onClose }: ProfileModalProps) {
    const [userData, setUserData] = useState<UserData>(user)
    const [editingField, setEditingField] = useState<keyof UserData | null>(null)
    const [editValue, setEditValue] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    const startEdit = (field: keyof UserData, value: string | null) => {
        setEditingField(field)
        setEditValue(value || '')
        setError('')
    }

    const saveEdit = async () => {
        if (!editingField) return
        
        setIsSaving(true)
        setError('')
        
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [editingField]: editValue })
            })
            
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Failed to update profile')
            }
            
            // Update local state and finish edit mode
            setUserData(prev => ({ ...prev, [editingField]: editValue }))
            setEditingField(null)
            
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1A1F2E]/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[24px] w-full max-w-[520px] max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* Header Profile Info View */}
                <div className="p-8 border-b border-[#E4E9F0] bg-[#fdfdfd] flex flex-col items-center justify-center text-center relative">
                    <button onClick={onClose} className="absolute top-6 right-6 text-[#9CA3AF] hover:text-[#292928] transition-colors rounded-full hover:bg-[#f8f8f8] p-1">
                        <X size={24} />
                    </button>
                    
                    <div className="mb-4 h-24 w-24 bg-[#E4E9F0] rounded-full flex items-center justify-center text-[#9CA3AF]">
                        <UserIcon size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-[#292928]">{userData.name || userData.username}</h2>
                    <p className="text-[13px] font-bold text-[#6B7280]">@{userData.username}</p>
                </div>

                {/* Edit Form Content */}
                <div className="p-8 overflow-y-auto space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <FieldRow 
                        label="Full Name" 
                        value={userData.name} 
                        icon={<UserIcon size={16} />} 
                        fieldKey="name"
                        isEditing={editingField === 'name'}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        onStartEdit={() => startEdit('name', userData.name)}
                        onSave={saveEdit}
                        onCancel={() => setEditingField(null)}
                        isSaving={isSaving}
                    />

                    <FieldRow 
                        label="Username" 
                        value={userData.username} 
                        icon={<UserIcon size={16} />} 
                        fieldKey="username"
                        isEditing={editingField === 'username'}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        onStartEdit={() => startEdit('username', userData.username)}
                        onSave={saveEdit}
                        onCancel={() => setEditingField(null)}
                        isSaving={isSaving}
                    />

                    <FieldRow 
                        label="Email Address" 
                        value={userData.email} 
                        icon={<Mail size={16} />} 
                        fieldKey="email"
                        isEditing={editingField === 'email'}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        onStartEdit={() => startEdit('email', userData.email)}
                        onSave={saveEdit}
                        onCancel={() => setEditingField(null)}
                        isSaving={isSaving}
                    />

                    <FieldRow 
                        label="Contact Number" 
                        value={userData.phone} 
                        icon={<PhoneIcon size={16} />} 
                        fieldKey="phone"
                        isEditing={editingField === 'phone'}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        onStartEdit={() => startEdit('phone', userData.phone)}
                        onSave={saveEdit}
                        onCancel={() => setEditingField(null)}
                        isSaving={isSaving}
                    />

                    <FieldRow 
                        label="Address" 
                        value={userData.address} 
                        icon={<MapPin size={16} />} 
                        fieldKey="address"
                        isEditing={editingField === 'address'}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        onStartEdit={() => startEdit('address', userData.address)}
                        onSave={saveEdit}
                        onCancel={() => setEditingField(null)}
                        isSaving={isSaving}
                    />

                    <div className="group border border-[#E4E9F0] rounded-[16px] p-5 hover:border-[#292928] transition-colors relative">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-[#6B7280] flex items-center gap-2">
                                <FileText size={16} /> Bio / Description
                                {editingField !== 'description' && (
                                    <button onClick={() => startEdit('description', userData.description)} className="opacity-0 group-hover:opacity-100 p-1 text-[#9CA3AF] hover:text-[#292928] hover:bg-[#f8f8f8] rounded-md transition-all ml-1" aria-label="Edit field">
                                        <Edit2 size={14} />
                                    </button>
                                )}
                            </label>
                            
                            {editingField === 'description' && (
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingField(null)} className="text-sm font-bold text-[#9CA3AF] hover:text-[#292928] transition-colors">Cancel</button>
                                    <button onClick={saveEdit} disabled={isSaving} className="text-sm font-bold text-[#1A73E8] flex items-center gap-1 hover:text-blue-800 transition-colors">
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {editingField === 'description' ? (
                            <textarea 
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full text-[14px] font-medium text-[#292928] bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#c3f832] min-h-[100px] resize-none"
                                placeholder="- Add description -"
                                autoFocus
                            />
                        ) : (
                            <p className={`text-[14px] font-medium leading-relaxed ${userData.description ? 'text-[#292928]' : 'text-[#9CA3AF] italic'}`}>
                                {userData.description || 'No description provided yet.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function FieldRow({ label, value, icon, isEditing, editValue, setEditValue, onStartEdit, onSave, onCancel, isSaving }: any) {
    return (
        <div className="group flex flex-col p-4 border border-[#E4E9F0] rounded-[16px] hover:border-[#292928] transition-colors relative">
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#6B7280] flex items-center gap-2 uppercase tracking-wider">
                    {icon} {label}
                    {!isEditing && (
                        <button onClick={onStartEdit} className="opacity-0 group-hover:opacity-100 p-1 text-[#9CA3AF] hover:text-[#292928] hover:bg-[#f8f8f8] rounded-md transition-all ml-1" title="Edit">
                            <Edit2 size={12} strokeWidth={2.5} />
                        </button>
                    )}
                </label>
                {isEditing && (
                    <div className="flex gap-2 bg-[#f8f8f8] p-1 rounded-xl shrink-0">
                        <button onClick={onCancel} className="p-1 text-[#E53935] hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                            <X size={14} />
                        </button>
                        <button onClick={onSave} disabled={isSaving} className="p-1 text-[#0F9D58] hover:bg-green-50 rounded-lg transition-colors" title="Save">
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                        </button>
                    </div>
                )}
            </div>
            
            <div className="w-full">
                {isEditing ? (
                    <input 
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full text-[15px] font-bold text-[#292928] bg-[#f8f8f8] border border-[#E4E9F0] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#c3f832]"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && onSave()}
                    />
                ) : (
                    <div className={`text-[15px] font-bold truncate ${value ? 'text-[#292928]' : 'text-[#9CA3AF] italic'}`}>
                        {value || `- Add ${label.toLowerCase()} -`}
                    </div>
                )}
            </div>
        </div>
    )
}
