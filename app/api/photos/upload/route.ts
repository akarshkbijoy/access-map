import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000'

export async function POST(req: Request) {
    try {
        // 1. Auth check
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        let dbUser = user ? await prisma.aPP_USER.findUnique({ where: { email: user.email } }) : null

        if (!dbUser) {
            dbUser = await prisma.aPP_USER.findFirst({ where: { username: 'anonymous' } })
            if (!dbUser) {
                dbUser = await prisma.aPP_USER.create({
                    data: { username: 'anonymous', email: 'anon@test.com', password: 'none' }
                })
            }
        }

        // 2. Parse multipart form data
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const locationId = formData.get('location_id') as string
        const caption = (formData.get('caption') as string) || ''

        // Parse declared_classes from form (JSON array or comma-separated)
        const declaredClassesRaw = formData.get('declared_classes') as string | null
        let declaredClasses: string[] = []
        if (declaredClassesRaw) {
            try {
                declaredClasses = JSON.parse(declaredClassesRaw)
            } catch {
                declaredClasses = declaredClassesRaw.split(',').map(s => s.trim()).filter(Boolean)
            }
        }

        if (!file || !locationId) {
            return NextResponse.json({ message: 'File and location_id are required.' }, { status: 400 })
        }

        // Validate file size and type
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ message: 'File size must be under 5MB.' }, { status: 400 })
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ message: 'Only JPEG, PNG, WebP, and GIF are allowed.' }, { status: 400 })
        }

        // 3. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop() || 'jpg'
        const fileName = `${locationId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('location-photos')
            .upload(fileName, file, { contentType: file.type, upsert: false })

        if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            return NextResponse.json({ message: 'Failed to upload image.' }, { status: 500 })
        }

        const { data: urlData } = supabase.storage
            .from('location-photos')
            .getPublicUrl(uploadData.path)

        const publicUrl = urlData.publicUrl

        // 4. Run ML analysis SYNCHRONOUSLY before saving final status
        //    This is the key: we wait for ML result to decide auto-push
        const mlResult = await runMlAnalysis(publicUrl, declaredClasses)

        // 5. Auto-push logic:
        //    - ML found the declared feature  → status='verified', ml_pushed=true  (shown on map)
        //    - ML did NOT find it             → status='pending',  ml_pushed=false (hidden from map)
        //    - ML unavailable (server down)   → status='pending',  ml_pushed=false (admin decides)
        const mlFound = mlResult?.found ?? false
        const mlAvailable = mlResult !== null

        const photoStatus = mlFound ? 'verified' : 'pending'
        const mlPushed = mlFound

        // 6. Save photo record to DB with ML result and final status
        const photoRecord = await prisma.lOCATION_PHOTO.create({
            data: {
                location_id: BigInt(locationId),
                user_id: dbUser.user_id,
                url: publicUrl,
                caption: caption || null,
                status: photoStatus,
                declared_classes: declaredClasses,
                ml_pushed: mlPushed,
                // Store full analysis result (or null if ML was unavailable)
                ml_analysis: mlResult
                    ? {
                        found: mlResult.found,
                        ml_available: true,
                        declared_classes: declaredClasses,
                        all_detections: mlResult.all_detections,
                        filtered_detections: mlResult.filtered_detections,
                        bboxes_percent: mlResult.bboxes_percent,
                        image_info: mlResult.image_info,
                        summary: mlResult.summary,
                        processing_time_ms: mlResult.processing_time_ms,
                        analyzed_at: new Date().toISOString(),
                        auto_pushed: mlFound,
                    }
                    : {
                        found: false,
                        ml_available: false,
                        declared_classes: declaredClasses,
                        all_detections: [],
                        filtered_detections: [],
                        bboxes_percent: [],
                        analyzed_at: new Date().toISOString(),
                        auto_pushed: false,
                        note: 'ML service was unavailable at upload time. Admin review required.',
                    },
            }
        })

        console.log(
            `Photo ${photoRecord.photo_id} uploaded. ML found=${mlFound}, auto_pushed=${mlPushed}, ml_available=${mlAvailable}`
        )

        return NextResponse.json({
            success: true,
            url: publicUrl,
            photo_id: Number(photoRecord.photo_id),
            ml_available: mlAvailable,
            ml_found: mlFound,
            auto_pushed: mlPushed,
            // Tell the frontend what happened so it can show the right message
            message: !mlAvailable
                ? 'Photo uploaded. AI model is offline — an admin will review it manually.'
                : mlFound
                    ? `AI detected ${declaredClasses.join(', ')} — photo published to the map!`
                    : `AI did not detect ${declaredClasses.join(', ')} in this photo — it won't be shown on the map.`,
        }, { status: 201 })

    } catch (error: any) {
        console.error('Photo upload error:', error)
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
    }
}

/**
 * Calls the ML FastAPI service to detect accessibility features in an image.
 * Returns structured result with bboxes, or null if the ML service is unavailable.
 */
async function runMlAnalysis(
    imageUrl: string,
    declaredClasses: string[]
): Promise<{
    found: boolean
    all_detections: any[]
    filtered_detections: any[]
    bboxes_percent: any[]
    image_info: any
    summary: any
    processing_time_ms: number
} | null> {
    try {
        const mlRes = await fetch(`${ML_API_URL}/detect/url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: imageUrl, conf_threshold: 0.25 }),
            signal: AbortSignal.timeout(30000),
        })

        if (!mlRes.ok) {
            console.error(`ML service returned ${mlRes.status}`)
            return null
        }

        const data = await mlRes.json()
        const allDetections: any[] = data.detections || []
        const imageWidth: number = data.image_info?.width || 640
        const imageHeight: number = data.image_info?.height || 640

        // Keep only detections matching declared classes
        const filteredDetections = allDetections.filter(det =>
            declaredClasses.length === 0 || declaredClasses.includes(det.class_name)
        )

        const found = filteredDetections.length > 0

        // Build percentage-based bboxes for CSS overlay rendering in admin panel
        const bboxesPercent = allDetections.map(det => ({
            id: det.id,
            class_name: det.class_name,
            display_name: det.display_name,
            confidence: det.confidence,
            type: det.type,
            is_declared: declaredClasses.includes(det.class_name),
            x_pct: (det.bbox.x1 / imageWidth) * 100,
            y_pct: (det.bbox.y1 / imageHeight) * 100,
            w_pct: (det.bbox.width / imageWidth) * 100,
            h_pct: (det.bbox.height / imageHeight) * 100,
        }))

        return {
            found,
            all_detections: allDetections,
            filtered_detections: filteredDetections,
            bboxes_percent: bboxesPercent,
            image_info: data.image_info,
            summary: data.summary,
            processing_time_ms: data.processing_time_ms,
        }
    } catch (err) {
        console.error('ML service unreachable:', err)
        return null // ML offline — caller handles gracefully
    }
}
