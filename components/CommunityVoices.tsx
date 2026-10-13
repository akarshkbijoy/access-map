'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const reviews = [
    { id: 1, text: "AccessMap completely changed how I plan my weekends. Finding wheelchair-friendly cafes used to be a gamble, but now I know exactly what to expect before I arrive.", author: "Sarah J.", color: "#ff7a2e" },
    { id: 2, text: "As a visually impaired user, the detailed descriptions and high-contrast features mentioned in the community notes make navigation much less stressful.", author: "Marcus T.", color: "#9a442d" },
    { id: 3, text: "I travel frequently with a stroller. This map highlights ramp access and wide doorways, saving us so much time and hassle in new cities.", author: "Elena R.", color: "#ffefec" },
    { id: 4, text: "I love contributing to this app! It feels great knowing that simply marking a new accessible restroom can make someone else's trip barrier-free.", author: "David L.", color: "#f7f4e1" },
    { id: 5, text: "The tactile interface design is beautiful, but the community-verified accessibility data is the real star. Highly recommend to everyone.", author: "Priya M.", color: "#9a442d" },
]

export default function CommunityVoices() {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 400
            scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
        }
    }

    return (
        <section className="mt-32 mb-16 max-w-7xl mx-auto px-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-16 gap-4">
                <h2 className="text-5xl font-headline font-extrabold text-[#9a442d]">Community Voices</h2>
                <div className="flex gap-4">
                    <button onClick={() => scroll('left')} className="w-12 h-12 rounded-full border-2 border-[#9a442d] flex items-center justify-center text-[#9a442d] hover:bg-[#9a442d] hover:text-white transition-colors cursor-pointer">
                        <ChevronLeft />
                    </button>
                    <button onClick={() => scroll('right')} className="w-12 h-12 rounded-full border-2 border-[#9a442d] flex items-center justify-center text-[#9a442d] hover:bg-[#9a442d] hover:text-white transition-colors cursor-pointer">
                        <ChevronRight />
                    </button>
                </div>
            </div>

            <div 
                ref={scrollRef} 
                className="flex gap-8 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8 pt-4 -mx-6 px-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {reviews.map((r) => (
                    <div key={r.id} className="min-w-[320px] md:min-w-[400px] snap-center convex-card rounded-xl p-8 pillow-shadow flex flex-col gap-4 border-t-4" style={{ borderColor: r.color }}>
                        <div className="flex gap-1 text-[#ff7a2e]">
                            <span className="material-symbols-outlined" data-icon="star">star</span>
                            <span className="material-symbols-outlined" data-icon="star">star</span>
                            <span className="material-symbols-outlined" data-icon="star">star</span>
                            <span className="material-symbols-outlined" data-icon="star">star</span>
                            <span className="material-symbols-outlined" data-icon="star">star</span>
                        </div>
                        <p className="font-body text-lg italic text-[#55423e] flex-1">"{r.text}"</p>
                        <div className="font-bold text-[#9a442d] mt-4">— {r.author}</div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    )
}
