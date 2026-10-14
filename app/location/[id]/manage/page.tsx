'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Building2,
    ShieldCheck,
    Check,
    Plus,
    Trash2,
    AlertTriangle,
    Eye,
    Save,
    Layers,
    HeartHandshake,
    Car,
    Phone,
    Clock,
    Lock
} from 'lucide-react'

export default function LocationManagePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = use(params)
    const router = useRouter()
    const locationId = parseInt(resolvedParams.id, 10)

    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [activeTab, setActiveTab] = useState<'modules' | 'alerts' | 'campus'>('modules')

    // Module states
    const [moduleOverview, setModuleOverview] = useState({
        enabled: true,
        welcomeMessage: '',
        directHelpPhone: '',
        accessibilityOfficer: '',
        operatingHours: '',
        serviceAnimalsAllowed: true,
        wheelchairRentalAvailable: false
    })

    const [moduleCampus, setModuleCampus] = useState({
        enabled: true,
        hasMultipleFloors: true
    })

    const [moduleSensory, setModuleSensory] = useState({
        enabled: true,
        lightingType: '',
        soundLevel: '',
        quietSpaces: '',
        crowdPeakHours: ''
    })

    const [moduleTransit, setModuleTransit] = useState({
        enabled: true,
        standardAccessibleSpaces: 0,
        vanAccessibleSpaces: 0,
        dropOffZoneDistanceMeters: 10,
        evChargingAccessible: false,
        transitNotes: ''
    })

    // Alerts state
    const [alerts, setAlerts] = useState<any[]>([])
    const [newAlertTitle, setNewAlertTitle] = useState('')
    const [newAlertMessage, setNewAlertMessage] = useState('')
    const [newAlertSeverity, setNewAlertSeverity] = useState('warning')

    // Campus state
    const [buildings, setBuildings] = useState<any[]>([])
    const [newFloorName, setNewFloorName] = useState('')
    const [newFloorNumber, setNewFloorNumber] = useState(1)
    const [newFloorDesc, setNewFloorDesc] = useState('')

    // POI form
    const [selectedFloorForPoi, setSelectedFloorForPoi] = useState<number | null>(null)
    const [newPoiName, setNewPoiName] = useState('')
    const [newPoiCategory, setNewPoiCategory] = useState('restroom')
    const [newPoiDesc, setNewPoiDesc] = useState('')

    useEffect(() => {
        if (isNaN(locationId)) {
            setIsLoading(false)
            return
        }

        const fetchDetails = async () => {
            try {
                const res = await fetch(`/api/dashboard/${locationId}`)
                if (!res.ok) throw new Error('Failed to load location data')
                const d = await res.json()
                setData(d)

                // Populate modules
                if (d.modules) {
                    const overviewMod = d.modules.find((m: any) => m.module_type === 'overview')
                    if (overviewMod) {
                        setModuleOverview({
                            enabled: overviewMod.is_enabled,
                            welcomeMessage: overviewMod.content?.welcomeMessage || '',
                            directHelpPhone: overviewMod.content?.directHelpPhone || d.contact || '',
                            accessibilityOfficer: overviewMod.content?.accessibilityOfficer || '',
                            operatingHours: overviewMod.content?.operatingHours || '',
                            serviceAnimalsAllowed: overviewMod.content?.serviceAnimalsAllowed ?? true,
                            wheelchairRentalAvailable: overviewMod.content?.wheelchairRentalAvailable ?? false
                        })
                    }

                    const campusMod = d.modules.find((m: any) => m.module_type === 'campus_levels')
                    if (campusMod) {
                        setModuleCampus({
                            enabled: campusMod.is_enabled,
                            hasMultipleFloors: campusMod.content?.hasMultipleFloors ?? true
                        })
                    }

                    const sensoryMod = d.modules.find((m: any) => m.module_type === 'sensory_guide')
                    if (sensoryMod) {
                        setModuleSensory({
                            enabled: sensoryMod.is_enabled,
                            lightingType: sensoryMod.content?.lightingType || '',
                            soundLevel: sensoryMod.content?.soundLevel || '',
                            quietSpaces: sensoryMod.content?.quietSpaces || '',
                            crowdPeakHours: sensoryMod.content?.crowdPeakHours || ''
                        })
                    }

                    const transitMod = d.modules.find((m: any) => m.module_type === 'transit_parking')
                    if (transitMod) {
                        setModuleTransit({
                            enabled: transitMod.is_enabled,
                            standardAccessibleSpaces: transitMod.content?.standardAccessibleSpaces ?? 4,
                            vanAccessibleSpaces: transitMod.content?.vanAccessibleSpaces ?? 2,
                            dropOffZoneDistanceMeters: transitMod.content?.dropOffZoneDistanceMeters ?? 15,
                            evChargingAccessible: transitMod.content?.evChargingAccessible ?? false,
                            transitNotes: transitMod.content?.transitNotes || ''
                        })
                    }
                }

                if (d.alerts) setAlerts(d.alerts)
                if (d.buildings) setBuildings(d.buildings)
                if (d.buildings && d.buildings[0]?.floors && d.buildings[0].floors[0]) {
                    setSelectedFloorForPoi(d.buildings[0].floors[0].floor_id)
                }
            } catch (err: any) {
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDetails()
    }, [locationId])

    const saveModules = async () => {
        setIsSaving(true)
        setSaveMessage(null)

        const payload = [
            {
                module_type: 'overview',
                is_enabled: moduleOverview.enabled,
                display_order: 1,
                title: 'Facility Overview & Direct Assistance',
                content: {
                    welcomeMessage: moduleOverview.welcomeMessage,
                    directHelpPhone: moduleOverview.directHelpPhone,
                    accessibilityOfficer: moduleOverview.accessibilityOfficer,
                    operatingHours: moduleOverview.operatingHours,
                    serviceAnimalsAllowed: moduleOverview.serviceAnimalsAllowed,
                    wheelchairRentalAvailable: moduleOverview.wheelchairRentalAvailable
                }
            },
            {
                module_type: 'campus_levels',
                is_enabled: moduleCampus.enabled,
                display_order: 2,
                title: 'Campus & Multi-Level Layout',
                content: {
                    hasMultipleFloors: moduleCampus.hasMultipleFloors
                }
            },
            {
                module_type: 'sensory_guide',
                is_enabled: moduleSensory.enabled,
                display_order: 3,
                title: 'Sensory & Neurodivergent Guide',
                content: {
                    lightingType: moduleSensory.lightingType,
                    soundLevel: moduleSensory.soundLevel,
                    quietSpaces: moduleSensory.quietSpaces,
                    crowdPeakHours: moduleSensory.crowdPeakHours
                }
            },
            {
                module_type: 'transit_parking',
                is_enabled: moduleTransit.enabled,
                display_order: 4,
                title: 'Accessible Parking & Arrival',
                content: {
                    standardAccessibleSpaces: Number(moduleTransit.standardAccessibleSpaces),
                    vanAccessibleSpaces: Number(moduleTransit.vanAccessibleSpaces),
                    dropOffZoneDistanceMeters: Number(moduleTransit.dropOffZoneDistanceMeters),
                    evChargingAccessible: moduleTransit.evChargingAccessible,
                    transitNotes: moduleTransit.transitNotes
                }
            }
        ]

        try {
            const res = await fetch(`/api/dashboard/${locationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_modules',
                    modules: payload
                })
            })

            if (!res.ok) throw new Error('Failed to save dashboard settings')
            setSaveMessage({ type: 'success', text: 'Dashboard modules updated successfully!' })
        } catch (err: any) {
            setSaveMessage({ type: 'error', text: err.message || 'Error saving changes' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleCreateAlert = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newAlertTitle.trim() || !newAlertMessage.trim()) return

        try {
            const res = await fetch(`/api/dashboard/${locationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_alert',
                    title: newAlertTitle,
                    message: newAlertMessage,
                    severity: newAlertSeverity,
                    is_active: true
                })
            })

            if (!res.ok) throw new Error('Failed to post alert')

            // Reload data
            const refreshed = await fetch(`/api/dashboard/${locationId}`).then(r => r.json())
            if (refreshed.alerts) setAlerts(refreshed.alerts)

            setNewAlertTitle('')
            setNewAlertMessage('')
            setSaveMessage({ type: 'success', text: 'Live alert published!' })
        } catch (err: any) {
            setSaveMessage({ type: 'error', text: err.message })
        }
    }

    const handleDeleteAlert = async (alertId: number) => {
        try {
            const res = await fetch(`/api/dashboard/${locationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_alert',
                    alert_id: alertId
                })
            })
            if (!res.ok) throw new Error('Failed to delete alert')
            setAlerts(prev => prev.filter(a => a.alert_id !== alertId))
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleAddFloor = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newFloorName.trim()) return

        const targetBuilding = buildings[0] || {
            name: 'Main Building',
            description: 'Primary location structure',
            total_floors: 1,
            floors: []
        }

        const updatedBuildings = [
            {
                ...targetBuilding,
                floors: [
                    ...(targetBuilding.floors || []),
                    {
                        floor_name: newFloorName,
                        floor_number: Number(newFloorNumber),
                        description: newFloorDesc,
                        pois: []
                    }
                ]
            }
        ]

        try {
            const res = await fetch(`/api/dashboard/${locationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_campus',
                    buildings: updatedBuildings
                })
            })
            if (!res.ok) throw new Error('Failed to save floor')

            const refreshed = await fetch(`/api/dashboard/${locationId}`).then(r => r.json())
            if (refreshed.buildings) setBuildings(refreshed.buildings)

            setNewFloorName('')
            setNewFloorDesc('')
            setSaveMessage({ type: 'success', text: 'Floor added to campus!' })
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleAddPoi = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPoiName.trim() || !selectedFloorForPoi) return

        const updatedBuildings = buildings.map(b => ({
            ...b,
            floors: (b.floors || []).map((f: any) => {
                if (f.floor_id === selectedFloorForPoi) {
                    return {
                        ...f,
                        pois: [
                            ...(f.pois || []),
                            {
                                name: newPoiName,
                                category: newPoiCategory,
                                description: newPoiDesc,
                                x_coord: 50,
                                y_coord: 50
                            }
                        ]
                    }
                }
                return f
            })
        }))

        try {
            const res = await fetch(`/api/dashboard/${locationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_campus',
                    buildings: updatedBuildings
                })
            })
            if (!res.ok) throw new Error('Failed to save POI')

            const refreshed = await fetch(`/api/dashboard/${locationId}`).then(r => r.json())
            if (refreshed.buildings) setBuildings(refreshed.buildings)

            setNewPoiName('')
            setNewPoiDesc('')
            setSaveMessage({ type: 'success', text: 'Accessibility amenity added!' })
        } catch (err: any) {
            alert(err.message)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#E8ECF0] flex items-center justify-center p-4">
                <div className="text-sm font-bold text-[#292928]">Loading dashboard studio...</div>
            </div>
        )
    }

    if (!data || !data.can_manage) {
        return (
            <div className="min-h-screen bg-[#E8ECF0] flex items-center justify-center p-4">
                <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-8 max-w-md w-full text-center shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                        <Lock size={24} />
                    </div>
                    <h2 className="text-lg font-black text-[#292928] mb-1">Owner Access Required</h2>
                    <p className="text-xs text-[#6B7280] mb-6">
                        Only verified business owners or administrators can configure this location's accessibility dashboard.
                    </p>
                    <div className="flex gap-2 justify-center">
                        <Link
                            href={`/location/${locationId}/dashboard`}
                            className="bg-[#292928] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors"
                        >
                            View Public Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#E8ECF0]">
            {/* Top Bar */}
            <nav className="h-[72px] bg-white border-b border-[#E4E9F0] px-6 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/location/${locationId}/dashboard`}
                        className="h-10 w-10 rounded-xl border border-[#E4E9F0] flex items-center justify-center text-[#292928] hover:bg-[#F8FAFC] transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-base font-black text-[#292928] leading-tight">
                            {data.name} — Dashboard Studio
                        </h1>
                        <span className="text-[11px] font-bold text-[#0F9D58] flex items-center gap-1">
                            <ShieldCheck size={12} /> Verified Owner Console
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/location/${locationId}/dashboard`}
                        target="_blank"
                        className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E4E9F0] text-xs font-bold text-[#292928] hover:bg-[#F8FAFC] transition-colors"
                    >
                        <Eye size={14} /> Preview Live
                    </Link>
                    <button
                        onClick={saveModules}
                        disabled={isSaving}
                        className="bg-[#c3f832] text-[#292928] px-4 py-2 rounded-xl text-xs font-black hover:bg-[#b5eb29] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        <Save size={14} strokeWidth={2.5} /> {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto p-6 md:p-8">
                {saveMessage && (
                    <div className={`p-4 rounded-2xl mb-6 text-xs font-bold flex items-center justify-between border ${
                        saveMessage.type === 'success'
                            ? 'bg-[#c3f832]/20 border-[#c3f832] text-[#292928]'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <span>{saveMessage.text}</span>
                        <button onClick={() => setSaveMessage(null)}>✕</button>
                    </div>
                )}

                {/* Tab Switcher */}
                <div className="flex gap-1.5 p-1 bg-white border border-[#E4E9F0] rounded-2xl mb-6 shadow-xs overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('modules')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === 'modules' ? 'bg-[#292928] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#292928]'
                        }`}
                    >
                        <Building2 size={15} /> Choose Modules & Features
                    </button>
                    <button
                        onClick={() => setActiveTab('campus')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === 'campus' ? 'bg-[#292928] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#292928]'
                        }`}
                    >
                        <Layers size={15} /> Campus & Levels ({buildings[0]?.floors?.length || 0} Floors)
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === 'alerts' ? 'bg-[#292928] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#292928]'
                        }`}
                    >
                        <AlertTriangle size={15} /> Live Operational Alerts ({alerts.length})
                    </button>
                </div>

                {/* TAB 1: MODULAR FEATURE BUILDER */}
                {activeTab === 'modules' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-white rounded-2xl border border-[#E4E9F0] text-xs text-[#6B7280] flex items-center gap-3">
                            <span className="p-2 rounded-xl bg-[#c3f832] text-[#292928] shrink-0 font-black">TIP</span>
                            <p>
                                Toggle ON only the accessibility modules that apply to your business. 
                                Unchecked modules or empty fields will never be shown on your public profile.
                            </p>
                        </div>

                        {/* MODULE 1: Overview & Direct Assistance */}
                        <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E4E9F0]">
                                <div>
                                    <h3 className="text-base font-black text-[#292928]">Facility Overview & Assistance Hotline</h3>
                                    <p className="text-xs text-[#6B7280]">Direct contact for visitors needing personalized guidance</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={moduleOverview.enabled}
                                        onChange={(e) => setModuleOverview(prev => ({ ...prev, enabled: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#292928]"></div>
                                </label>
                            </div>

                            {moduleOverview.enabled && (
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                            Welcome & Accessibility Message
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={moduleOverview.welcomeMessage}
                                            onChange={(e) => setModuleOverview(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                                            className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl p-3 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                            placeholder="We strive to provide a welcoming and accessible environment for everyone..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                                Direct Help Phone
                                            </label>
                                            <input
                                                type="text"
                                                value={moduleOverview.directHelpPhone}
                                                onChange={(e) => setModuleOverview(prev => ({ ...prev, directHelpPhone: e.target.value }))}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                                placeholder="+1 (555) 019-2834"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                                Accessibility Officer / Team
                                            </label>
                                            <input
                                                type="text"
                                                value={moduleOverview.accessibilityOfficer}
                                                onChange={(e) => setModuleOverview(prev => ({ ...prev, accessibilityOfficer: e.target.value }))}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                                placeholder="Guest Experience Desk"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                            Operating Hours
                                        </label>
                                        <input
                                            type="text"
                                            value={moduleOverview.operatingHours}
                                            onChange={(e) => setModuleOverview(prev => ({ ...prev, operatingHours: e.target.value }))}
                                            className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                            placeholder="Mon - Sun: 9:00 AM - 10:00 PM"
                                        />
                                    </div>

                                    <div className="flex gap-6 pt-2 flex-wrap">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#292928]">
                                            <input
                                                type="checkbox"
                                                checked={moduleOverview.serviceAnimalsAllowed}
                                                onChange={(e) => setModuleOverview(prev => ({ ...prev, serviceAnimalsAllowed: e.target.checked }))}
                                                className="w-4 h-4 rounded text-[#292928] focus:ring-[#c3f832]"
                                            />
                                            Service Animals Allowed
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#292928]">
                                            <input
                                                type="checkbox"
                                                checked={moduleOverview.wheelchairRentalAvailable}
                                                onChange={(e) => setModuleOverview(prev => ({ ...prev, wheelchairRentalAvailable: e.target.checked }))}
                                                className="w-4 h-4 rounded text-[#292928] focus:ring-[#c3f832]"
                                            />
                                            Complimentary Wheelchairs at Entrance
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MODULE 2: Sensory & Neurodivergent Guide */}
                        <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E4E9F0]">
                                <div>
                                    <h3 className="text-base font-black text-[#292928]">Sensory & Neurodivergent Guide</h3>
                                    <p className="text-xs text-[#6B7280]">Lighting, noise levels, quiet spaces for neurodivergent visitors</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={moduleSensory.enabled}
                                        onChange={(e) => setModuleSensory(prev => ({ ...prev, enabled: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#292928]"></div>
                                </label>
                            </div>

                            {moduleSensory.enabled && (
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                                Lighting Environment
                                            </label>
                                            <input
                                                type="text"
                                                value={moduleSensory.lightingType}
                                                onChange={(e) => setModuleSensory(prev => ({ ...prev, lightingType: e.target.value }))}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                                placeholder="Warm indirect LED, low glare, natural skylights"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                                Sound Level
                                            </label>
                                            <input
                                                type="text"
                                                value={moduleSensory.soundLevel}
                                                onChange={(e) => setModuleSensory(prev => ({ ...prev, soundLevel: e.target.value }))}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                                placeholder="Moderate background music, quiet mornings 9-11 AM"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                                Quiet / Decompression Space
                                            </label>
                                            <input
                                                type="text"
                                                value={moduleSensory.quietSpaces}
                                                onChange={(e) => setModuleSensory(prev => ({ ...prev, quietSpaces: e.target.value }))}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                                placeholder="Dedicated sensory room on Level 1 next to pharmacy"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                                Peak Traffic Hours
                                            </label>
                                            <input
                                                type="text"
                                                value={moduleSensory.crowdPeakHours}
                                                onChange={(e) => setModuleSensory(prev => ({ ...prev, crowdPeakHours: e.target.value }))}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                                placeholder="Saturdays 1:00 PM - 5:00 PM"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MODULE 3: Accessible Parking & Transit */}
                        <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E4E9F0]">
                                <div>
                                    <h3 className="text-base font-black text-[#292928]">Accessible Parking & Transit Arrival</h3>
                                    <p className="text-xs text-[#6B7280]">Parking bay counts, drop-off routes, and public transit connectivity</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={moduleTransit.enabled}
                                        onChange={(e) => setModuleTransit(prev => ({ ...prev, enabled: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#292928]"></div>
                                </label>
                            </div>

                            {moduleTransit.enabled && (
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                                Standard Accessible Bays
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={moduleTransit.standardAccessibleSpaces}
                                                onChange={(e) => setModuleTransit(prev => ({ ...prev, standardAccessibleSpaces: Number(e.target.value) }))}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                                Van / Lift Accessible Bays
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={moduleTransit.vanAccessibleSpaces}
                                                onChange={(e) => setModuleTransit(prev => ({ ...prev, vanAccessibleSpaces: Number(e.target.value) }))}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                                Drop-Off Distance (Meters)
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={moduleTransit.dropOffZoneDistanceMeters}
                                                onChange={(e) => setModuleTransit(prev => ({ ...prev, dropOffZoneDistanceMeters: Number(e.target.value) }))}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#292928] uppercase tracking-wider mb-1">
                                            Transit Pathways & Directions
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={moduleTransit.transitNotes}
                                            onChange={(e) => setModuleTransit(prev => ({ ...prev, transitNotes: e.target.value }))}
                                            className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl p-3 text-sm text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                            placeholder="Step-free pavement connects directly from the subway stop to Main Entrance A."
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#292928]">
                                            <input
                                                type="checkbox"
                                                checked={moduleTransit.evChargingAccessible}
                                                onChange={(e) => setModuleTransit(prev => ({ ...prev, evChargingAccessible: e.target.checked }))}
                                                className="w-4 h-4 rounded text-[#292928] focus:ring-[#c3f832]"
                                            />
                                            Accessible EV Charging Bay on site
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={saveModules}
                                disabled={isSaving}
                                className="bg-[#292928] text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-black transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                <Save size={16} /> Save Dashboard Settings
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 2: CAMPUS & FLOORS */}
                {activeTab === 'campus' && (
                    <div className="space-y-6">
                        {/* Floor list */}
                        <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 shadow-xs">
                            <h3 className="text-base font-black text-[#292928] mb-1">Configured Campus Floors</h3>
                            <p className="text-xs text-[#6B7280] mb-4">
                                Floors currently active on your location profile
                            </p>

                            <div className="space-y-3 mb-6">
                                {buildings[0]?.floors?.map((f: any) => (
                                    <div key={f.floor_id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E4E9F0] flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-[#292928]">{f.floor_name}</span>
                                                <span className="text-[10px] font-bold bg-[#E4E9F0] text-[#6B7280] px-2 py-0.5 rounded-md">
                                                    Level {f.floor_number}
                                                </span>
                                            </div>
                                            {f.description && <p className="text-xs text-[#4B5563] mt-0.5">{f.description}</p>}
                                            <span className="text-[11px] text-[#9CA3AF] block mt-1">
                                                Amenities: {f.pois?.length || 0} accessibility points
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add floor form */}
                            <form onSubmit={handleAddFloor} className="p-4 rounded-2xl border-2 border-dashed border-[#E4E9F0] bg-[#FAFCFF] space-y-3">
                                <h4 className="text-xs font-black text-[#292928] uppercase tracking-wider flex items-center gap-1.5">
                                    <Plus size={14} /> Add New Level / Floor
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#6B7280] mb-1">Floor Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newFloorName}
                                            onChange={(e) => setNewFloorName(e.target.value)}
                                            placeholder="e.g. Level 2 - Food & Cinema"
                                            className="w-full bg-white border border-[#E4E9F0] rounded-xl px-3 py-2 text-xs text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#6B7280] mb-1">Floor Number *</label>
                                        <input
                                            type="number"
                                            required
                                            value={newFloorNumber}
                                            onChange={(e) => setNewFloorNumber(Number(e.target.value))}
                                            className="w-full bg-white border border-[#E4E9F0] rounded-xl px-3 py-2 text-xs text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#6B7280] mb-1">Short Description</label>
                                        <input
                                            type="text"
                                            value={newFloorDesc}
                                            onChange={(e) => setNewFloorDesc(e.target.value)}
                                            placeholder="e.g. Step-free cinema entrance"
                                            className="w-full bg-white border border-[#E4E9F0] rounded-xl px-3 py-2 text-xs text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-[#292928] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors"
                                    >
                                        Add Floor
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Add POI */}
                        {buildings[0]?.floors?.length > 0 && (
                            <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 shadow-xs">
                                <h3 className="text-base font-black text-[#292928] mb-1">Add Accessibility Point to Floor</h3>
                                <p className="text-xs text-[#6B7280] mb-4">
                                    Place elevators, accessible restrooms, tactile routes, and information points on floor maps
                                </p>

                                <form onSubmit={handleAddPoi} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] mb-1">Target Floor *</label>
                                            <select
                                                value={selectedFloorForPoi || ''}
                                                onChange={(e) => setSelectedFloorForPoi(Number(e.target.value))}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3 py-2.5 text-xs text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                            >
                                                {buildings[0]?.floors?.map((f: any) => (
                                                    <option key={f.floor_id} value={f.floor_id}>
                                                        {f.floor_name} (Level {f.floor_number})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] mb-1">Amenity Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={newPoiName}
                                                onChange={(e) => setNewPoiName(e.target.value)}
                                                placeholder="e.g. South Wing Accessible Restroom"
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3 py-2.5 text-xs text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[#292928] mb-1">Category *</label>
                                            <select
                                                value={newPoiCategory}
                                                onChange={(e) => setNewPoiCategory(e.target.value)}
                                                className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3 py-2.5 text-xs text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                            >
                                                <option value="restroom">🚻 Accessible Restroom</option>
                                                <option value="elevator">🛗 Elevator Hub</option>
                                                <option value="ramp">♿ Ramp / Step-free Route</option>
                                                <option value="help_desk">ℹ️ Assistance / Info Desk</option>
                                                <option value="quiet_room">🌿 Quiet / Sensory Room</option>
                                                <option value="parking">🅿️ Accessible Parking</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#292928] mb-1">Features & Equipment Description</label>
                                        <input
                                            type="text"
                                            value={newPoiDesc}
                                            onChange={(e) => setNewPoiDesc(e.target.value)}
                                            placeholder="e.g. Equipped with adult changing table, hoist, and emergency pull cord."
                                            className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3 py-2.5 text-xs text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="bg-[#292928] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-colors"
                                        >
                                            Add Amenity to Floor
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: LIVE OPERATIONAL ALERTS */}
                {activeTab === 'alerts' && (
                    <div className="space-y-6">
                        {/* New alert form */}
                        <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 shadow-xs">
                            <h3 className="text-base font-black text-[#292928] mb-1">Post Live Operational Alert</h3>
                            <p className="text-xs text-[#6B7280] mb-4">
                                Keep visitors immediately informed about elevator maintenance, ramp closures, or special event conditions
                            </p>

                            <form onSubmit={handleCreateAlert} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-[#292928] mb-1">Alert Headline *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newAlertTitle}
                                            onChange={(e) => setNewAlertTitle(e.target.value)}
                                            placeholder="e.g. Elevator B (Atrium) Under Maintenance"
                                            className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-xs text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#292928] mb-1">Severity Level *</label>
                                        <select
                                            value={newAlertSeverity}
                                            onChange={(e) => setNewAlertSeverity(e.target.value)}
                                            className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl px-3.5 py-2.5 text-xs text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none"
                                        >
                                            <option value="warning">⚠️ Warning (Closure / Delay)</option>
                                            <option value="critical">🚨 Critical (No Step-free Access)</option>
                                            <option value="info">ℹ️ Info (General Update / Event)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#292928] mb-1">Detailed Message & Alternative Route *</label>
                                    <textarea
                                        rows={2}
                                        required
                                        value={newAlertMessage}
                                        onChange={(e) => setNewAlertMessage(e.target.value)}
                                        placeholder="Please use the North Wing Elevator adjacent to store #104. Scheduled for resolution by 4:00 PM."
                                        className="w-full bg-[#f8f8f8] border border-[#E4E9F0] rounded-xl p-3 text-xs text-[#292928] focus:ring-2 focus:ring-[#c3f832] focus:outline-none resize-none"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-[#292928] text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-black transition-colors"
                                    >
                                        Publish Live Alert
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Existing alerts list */}
                        <div className="bg-white rounded-[24px] border border-[#E4E9F0] p-6 shadow-xs">
                            <h3 className="text-base font-black text-[#292928] mb-4">Active Location Alerts ({alerts.length})</h3>
                            {alerts.length === 0 ? (
                                <p className="text-xs text-[#9CA3AF] italic text-center py-6">
                                    No active alerts posted. Your location is currently operating under normal status.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {alerts.map((alert) => (
                                        <div key={alert.alert_id} className="p-4 rounded-2xl border border-[#E4E9F0] bg-[#F8FAFC] flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-black text-[#292928]">{alert.title}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-[#E4E9F0]">
                                                        {alert.severity}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#4B5563] leading-relaxed">{alert.message}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAlert(alert.alert_id)}
                                                className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Resolve / Delete Alert"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
