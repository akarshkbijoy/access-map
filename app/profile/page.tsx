import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProfilePage() {
 return (
 <>
 <style dangerouslySetInnerHTML={{__html: ` .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; } .clay-embossed { box-shadow: 12px 12px 24px #e2d8d1, -12px -12px 24px #ffffff; } .clay-pressed { box-shadow: inset 6px 6px 12px #d1c8c1, inset -6px -6px 12px #ffffff; } .badge-depth { filter: drop-shadow(4px 4px 8px rgba(31, 27, 23, 0.15)); } `}} />
 <div className="bg-surface font-body text-on-surface selection:bg-secondary-container">

{/* Top Navigation Shell */}
<header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 w-full bg-[#fff8f4]/70 /70 backdrop-blur-md shadow-[0_24px_48px_rgba(31,27,23,0.05)] bg-gradient-to-b from-[#fcf2ea] to-transparent">
<h1 className="text-2xl font-black text-[#9d3e1d] #d66844] tracking-tighter font-['Plus_Jakarta_Sans']">AccessMap</h1>
<div className="flex items-center gap-4">
<button className="text-[#53643b] font-label text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform">Sign Out</button>
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white shadow-sm border-2 border-surface">
<span className="material-symbols-outlined">person</span>
</div>
</div>
</header>
<main className="pt-24 pb-32 px-6 max-w-md mx-auto">
{/* Profile Header Section */}
<section className="flex flex-col items-center mb-12">
{/* Embossed Avatar */}
<div className="relative mb-6">
<div className="w-40 h-40 rounded-full clay-embossed bg-surface-container flex items-center justify-center p-3 border-8 border-surface">
<div className="w-full h-full rounded-full overflow-hidden bg-surface-dim">
<img className="w-full h-full object-cover" data-alt="close-up portrait of a friendly man with glasses smiling outdoors in soft natural morning light, high detail" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBWcnDRb3gv_on0jYWfOz1QOdDNfvq817ki8slvsqx48HY547RHIhuuqZN6AjXyRA5Zj-66iQF_i5roHolxyw_LuwnU_u3_32rbuzUm7ot-yRdsNuSTAyV-8dAtkdp9CssBBiqDBL_rnwCJuIsBlbIjqE9SoTy61fOZVVJZIPrkpV2xajnfbX-ENJVUSmC2fCSIj7tsjnPcGQVPzayZGjIGlryWhc1EkeOPOWNLTuANYJXNZznIG48YpgmAcSPd0eRJjrd0bq8o7xZ"/>
</div>
</div>
<div className="absolute bottom-2 right-2 w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center shadow-lg border-4 border-surface text-on-secondary-container">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
</div>
</div>
{/* Identity */}
<div className="text-center space-y-2">
<h2 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Alex Sterling</h2>
<p className="text-on-surface-variant font-medium leading-relaxed px-4">
 Accessibility advocate and urban explorer. Mapping the world, one ramp at a time.
 </p>
</div>
</section>
{/* Achievement Badges (Horizontal Scroll) */}
<section className="mb-12">
<h3 className="font-label text-xs font-bold uppercase tracking-widest text-[#53643b] mb-6 px-2">Achievement Badges</h3>
<div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar -mx-6 px-6">
{/* Badge 1 */}
<div className="flex-shrink-0 flex flex-col items-center gap-3">
<div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ffd700] to-[#b8860b] flex items-center justify-center badge-depth border-4 border-white/20">
<span className="material-symbols-outlined text-4xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
</div>
<span className="font-label text-[10px] font-bold uppercase text-on-surface-variant">Top Contributor</span>
</div>
{/* Badge 2 */}
<div className="flex-shrink-0 flex flex-col items-center gap-3">
<div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#c0c0c0] to-[#708090] flex items-center justify-center badge-depth border-4 border-white/20">
<span className="material-symbols-outlined text-4xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
</div>
<span className="font-label text-[10px] font-bold uppercase text-on-surface-variant">Map Master</span>
</div>
{/* Badge 3 */}
<div className="flex-shrink-0 flex flex-col items-center gap-3">
<div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#cd7f32] to-[#8b4513] flex items-center justify-center badge-depth border-4 border-white/20">
<span className="material-symbols-outlined text-4xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
</div>
<span className="font-label text-[10px] font-bold uppercase text-on-surface-variant">Community Guide</span>
</div>
</div>
</section>
{/* Saved Waypoints (Pressed Buttons) */}
<section className="mb-12">
<h3 className="font-label text-xs font-bold uppercase tracking-widest text-[#53643b] mb-6 px-2">Saved Waypoints</h3>
<div className="grid gap-4">
<button className="w-full flex items-center gap-4 p-5 rounded-xl clay-pressed bg-surface-container-low active:scale-95 transition-all text-left">
<div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
<span className="material-symbols-outlined">library_books</span>
</div>
<div className="flex-1">
<span className="block font-bold text-on-surface">Central Library</span>
<span className="text-xs text-on-surface-variant font-medium">Full ramp access • 2.4 miles</span>
</div>
<span className="material-symbols-outlined text-outline">chevron_right</span>
</button>
<button className="w-full flex items-center gap-4 p-5 rounded-xl clay-pressed bg-surface-container-low active:scale-95 transition-all text-left">
<div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
<span className="material-symbols-outlined">park</span>
</div>
<div className="flex-1">
<span className="block font-bold text-on-surface">City Botanical Garden</span>
<span className="text-xs text-on-surface-variant font-medium">Sensory paths • 0.8 miles</span>
</div>
<span className="material-symbols-outlined text-outline">chevron_right</span>
</button>
<button className="w-full flex items-center gap-4 p-5 rounded-xl clay-pressed bg-surface-container-low active:scale-95 transition-all text-left">
<div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
<span className="material-symbols-outlined">subway</span>
</div>
<div className="flex-1">
<span className="block font-bold text-on-surface">Metro Station A</span>
<span className="text-xs text-on-surface-variant font-medium">Elevator functioning • 1.1 miles</span>
</div>
<span className="material-symbols-outlined text-outline">chevron_right</span>
</button>
</div>
</section>
{/* Account Actions */}
<section className="mb-8">
<h3 className="font-label text-xs font-bold uppercase tracking-widest text-[#53643b] mb-6 px-2">Account Control</h3>
<div className="flex flex-col gap-3">
<button className="flex items-center justify-between w-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold py-5 px-6 rounded-xl transition-all active:shadow-inner hover:scale-[1.02]">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined">settings</span>
<span>Profile Settings</span>
</div>
<span className="material-symbols-outlined">arrow_forward</span>
</button>
<button className="flex items-center justify-between w-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-bold py-5 px-6 rounded-xl transition-all active:shadow-inner hover:scale-[1.02]">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined">lock</span>
<span>Privacy</span>
</div>
<span className="material-symbols-outlined">arrow_forward</span>
</button>
<button className="flex items-center justify-between w-full bg-secondary-container text-on-secondary-container font-bold py-5 px-6 rounded-xl transition-all active:shadow-inner hover:scale-[1.02]">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
<span>Notifications</span>
</div>
<div className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">3 NEW</div>
</button>
</div>
</section>
{/* Log Out / Danger Zone */}
<button className="w-full text-center py-4 text-primary font-bold hover:underline opacity-60 hover:opacity-100 transition-opacity">
 Delete Account
 </button>
</main>
{/* Bottom Navigation Shell */}
<nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-8 pt-4 bg-[#fff8f4]/80 /80 backdrop-blur-xl shadow-[0_-20px_40px_rgba(31,27,23,0.08)] rounded-t-[3rem] z-50">
<a className="flex flex-col items-center justify-center text-[#53643b] opacity-70 hover:opacity-100 hover:translate-y-[-2px] transition-all" href="#">
<span className="material-symbols-outlined" data-icon="explore">explore</span>
<span className="font-['Be_Vietnam_Pro'] text-[11px] font-bold uppercase tracking-widest mt-1">Explore</span>
</a>
<a className="flex flex-col items-center justify-center text-[#53643b] opacity-70 hover:opacity-100 hover:translate-y-[-2px] transition-all" href="#">
<span className="material-symbols-outlined" data-icon="bookmark">bookmark</span>
<span className="font-['Be_Vietnam_Pro'] text-[11px] font-bold uppercase tracking-widest mt-1">Saved</span>
</a>
<a className="flex flex-col items-center justify-center text-[#53643b] opacity-70 hover:opacity-100 hover:translate-y-[-2px] transition-all" href="#">
<span className="material-symbols-outlined" data-icon="add_circle">add_circle</span>
<span className="font-['Be_Vietnam_Pro'] text-[11px] font-bold uppercase tracking-widest mt-1">Add</span>
</a>
<a className="flex flex-col items-center justify-center bg-[#f1e6df] text-[#9d3e1d] rounded-[2rem] px-6 py-2 shadow-inner scale-105" href="#">
<span className="material-symbols-outlined" data-icon="person" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
<span className="font-['Be_Vietnam_Pro'] text-[11px] font-bold uppercase tracking-widest mt-1">Profile</span>
</a>
</nav>

</div>
 </>
 );
}
