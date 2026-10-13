import prisma from '@/lib/prisma'
import AppSidebar from '@/components/AppSidebar'
import ClientInteractiveLayer from '@/components/ClientInteractiveLayer'

export const dynamic = 'force-dynamic'

// Note: In Next.js 14 server components searchParams is a promise
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams

  // Only show verified locations on the public map
  const filters: any = { status: 'verified' }

  // Fetch db data
  const rawLocations = await prisma.lOCATION.findMany({
    where: filters,
    include: {
      features: true,
      contributions: {
        where: { status: 'verified' },
        include: { user: { select: { username: true } } }
      }
    },
    take: 50,
    orderBy: { location_id: 'desc' }
  })

  // Format decimal values from PostGIS/Prisma
  const locations = rawLocations.map(loc => {
    const safeFeatures = loc.features ? loc.features.map((f: any) => ({
      ...f,
      feature_id: Number(f.feature_id),
      location_id: Number(f.location_id)
    })) : []

    const safeContributions = loc.contributions ? loc.contributions.map((c: any) => ({
      ...c,
      contribution_id: Number(c.contribution_id),
      location_id: Number(c.location_id),
      user_id: Number(c.user_id),
      reviewed_by: c.reviewed_by ? Number(c.reviewed_by) : null
    })) : []

    return {
      ...loc,
      location_id: Number(loc.location_id),
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      status: loc.status || 'pending',
      rating: loc.rating ? Number(loc.rating) : null,
      accessibilityScore: loc.accessibilityScore ? Number(loc.accessibilityScore) : null,
      features: safeFeatures,
      contributions: safeContributions
    }
  })

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8f8f8]">
      <AppSidebar />
      <div className="flex-1 relative overflow-hidden">
        <ClientInteractiveLayer locations={locations} />
      </div>
    </div>
  )
}

