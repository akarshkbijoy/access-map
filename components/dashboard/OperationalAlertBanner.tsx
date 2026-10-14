'use client'

import { AlertTriangle, Info, AlertCircle, Clock } from 'lucide-react'

export interface OperationalAlert {
    alert_id: number;
    title: string;
    message: string;
    severity: string; // 'info', 'warning', 'critical'
    is_active: boolean;
    created_at?: string | null;
}

interface OperationalAlertBannerProps {
    alerts: OperationalAlert[];
}

export default function OperationalAlertBanner({ alerts }: OperationalAlertBannerProps) {
    if (!alerts || alerts.length === 0) return null

    const activeAlerts = alerts.filter(a => a.is_active)
    if (activeAlerts.length === 0) return null

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical':
                return {
                    bg: 'bg-red-50 border-red-200',
                    icon: <AlertCircle className="text-red-600 shrink-0" size={18} />,
                    titleColor: 'text-red-900',
                    badge: 'bg-red-100 text-red-800 border-red-300'
                }
            case 'warning':
                return {
                    bg: 'bg-amber-50 border-amber-200',
                    icon: <AlertTriangle className="text-amber-600 shrink-0" size={18} />,
                    titleColor: 'text-amber-900',
                    badge: 'bg-amber-100 text-amber-800 border-amber-300'
                }
            case 'info':
            default:
                return {
                    bg: 'bg-blue-50 border-blue-200',
                    icon: <Info className="text-blue-600 shrink-0" size={18} />,
                    titleColor: 'text-blue-900',
                    badge: 'bg-blue-100 text-blue-800 border-blue-300'
                }
        }
    }

    return (
        <div className="space-y-3 mb-8">
            {activeAlerts.map((alert) => {
                const styles = getSeverityStyles(alert.severity)
                const formattedDate = alert.created_at
                    ? new Date(alert.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : null

                return (
                    <div
                        key={alert.alert_id}
                        className={`rounded-[20px] border p-4.5 transition-all shadow-xs flex items-start gap-3.5 ${styles.bg}`}
                    >
                        {styles.icon}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-bold text-[#292928]">{alert.title}</span>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${styles.badge}`}>
                                    {alert.severity}
                                </span>
                                {formattedDate && (
                                    <span className="text-[11px] text-[#6B7280] font-medium flex items-center gap-1 ml-auto">
                                        <Clock size={11} /> Posted {formattedDate}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[#4B5563] leading-relaxed">
                                {alert.message}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
