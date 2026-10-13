import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminPage() {
 return (
 <>
 <style dangerouslySetInnerHTML={{__html: ` .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; } .squish-shadow { box-shadow: 8px 8px 20px rgba(154, 68, 45, 0.12), -8px -8px 20px rgba(255, 255, 255, 0.8), inset 2px 2px 5px rgba(255, 255, 255, 0.5); } .sunken-shadow { box-shadow: inset 6px 6px 12px rgba(154, 68, 45, 0.08), inset -6px -6px 12px rgba(255, 255, 255, 0.9); } .pillow-lift { box-shadow: 0 20px 40px -10px rgba(154, 68, 45, 0.15); } `}} />
 <div className="bg-background font-body text-on-background selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden pb-32">

{/* TopAppBar */}
<header className="fixed top-0 w-full z-50 bg-[#fdfae7]/80 backdrop-blur-xl flex items-center justify-between px-6 h-20 w-full no-border shadow-[0_10px_30px_-10px_rgba(154,68,45,0.1)]">
<div className="flex items-center gap-4">
<div className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-high text-primary hover:scale-105 transition-transform duration-300 active:scale-95">
<span className="material-symbols-outlined" data-icon="grid_view">grid_view</span>
</div>
<h1 className="text-2xl font-black text-[#9a442d] tracking-tighter font-headline">AccessMap</h1>
</div>
<div className="w-10 h-10 rounded-full bg-primary-container overflow-hidden shadow-inner hover:scale-105 transition-transform duration-300">
<img alt="Admin profile" className="w-full h-full object-cover" data-alt="close-up portrait of a professional administrator with a warm and welcoming expression, soft studio lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeiJSQLEOCAWhlt-lGl33jIc3fF10hjPxRLKONLzP-Uqc4GvVbMRmzYpacV8_3s33xLcCo7O1LlQfuu5aFnNp_98of1cmEalI8vlvenNCDHOjBaxR0erGIxVCqvaPtKWm33KDr0vu-do91WEaPhh-XmT-_5jbSrcZaXp-zUc5FCI1GUJ2ThppjLZW7zrG30JVP1qFe9jIQ5JJPvAdfe3AEoZiYsUslkR_4UyKyeJnz6hjgABn_x9x_CbnOma15bxLH90L1fhE0aJ0i"/>
</div>
</header>
<main className="mt-24 px-6 space-y-10">
{/* Welcome Hero Section */}
<section className="space-y-2">
<p className="text-on-surface-variant font-medium text-sm tracking-widest uppercase">Dashboard</p>
<h2 className="font-headline text-4xl text-primary font-extrabold tracking-tight leading-none">Admin Central</h2>
</section>
{/* Hero Metrics: Embossed Clay Pills */}
<section className="grid grid-cols-1 gap-6">
{/* Metric 1 */}
<div className="bg-surface-container-lowest squish-shadow rounded-full p-6 flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
<div className="flex items-center gap-4">
<div className="w-14 h-14 rounded-full sunken-shadow bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-3xl" data-icon="pending_actions">pending_actions</span>
</div>
<div>
<p className="text-on-surface-variant text-sm font-semibold">Pending Submissions</p>
<p className="text-3xl font-headline font-black text-primary">128</p>
</div>
</div>
<div className="text-secondary font-bold bg-secondary-container/30 px-4 py-2 rounded-full text-xs">
 +12%
 </div>
</div>
{/* Metric 2 */}
<div className="bg-surface-container-lowest squish-shadow rounded-full p-6 flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
<div className="flex items-center gap-4">
<div className="w-14 h-14 rounded-full sunken-shadow bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-3xl" data-icon="verified_user" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
</div>
<div>
<p className="text-on-surface-variant text-sm font-semibold">Verified Locations</p>
<p className="text-3xl font-headline font-black text-primary">2,405</p>
</div>
</div>
<div className="text-primary font-bold bg-primary-container/20 px-4 py-2 rounded-full text-xs">
 Growth
 </div>
</div>
{/* Metric 3 */}
<div className="bg-surface-container-lowest squish-shadow rounded-full p-6 flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
<div className="flex items-center gap-4">
<div className="w-14 h-14 rounded-full sunken-shadow bg-surface-container flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-3xl" data-icon="report">report</span>
</div>
<div>
<p className="text-on-surface-variant text-sm font-semibold">User Reports</p>
<p className="text-3xl font-headline font-black text-primary">42</p>
</div>
</div>
<div className="text-on-error-container font-bold bg-error-container/40 px-4 py-2 rounded-full text-xs">
 Action
 </div>
</div>
</section>
{/* Main Content: Location Submissions Grid */}
<section className="space-y-6">
<div className="flex items-center justify-between">
<h3 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">Recent Submissions</h3>
<button className="text-primary font-bold text-sm hover:underline">View All</button>
</div>
{/* Location Card 1 */}
<div className="bg-surface-container-lowest rounded-xl p-5 pillow-lift space-y-4 relative overflow-hidden">
<div className="flex justify-between items-start">
<div className="flex gap-4">
<div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container shadow-inner">
<img alt="Restaurant interior" className="w-full h-full object-cover" data-alt="interior of a modern accessible cafe with ramp entrance and wide aisles, warm natural lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl8Cm24jhlONiu2W479eCzrjKUO-8l2RYuQTgoD6Kkx66N3Jzy2HHGlLcBZJINBM_4vB-lMEK0LrSMpTaQQ0UrrmhBGbDxyQOJk7COS_QpIR_mzLLVTVx8Wf-V0rj0MQRBfxpKmSOWTtwty_QQid0p9dISrL3ORz_9naORrW4TvJHTQ09lDjKYC4WXyUq4xHf0XTFrww2pKHhXcOc7X9szIHOr8b7RijlIQtq8wQgQNEHMNJ1QMAsWLRGQIWAW69LY99jYB8LqKC50"/>
</div>
<div>
<h4 className="font-bold text-lg text-primary">The Golden Griddle</h4>
<p className="text-sm text-on-surface-variant">Seattle, Downtown</p>
<div className="flex gap-1 mt-1">
<span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Ramp</span>
<span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Wide Doors</span>
</div>
</div>
</div>
<div className="w-8 h-8 rounded-full sunken-shadow flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-xl" data-icon="more_vert">more_vert</span>
</div>
</div>
<div className="flex gap-3">
<button className="flex-1 bg-primary text-white font-bold py-3 rounded-full shadow-[0_8px_15px_rgba(154,68,45,0.3)] active:scale-95 transition-transform">Verify</button>
<button className="flex-1 sunken-shadow bg-surface-container-low text-on-surface-variant font-bold py-3 rounded-full active:scale-95 transition-transform text-sm">Review</button>
</div>
</div>
{/* Location Card 2 */}
<div className="bg-surface-container-lowest rounded-xl p-5 pillow-lift space-y-4 relative overflow-hidden">
<div className="flex justify-between items-start">
<div className="flex gap-4">
<div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container shadow-inner">
<img alt="University campus" className="w-full h-full object-cover" data-alt="accessible campus courtyard with tactile paving and clear signage, bright daylight, high quality architectural photography" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmRidVQ0JuyUI-kan1o5j9O6xR24IDzm6u0C3cRziEwSTRwyAaA9C-qyANzho5drLb5OUXzitJxk1u-nFgR0A8E3oOlTPFR_j8Qg0I_IOrKb59UcWLORn5QT_8isG_UrwFfJ-gof00Gv6YHJWsJ6o1WiR7sP-HsbPzIKr0xwnpYWnTg8sEXTKbvz9UTXwECODKgiuoTZG7mRabxVx32AOtDHkhIiF5SRb3cpGWbgJLnqm-fjRpAxAGCz4tpgwtHwIbJgd3Gi63oajf"/>
</div>
<div>
<h4 className="font-bold text-lg text-primary">Central Tech Library</h4>
<p className="text-sm text-on-surface-variant">Portland, East Side</p>
<div className="flex gap-1 mt-1">
<span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Elevator</span>
<span className="bg-secondary-container text-on-secondary-fixed-variant text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Braille</span>
</div>
</div>
</div>
<div className="w-8 h-8 rounded-full sunken-shadow flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-xl" data-icon="more_vert">more_vert</span>
</div>
</div>
<div className="flex gap-3">
<button className="flex-1 bg-primary text-white font-bold py-3 rounded-full shadow-[0_8px_15px_rgba(154,68,45,0.3)] active:scale-95 transition-transform">Verify</button>
<button className="flex-1 sunken-shadow bg-surface-container-low text-on-surface-variant font-bold py-3 rounded-full active:scale-95 transition-transform text-sm">Review</button>
</div>
</div>
{/* Digital Map Preview (Asymmetric Feature) */}
<div className="bg-surface-container rounded-xl overflow-hidden pillow-lift relative h-48 group">
<div className="absolute inset-0 z-0">
<img alt="Abstract map pattern" className="w-full h-full object-cover opacity-60" data-alt="minimalist topographical map design with organic lines and warm earthy tones, soft vector aesthetic" data-location="Seattle" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLKqOCu26MYV7mhaTebORi4jg-ME30A0E9K1FqLIygTMQc4Um1GFlJS7rMBjictvgzKYXjDZMNPeEus3MJG5TmtJowVoLWTCK5DMSxtXH1gGNIgPXmuuwHx1mdY-AngpYI5Kf3kEreF1mWL_sOdf4_ZBmEwGURRV_8gBfUlZ8d6LIqVwb9T5zjuf4wQbDnm1WohckFRlOge9wtXZv_MsuNlmDELgbNtN8xhJIUjpNYaMHYxMClxGwii9W38I5B5RpqR71Q4VX5ziM5"/>
</div>
<div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent opacity-80"></div>
<div className="relative z-10 p-6 flex flex-col justify-end h-full">
<p className="text-primary font-black font-headline text-xl">Interactive Coverage</p>
<p className="text-on-surface-variant text-sm font-medium">85% of Downtown Mapped</p>
</div>
<div className="absolute top-4 right-4 z-20 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-primary">
<span className="material-symbols-outlined" data-icon="map">map</span>
</div>
</div>
</section>
</main>
{/* Navigation Drawer (Hidden on mobile per rules, but prepared for responsive logic) */}
{/* (Suppressed for mobile focus as requested by task) */}
{/* BottomNavBar */}
<nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] rounded-full bg-[#fdfae7]/90 backdrop-blur-lg flex md:hidden justify-around items-center px-4 py-3 z-50 no-border shadow-[0_20px_40px_rgba(154,68,45,0.15)]">
{/* Active Tab: Overview (Dashboard) */}
<a className="flex items-center justify-center bg-[#9a442d] text-white rounded-full w-14 h-14 shadow-[0_8px_15px_rgba(154,68,45,0.3)] scale-110 active:scale-90 duration-200" href="#">
<span className="material-symbols-outlined" data-icon="dashboard" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
</a>
<a className="flex items-center justify-center text-[#55423e] w-12 h-12 hover:bg-[#ece9d6] rounded-full transition-all active:scale-90 duration-200" href="#">
<span className="material-symbols-outlined" data-icon="analytics">analytics</span>
</a>
<a className="flex items-center justify-center text-[#55423e] w-12 h-12 hover:bg-[#ece9d6] rounded-full transition-all active:scale-90 duration-200" href="#">
<span className="material-symbols-outlined" data-icon="group">group</span>
</a>
<a className="flex items-center justify-center text-[#55423e] w-12 h-12 hover:bg-[#ece9d6] rounded-full transition-all active:scale-90 duration-200" href="#">
<span className="material-symbols-outlined" data-icon="map">map</span>
</a>
<a className="flex items-center justify-center text-[#55423e] w-12 h-12 hover:bg-[#ece9d6] rounded-full transition-all active:scale-90 duration-200" href="#">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
</a>
</nav>
{/* FAB for quick action (Highly contextual) */}
<div className="fixed bottom-24 right-6 z-40">
<button className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95">
<span className="material-symbols-outlined text-3xl" data-icon="add">add</span>
</button>
</div>

</div>
 </>
 );
}
