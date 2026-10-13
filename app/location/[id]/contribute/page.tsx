'use client'

import { useState, useRef } from 'react'
import { submitContribution } from './actions'
import { ArrowLeft, UploadCloud, X, Image as ImageIcon, Loader2, Brain, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// All accessibility feature classes — only 'stairs' model is trained currently
const ACCESSIBILITY_CLASSES = [
    { id: 'stairs',           label: 'Stairs / Steps',        icon: '🪜', modelReady: true  },
    { id: 'wheelchair',       label: 'Wheelchair',            icon: '♿', modelReady: false },
    { id: 'wheelchair_ramp',  label: 'Wheelchair Ramp',       icon: '📐', modelReady: false },
    { id: 'elevator',         label: 'Elevator / Lift',       icon: '🔼', modelReady: false },
    { id: 'accessible_parking','label': 'Accessible Parking', icon: '🅿️', modelReady: false },
    { id: 'accessible_bathroom','label': 'Accessible Bathroom',icon: '🚻', modelReady: false },
    { id: 'grab_bar',         label: 'Grab Bar / Handrail',   icon: '🔧', modelReady: false },
    { id: 'tactile_paving',   label: 'Tactile Paving',        icon: '🔲', modelReady: false },
]

interface PreviewFile {
    file: File
    preview: string
    declaredClasses: string[]
    uploadedUrl?: string
    mlResult?: {
        found: boolean
        bboxes_percent: any[]
        summary: any
        processing_time_ms?: number
    } | null
    mlError?: string
    uploading?: boolean
    analyzing?: boolean
}

export default function ContributePage({ params }: { params: { id: string } }) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<PreviewFile[]>([])
    const [uploadProgress, setUploadProgress] = useState<string>('')
    const [mlResults, setMlResults] = useState<Array<{
        photo_id: number
        ml_found: boolean
        auto_pushed: boolean
        ml_available: boolean
        message: string
        declared_classes: string[]
    }>>([])
    // Step: 'select' | 'classify' | 'done'
    const [step, setStep] = useState<'select' | 'classify' | 'done'>('select')
    const [classifyingIdx, setClassifyingIdx] = useState<number>(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const locationId = parseInt(params.id, 10)
    const MAX_FILES = 5
    const MAX_FILE_SIZE = 5 * 1024 * 1024

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || [])
        const validFiles: PreviewFile[] = []
        for (const file of files) {
            if (selectedFiles.length + validFiles.length >= MAX_FILES) { setError(`Max ${MAX_FILES} photos.`); break }
            if (file.size > MAX_FILE_SIZE) { setError(`"${file.name}" exceeds 5MB.`); continue }
            if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) { setError(`"${file.name}" unsupported.`); continue }
            validFiles.push({ file, preview: URL.createObjectURL(file), declaredClasses: [] })
        }
        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles])
            setStep('classify')
            setClassifyingIdx(0)
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    function removeFile(index: number) {
        setSelectedFiles(prev => {
            const updated = [...prev]
            URL.revokeObjectURL(updated[index].preview)
            updated.splice(index, 1)
            return updated
        })
        setError(null)
        if (selectedFiles.length <= 1) setStep('select')
    }

    function toggleClass(fileIdx: number, classId: string) {
        setSelectedFiles(prev => prev.map((f, i) => {
            if (i !== fileIdx) return f
            const has = f.declaredClasses.includes(classId)
            return { ...f, declaredClasses: has ? f.declaredClasses.filter(c => c !== classId) : [...f.declaredClasses, classId] }
        }))
    }

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        setError(null)

        try {
            const uploadedUrls: string[] = []
            const results: typeof mlResults = []

            if (selectedFiles.length > 0) {
                for (let i = 0; i < selectedFiles.length; i++) {
                    // Step 1: upload
                    setUploadProgress(`Uploading photo ${i + 1}/${selectedFiles.length}...`)
                    setSelectedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, uploading: true } : f))

                    const photoForm = new FormData()
                    photoForm.append('file', selectedFiles[i].file)
                    photoForm.append('location_id', String(locationId))
                    photoForm.append('declared_classes', JSON.stringify(selectedFiles[i].declaredClasses))

                    // Step 2: ML analysis happens server-side (synchronous)
                    setUploadProgress(`Analyzing photo ${i + 1}/${selectedFiles.length} with AI...`)

                    const res = await fetch('/api/photos/upload', { method: 'POST', body: photoForm })
                    if (!res.ok) {
                        const d = await res.json()
                        throw new Error(d.message || `Failed to upload photo ${i + 1}`)
                    }
                    const d = await res.json()
                    uploadedUrls.push(d.url)

                    results.push({
                        photo_id: d.photo_id,
                        ml_found: d.ml_found ?? false,
                        auto_pushed: d.auto_pushed ?? false,
                        ml_available: d.ml_available ?? false,
                        message: d.message || '',
                        declared_classes: selectedFiles[i].declaredClasses,
                    })

                    setSelectedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, uploading: false, uploadedUrl: d.url } : f))
                }
                setMlResults(results)
            }

            setUploadProgress('Submitting...')
            const comment = formData.get('comment') as string
            if (!comment.trim() && uploadedUrls.length === 0) throw new Error('Please add a comment or photo.')

            formData.append('media_urls', JSON.stringify(uploadedUrls))
            const result = await submitContribution(locationId, formData)

            if (result?.error) { setError(result.error); setIsSubmitting(false); setUploadProgress('') }
            else { setSuccess(true); setIsSubmitting(false); setUploadProgress('') }
        } catch (err: any) {
            setError(err.message || 'Something went wrong.')
            setIsSubmitting(false)
            setUploadProgress('')
        }
    }

    if (success) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] p-4 pt-[64px]">
                <div className="w-full max-w-md rounded-[14px] bg-white p-8 text-center shadow-sm border border-[#E4E9F0]">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F4EA]">
                        <CheckCircle2 size={32} className="text-[#0F9D58]" />
                    </div>
                    <h2 className="mb-2 text-[20px] font-bold text-[#1A1F2E] font-serif">Contribution Submitted!</h2>
                    <p className="mb-4 text-[14px] text-[#6B7280]">
                        Thank you for helping improve accessibility data.
                    </p>

                    {/* Per-photo ML result cards */}
                    {mlResults.length > 0 && (
                        <div className="mb-5 space-y-2 text-left">
                            {mlResults.map((r, i) => (
                                <div key={i} className={`rounded-xl border px-4 py-3 text-[13px] font-medium flex items-start gap-3
                                    ${!r.ml_available ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]'
                                    : r.ml_found    ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]'
                                    :                 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]'}`}>
                                    <span className="text-xl mt-0.5 shrink-0">
                                        {!r.ml_available ? '⚠️' : r.ml_found ? '✅' : '❌'}
                                    </span>
                                    <div>
                                        <p className="font-bold mb-0.5">Photo {i + 1}</p>
                                        <p className="leading-snug">{r.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <a href={`/location/${locationId}`} className="inline-block w-full rounded-md bg-[#1A73E8] py-2.5 text-[14px] font-bold text-white transition hover:bg-blue-700">
                        Return to Location
                    </a>
                </div>
            </main>
        )
    }

    const currentFile = step === 'classify' ? selectedFiles[classifyingIdx] : null

    return (
        <main className="flex min-h-screen flex-col bg-[#F7F9FC] pt-[64px] pb-12">
            <div className="mx-auto w-full max-w-2xl px-4 mt-8">
                <Link href={`/location/${locationId}`} className="mb-6 inline-flex items-center text-[14px] font-bold text-[#6B7280] hover:text-[#1A73E8]">
                    <ArrowLeft size={16} className="mr-2" /> Cancel and return
                </Link>

                <div className="rounded-[14px] bg-white p-6 shadow-sm border border-[#E4E9F0] md:p-8">
                    <h1 className="mb-2 text-[24px] font-bold text-[#1A1F2E] font-serif">Add your experience</h1>
                    <p className="mb-6 text-[14px] text-[#6B7280]">Share photos and observations to help others find accessible places.</p>

                    {error && (
                        <div className="mb-6 rounded-md bg-[#FFEBEE] p-3 text-sm text-[#E53935] flex items-center gap-2" role="alert">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form action={handleSubmit} className="space-y-8">

                        {/* ─── Photo Upload Section ─── */}
                        <div>
                            <h3 className="mb-1 text-[15px] font-bold text-[#1A1F2E]">Add photos</h3>
                            <p className="mb-3 text-[13px] text-[#6B7280]">
                                Upload photos — our AI model will automatically analyze them for accessibility features.
                                Up to {MAX_FILES} photos, max 5MB each.
                            </p>

                            {/* AI badge */}
                            <div className="mb-4 flex items-center gap-2 bg-[#E8F0FE] border border-[#c5d8fc] rounded-lg px-3 py-2 text-[12px] text-[#1A73E8] font-semibold">
                                <Brain size={14} /> AI-powered accessibility detection — classify what's in your photos below
                            </div>

                            {/* Uploaded files list with per-image classification */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-4 mb-4">
                                    {selectedFiles.map((pf, i) => (
                                        <div key={i} className={`rounded-xl border-2 p-4 transition-all ${classifyingIdx === i && step === 'classify' ? 'border-[#1A73E8] bg-[#E8F0FE]/40' : 'border-[#E4E9F0] bg-white'}`}>
                                            <div className="flex gap-4">
                                                {/* Thumbnail */}
                                                <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-[#E4E9F0]">
                                                    <img src={pf.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                                    {pf.uploading && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <Loader2 size={20} className="animate-spin text-white" />
                                                        </div>
                                                    )}
                                                    <button type="button" onClick={() => removeFile(i)}
                                                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                                                        <X size={12} />
                                                    </button>
                                                </div>

                                                {/* Classification checkboxes */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-bold text-[#1A1F2E] mb-2 flex items-center gap-1.5">
                                                        <Brain size={14} className="text-[#1A73E8]" />
                                                        What accessibility features are in this photo?
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        {ACCESSIBILITY_CLASSES.map(cls => (
                                                            <label key={cls.id}
                                                                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 cursor-pointer text-[12px] font-medium transition-all
                                                                    ${pf.declaredClasses.includes(cls.id)
                                                                        ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]'
                                                                        : 'border-[#E4E9F0] text-[#6B7280] hover:border-[#1A73E8]'}
                                                                    ${!cls.modelReady ? 'opacity-60' : ''}`}>
                                                                <input type="checkbox" className="sr-only"
                                                                    checked={pf.declaredClasses.includes(cls.id)}
                                                                    onChange={() => toggleClass(i, cls.id)} />
                                                                <span>{cls.icon}</span>
                                                                <span className="truncate">{cls.label}</span>
                                                                {cls.modelReady && (
                                                                    <span className="ml-auto text-[10px] bg-[#E6F4EA] text-[#0F9D58] px-1 rounded font-bold shrink-0">AI✓</span>
                                                                )}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    {pf.declaredClasses.length === 0 && (
                                                        <p className="text-[11px] text-[#F4A100] mt-1.5 flex items-center gap-1">
                                                            <AlertCircle size={11} /> Select at least one feature for AI analysis
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload drop zone */}
                            {selectedFiles.length < MAX_FILES && (
                                <div className="relative flex h-[110px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E4E9F0] bg-[#F7F9FC] hover:bg-[#E8F0FE] hover:border-[#1A73E8] transition overflow-hidden">
                                    <div className="pointer-events-none flex flex-col items-center">
                                        <UploadCloud className="mb-1 text-[#9CA3AF]" size={26} />
                                        <p className="text-sm text-[#6B7280]"><span className="font-bold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-[#9CA3AF]">PNG, JPG, WebP (MAX. 5MB each)</p>
                                    </div>
                                    <input ref={fileInputRef} id="photo-upload" type="file"
                                        className="absolute inset-0 z-50 w-full h-full cursor-pointer opacity-0"
                                        accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFileSelect} />
                                </div>
                            )}

                            {selectedFiles.length > 0 && (
                                <p className="mt-2 text-[12px] text-[#6B7280] flex items-center gap-1">
                                    <ImageIcon size={12} /> {selectedFiles.length}/{MAX_FILES} photo{selectedFiles.length !== 1 ? 's' : ''} selected
                                </p>
                            )}
                        </div>

                        {/* ─── Accessibility Feature Checklist ─── */}
                        <div>
                            <h3 className="mb-4 text-[15px] font-bold text-[#1A1F2E]">Which features are available and working?</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { id: 'wheelchairAccessible', label: 'Wheelchair Accessible', icon: '♿' },
                                    { id: 'accessibleRestrooms',  label: 'Accessible Restrooms',  icon: '🚻' },
                                    { id: 'accessibleParking',    label: 'Accessible Parking',    icon: '🅿️' },
                                    { id: 'rampAccess',           label: 'Ramp Access',           icon: '📐' },
                                    { id: 'elevatorAccess',       label: 'Elevator / Lift',       icon: '🔼' },
                                    { id: 'visualAudioAssistance',label: 'Visual/Audio Assist',   icon: '🔊' },
                                    { id: 'wideDoorways',         label: 'Wide Doorways',         icon: '🚪' },
                                    { id: 'levelSurfaces',        label: 'Level Surfaces',        icon: '⬜' },
                                ].map(feature => (
                                    <label key={feature.id} className="flex cursor-pointer items-center space-x-3 rounded-lg border border-[#E4E9F0] bg-white p-3 transition hover:border-[#1A73E8] has-[:checked]:border-[#1A73E8] has-[:checked]:bg-[#E8F0FE]">
                                        <input type="checkbox" name={feature.id} className="h-4 w-4 rounded border-[#E4E9F0] text-[#1A73E8] focus:ring-[#1A73E8]" />
                                        <span className="flex items-center text-[13px] font-medium text-[#1A1F2E]">
                                            <span className="mr-2">{feature.icon}</span>{feature.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* ─── Comment Area ─── */}
                        <div>
                            <h3 className="mb-2 text-[15px] font-bold text-[#1A1F2E]">Additional notes</h3>
                            <textarea name="comment" rows={4}
                                className="w-full rounded-md border-[1.5px] border-[#E4E9F0] px-3 py-2 text-[14px] outline-none transition-colors focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                                placeholder="e.g. The lift was temporarily out of order..." />
                        </div>

                        {uploadProgress && (
                            <div className="flex items-center gap-2 text-[13px] text-[#1A73E8] font-medium">
                                <Loader2 size={16} className="animate-spin" /> {uploadProgress}
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting}
                            className="w-full rounded-md bg-[#1A73E8] py-3 text-[15px] font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2 disabled:opacity-50">
                            {isSubmitting ? 'Submitting...' : 'Submit Contribution'}
                        </button>

                    </form>
                </div>
            </div>
        </main>
    )
}
