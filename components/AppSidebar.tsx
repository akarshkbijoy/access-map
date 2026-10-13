import Link from 'next/link'
import { Home, Box } from 'lucide-react'
import ProfileMenu from './ProfileMenu'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function AppSidebar() {
    // Fetch User logic
    const authUser = await getSession()

    let userSummary = null;
    if (authUser && authUser.email) {
        const dbUser = await prisma.aPP_USER.findFirst({
            where: { email: authUser.email }
        })
        if (dbUser) {
            userSummary = {
                id: Number(dbUser.user_id),
                username: dbUser.username,
                email: dbUser.email,
                name: dbUser.name,
                address: dbUser.address,
                phone: dbUser.phone,
                description: (dbUser as any).description,
                role: authUser.role || 'user'
            }
        }
    }

    return (
        <nav className="flex flex-col items-center justify-between w-[72px] h-full bg-white border-r border-[#E4E9F0] py-6 z-[60] shrink-0 shadow-sm pointer-events-auto">
            {/* Top Logo */}
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border-[1.5px] border-[#292928] text-[#292928] hover:bg-[#f8f8f8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#c3f832]">
                <Box size={20} strokeWidth={2.5} />
            </Link>

            {/* Middle Navigation Icons */}
            <div className="flex flex-col items-center space-y-4">
                <Link href="/map" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#292928] hover:bg-[#f8f8f8] bg-transparent transition-colors shadow-sm">
                    <Home size={22} strokeWidth={2.5} />
                </Link>
                <ProfileMenu user={userSummary} />
            </div>

            {/* Bottom Profile / Settings */}
            <div className="flex flex-col items-center space-y-4">
            </div>
        </nav>
    )
}
