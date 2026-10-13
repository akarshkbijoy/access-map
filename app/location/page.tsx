import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LocationPage() {
 return (
 <>
 <style dangerouslySetInnerHTML={{__html: ` body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #fff8f0; } .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; } .clay-shadow { shadow-[0_40px_40px_-5px_rgba(31,27,16,0.06)]; } .pressed-in { box-shadow: inset 4px 4px 8px rgba(31, 27, 16, 0.05), inset -4px -4px 8px rgba(255, 255, 255, 0.8); } .protruding { box-shadow: 8px 8px 16px rgba(31, 27, 16, 0.08), -4px -4px 12px rgba(255, 255, 255, 0.9); } .embossed-soft { box-shadow: 0 10px 30px -5px rgba(31, 27, 16, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6); } `}} />
 <div className="bg-surface text-on-surface selection:bg-primary-fixed min-h-screen pb-32">

{/* Top Navigation Shell */}
<header className="w-full top-0 sticky z-50 bg-[#fff8f0] shadow-[0_40px_40px_-5px_rgba(31,27,16,0.06)]">
<div className="flex justify-between items-center px-6 py-4 w-full max-w-none">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[#9d3e1d]" data-icon="map">map</span>
<span className="font-['Plus_Jakarta_Sans'] font-bold tracking-[-0.03em] uppercase text-[#9d3e1d] #d66844] text-xl">AccessMap</span>
</div>
<div className="flex items-center gap-4">
<button className="text-[#9d3e1d] font-bold text-sm hover:scale-95 transition-transform duration-200">Sign In</button>
<button className="bg-primary text-on-primary px-4 py-2 rounded-full font-bold text-sm shadow-sm hover:scale-95 transition-transform duration-200 active:scale-[0.96]">Register</button>
</div>
</div>
</header>
<main className="px-4 pt-6 space-y-6">
{/* Hero Section: Central Library */}
<section className="space-y-4">
<div className="flex justify-between items-end">
<div>
<span className="text-label text-xs font-bold uppercase tracking-widest text-outline mb-1 block">Public Venue</span>
<h1 className="text-4xl font-headline font-bold tracking-[-0.04em] text-on-surface">Central Library</h1>
</div>
{/* Squishy Rating Bubble */}
<div className="bg-surface-container-highest rounded-full p-6 protruding flex flex-col items-center justify-center aspect-square border-4 border-surface">
<span className="text-2xl font-black text-primary leading-none">4.8</span>
<span className="text-[10px] font-bold uppercase tracking-tighter text-outline">Stars</span>
</div>
</div>
</section>
{/* Bento Grid Layout */}
<div className="grid grid-cols-12 gap-4">
{/* Map Card (Large Bento Item) */}
<div className="col-span-12 rounded-xl overflow-hidden bg-surface-container-low p-2 protruding">
<div className="relative h-56 w-full rounded-lg overflow-hidden bg-surface-dim">
<img className="w-full h-full object-cover mix-blend-multiply opacity-80" data-alt="stylized map view of city streets with a pin on a large architectural building with warm terracotta color palette" data-location="Seattle" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJ5tz5rMnN-xV6QI8upWBIsDM_Ga6JURqpxXLn66K_rtnsbgV03cXQGU4yIdU-AVTJmVFFTr6F2ABSPh1dZE3k3pSiitUMWmO2oK1BI27ps9IQzMEwUqinwRpc6auwqwHdFGLywgrbYDhVrgXTtuEv3z_DA2KOc6SkGVt7p6rQKuzH1zj81mNpAL2bU9NZ_02cvaICKjtwpO5Sl639E3RNwv_OmRPmk3FknzBQ2SIJEOg6joY-NCpiZPvjLWy_aphFj441o5lAhqwS"/>
<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
<div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
<span className="material-symbols-outlined text-white" data-icon="location_on" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
</div>
</div>
</div>
<div className="p-4 flex justify-between items-center">
<span className="text-sm font-bold text-on-surface-variant">1000 4th Ave, City Center</span>
<span className="material-symbols-outlined text-outline" data-icon="open_in_new">open_in_new</span>
</div>
</div>
{/* Accessibility Tokens (Medium Bento Items) */}
<div className="col-span-6 bg-secondary-container rounded-xl p-5 flex flex-col justify-between protruding aspect-square">
<div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center pressed-in mb-4">
<span className="material-symbols-outlined text-on-secondary-container" data-icon="accessible" style={{ fontVariationSettings: "'FILL' 1" }}>accessible</span>
</div>
<div>
<h3 className="text-on-secondary-container font-bold text-lg leading-tight">Ramp</h3>
<p className="text-on-secondary-fixed-variant text-xs font-medium">Automatic at main entry</p>
</div>
</div>
<div className="col-span-6 bg-surface-container-highest rounded-xl p-5 flex flex-col justify-between protruding aspect-square">
<div className="w-10 h-10 rounded-full bg-white flex items-center justify-center pressed-in mb-4">
<span className="material-symbols-outlined text-primary" data-icon="elevator" style={{ fontVariationSettings: "'FILL' 1" }}>elevator</span>
</div>
<div>
<h3 className="text-on-surface font-bold text-lg leading-tight">Elevator</h3>
<p className="text-on-surface-variant text-xs font-medium">Access to all 10 floors</p>
</div>
</div>
{/* Main CTA: Get Directions (Large Protruding Card) */}
<button className="col-span-12 bg-primary bg-gradient-to-br from-primary to-primary-container p-8 rounded-xl protruding flex items-center justify-between group active:scale-[0.96] transition-all">
<div className="text-left">
<span className="text-on-primary text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-1 block">Plan Journey</span>
<h2 className="text-2xl font-black text-on-primary">Get Directions</h2>
</div>
<div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
<span className="material-symbols-outlined text-on-primary text-3xl" data-icon="near_me" style={{ fontVariationSettings: "'FILL' 1" }}>near_me</span>
</div>
</button>
{/* Reviews Section Header */}
<div className="col-span-12 pt-4">
<h3 className="text-xl font-headline font-bold text-on-surface px-2">Community Insights</h3>
</div>
{/* Reviews (Soft Shadow Containers) */}
<div className="col-span-12 space-y-4">
<div className="bg-surface-container-low rounded-lg p-6 embossed-soft border border-white/40">
<div className="flex items-center gap-3 mb-4">
<div className="w-10 h-10 rounded-full bg-surface-dim flex items-center justify-center pressed-in overflow-hidden">
<img className="w-full h-full object-cover" data-alt="portrait of a smiling person in a library setting with warm focus" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBl5yme0ijIrE9XH5B2Kwvy92X4VbNTBNHi0QS7fS_cQ-rb705Kc4Uf86CoCdom7h6X7nrnH8bhV3MgdZO4kzjNvbsdX2enwXpzOZrbLlstf__VIiOR0F07aAXeH6ND6DFxnhuaMf2E_NS2TOkRT9dc2hqe_kBb-ozYoado2CoKONj2ZzFynmjqiZbNZDWbytwX6-86rYGkxS4fFm_kIxhAcGDC8mPnLbWr331eEhce1Y28gIawSANvckgvrZHGdsSXZIbtsmR3uNTm"/>
</div>
<div>
<p className="font-bold text-sm text-on-surface">Alex Rivera</p>
<p className="text-[10px] font-bold uppercase text-outline">Local Guide</p>
</div>
</div>
<p className="text-on-surface-variant text-sm leading-relaxed italic">
 "The ramp at the 4th Ave entrance is super wide. Highly recommend the reading room on level 10—totally accessible."
 </p>
</div>
<div className="bg-surface-container-low rounded-lg p-6 embossed-soft border border-white/40">
<div className="flex items-center gap-3 mb-4">
<div className="w-10 h-10 rounded-full bg-surface-dim flex items-center justify-center pressed-in overflow-hidden">
<img className="w-full h-full object-cover" data-alt="portrait of a man with glasses smiling gently" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwHkGMhxPZmn1JemBDl8vtbAyah2Y42Wic2RVyxvgHvSQvc7RiKnumLS91tVmupszQg2770zvP5HdHN6hWcqGBbiyP72lV0oDB0NyTD2p1hlbt_s9VFHJz2OdxK0AFBWo41HFv3ZzKllUSnJkKvGcN125RbOXmumYaZ7g7GA0f3j0jex700NhXjYGHRTv6S2trTrNv1S2_VEsFxKuHye-JlJ-Dg_FF2QoQbZCdpVzQmQ4fjpqcVdVtyTu3nNA1tWwR6hfc880zp5P2"/>
</div>
<div>
<p className="font-bold text-sm text-on-surface">Jordan Smith</p>
<p className="text-[10px] font-bold uppercase text-outline">Frequent Visitor</p>
</div>
</div>
<p className="text-on-surface-variant text-sm leading-relaxed italic">
 "Elevators are fast and clearly marked. Staff are incredibly helpful with navigating the stacks."
 </p>
</div>
</div>
</div>
</main>
{/* Bottom Navigation Shell */}
<nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-[#fff8f0] rounded-t-[3rem] shadow-[0_-10px_40px_rgba(31,27,16,0.08)]">
<div className="flex flex-col items-center justify-center text-[#8a726b] p-3 hover:bg-[#fdf3df] :bg-stone-900 active:scale-90 duration-150">
<span className="material-symbols-outlined" data-icon="explore">explore</span>
<span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest mt-1">Explore</span>
</div>
{/* Active Nav: Since this is location details, none might be strictly 'top-level active' in a simple 3-tab system, but we keep the structure */}
<div className="flex flex-col items-center justify-center text-[#8a726b] p-3 hover:bg-[#fdf3df] :bg-stone-900 active:scale-90 duration-150">
<span className="material-symbols-outlined" data-icon="bookmark">bookmark</span>
<span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest mt-1">Saved</span>
</div>
<div className="flex flex-col items-center justify-center text-[#8a726b] p-3 hover:bg-[#fdf3df] :bg-stone-900 active:scale-90 duration-150">
<span className="material-symbols-outlined" data-icon="person">person</span>
<span className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-widest mt-1">Profile</span>
</div>
</nav>

</div>
 </>
 );
}
