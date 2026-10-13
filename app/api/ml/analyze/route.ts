import { NextResponse } from 'next/server'

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { image_url, declared_classes } = body

        if (!image_url) {
            return NextResponse.json({ message: 'image_url is required.' }, { status: 400 })
        }

        if (!declared_classes || !Array.isArray(declared_classes) || declared_classes.length === 0) {
            return NextResponse.json({ message: 'declared_classes array is required.' }, { status: 400 })
        }

        // Check ML API health first
        try {
            const healthRes = await fetch(`${ML_API_URL}/health`, { 
                signal: AbortSignal.timeout(5000) 
            })
            if (!healthRes.ok) {
                return NextResponse.json(
                    { message: 'ML service is unavailable. Analysis skipped.', ml_available: false },
                    { status: 503 }
                )
            }
            const health = await healthRes.json()
            if (!health.model_loaded) {
                return NextResponse.json(
                    { message: 'ML model is not loaded. Please train and deploy a model first.', ml_available: false },
                    { status: 503 }
                )
            }
        } catch {
            return NextResponse.json(
                { message: 'ML service is not running. Start the Python FastAPI server.', ml_available: false },
                { status: 503 }
            )
        }

        // Send image URL to ML service for detection
        const mlRes = await fetch(`${ML_API_URL}/detect/url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: image_url,
                conf_threshold: 0.25,
            }),
            signal: AbortSignal.timeout(30000),
        })

        if (!mlRes.ok) {
            const errData = await mlRes.json().catch(() => ({}))
            return NextResponse.json(
                { message: 'ML analysis failed.', detail: errData.detail || 'Unknown error' },
                { status: 500 }
            )
        }

        const mlResult = await mlRes.json()

        // Filter detections to only those matching user-declared classes
        const allDetections = mlResult.detections || []
        const filteredDetections = allDetections.filter((det: any) =>
            declared_classes.includes(det.class_name)
        )

        // Determine if ANY declared class was actually found
        const foundDeclaredClass = filteredDetections.length > 0

        // Build annotated bounding box data for frontend rendering
        const imageWidth = mlResult.image_info?.width || 640
        const imageHeight = mlResult.image_info?.height || 640

        return NextResponse.json({
            ml_available: true,
            found: foundDeclaredClass,
            declared_classes,
            all_detections: allDetections,
            filtered_detections: filteredDetections,
            image_info: mlResult.image_info,
            summary: mlResult.summary,
            processing_time_ms: mlResult.processing_time_ms,
            // Bounding boxes normalized to 0-100% for CSS overlay
            bboxes_percent: filteredDetections.map((det: any) => ({
                id: det.id,
                class_name: det.class_name,
                display_name: det.display_name,
                confidence: det.confidence,
                type: det.type,
                x_pct: (det.bbox.x1 / imageWidth) * 100,
                y_pct: (det.bbox.y1 / imageHeight) * 100,
                w_pct: (det.bbox.width / imageWidth) * 100,
                h_pct: (det.bbox.height / imageHeight) * 100,
            })),
        })

    } catch (error: any) {
        console.error('ML analyze route error:', error)
        return NextResponse.json(
            { message: 'Internal server error.', error: error.message },
            { status: 500 }
        )
    }
}
