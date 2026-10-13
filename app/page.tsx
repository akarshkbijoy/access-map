import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HomeSearchBar from '@/components/HomeSearchBar';
import CommunityVoices from '@/components/CommunityVoices';

export default function HomePage() {
 return (
 <>
 <style dangerouslySetInnerHTML={{__html: ` .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; } .pillow-shadow { box-shadow: 0 40px 40px -5px rgba(154, 68, 45, 0.08), inset 2px 2px 4px rgba(255, 255, 255, 0.4); } .molded-inner { box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.05), inset -4px -4px 8px rgba(255, 255, 255, 0.8); } .convex-card { background: linear-gradient(145deg, #ffffff, #f7f4e1); } .squishy-button { box-shadow: 0 8px 15px rgba(154, 68, 45, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); } .squishy-button:active { transform: scale(0.95) translateY(2px); box-shadow: 0 2px 5px rgba(154, 68, 45, 0.1), inset 0 4px 6px rgba(0, 0, 0, 0.1); } .embossed-utility { box-shadow: inset 2px 2px 5px rgba(0,0,0,0.05), 2px 2px 4px rgba(255,255,255,0.8); } `}} />
 <div className="bg-surface font-body text-on-surface min-h-screen pb-32">

{/* TopAppBar */}
<header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center max-w-7xl mx-auto rounded-full mt-4 mx-4 px-6 py-3 bg-[#fdfae7] shadow-xl no-border shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_10px_20px_rgba(154,68,45,0.05)]">
<div className="text-2xl font-black text-[#9a442d] #e07a5f] font-['Plus_Jakarta_Sans'] tracking-tight">AccessMap</div>
<nav className="hidden md:flex gap-4 items-center font-['Plus_Jakarta_Sans'] font-bold tracking-tight">
<Link className="text-[#55423e] hover:text-[#9a442d] transition-colors cursor-pointer transition-transform hover:scale-105 active:scale-95" href="/map">Map</Link>
<Link className="text-[#9a442d] bg-[#f7f4e1] rounded-full px-4 py-1 shadow-inner cursor-pointer transition-transform hover:scale-105 active:scale-95" href="/profile">Community</Link>
<Link className="text-[#55423e] hover:text-[#9a442d] transition-colors cursor-pointer transition-transform hover:scale-105 active:scale-95" href="#">Features</Link>
<Link className="text-[#55423e] hover:text-[#9a442d] transition-colors cursor-pointer transition-transform hover:scale-105 active:scale-95" href="/about">About</Link>
</nav>
<div className="flex items-center gap-3">
<Link href="/login" className="hidden sm:inline-block text-[#9a442d] font-bold px-4 py-2 rounded-full embossed-utility hover:bg-[#f7f4e1] transition-all">Sign In</Link>
<Link href="/register" className="bg-primary text-on-primary rounded-full px-8 py-2 font-bold squishy-button inline-block">Register</Link>
</div>
</header>
<main className="pt-28 px-6 max-w-7xl mx-auto">
{/* Hero Map Section */}
<section className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden shadow-2xl p-4 bg-surface-container-high pillow-shadow border-8 border-surface-container-low">
<div className="w-full h-full rounded-lg overflow-hidden relative">
<img alt="Accessibility focused topographic map" className="w-full h-full object-cover grayscale-[10%] sepia-[20%] opacity-90" data-alt="Stylized map showing accessible paths and barrier-free zones with soft green and clay-colored textures" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDULHGyiZiQSdmaAgPuZwckcysDEpPBuhnRPg1CzZr_lxfvl-KH3NhjRLnuuY1EgcrSmBeeQEw4EASJ96tIRoMXXoUOFxuQrDMY1tnf6rHcnWJVI7F5TEtLMAqv2n9fyFm8X1hHHHOn9dm1UdhTyqrCRCobj65XAKaXwRBu9vYINfDlydE8IVo3eHcVp5-gnqFtPcQ6lxHoBhzf1m8aze4UQ7EY_y2jj7CitlxP0YutScyb9DZXRYfKX9YQxaVckQO-gbw6HD7cYUFm"/>
{/* Hero Search & Action Center */}
<div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent via-transparent to-surface/20">
<HomeSearchBar />
{/* Overlapping Hero Buttons */}
<div className="flex flex-col sm:flex-row gap-8 relative mt-4">
<Link href="/map" className="bg-[#9c3d2a] hover:bg-[#8c3220] transition-colors text-[#ffefec] rounded-full px-10 py-5 font-bold text-xl z-20 text-center inline-block">
 Explore Map
 </Link>
<Link href="/add" className="bg-[#ff7a2e] hover:bg-[#ee6d21] transition-colors text-[#401600] rounded-full px-10 py-5 font-bold text-xl z-10 mt-2 sm:mt-0 text-center inline-block">
 Contribute a Location
 </Link>
</div>
</div>
{/* Floating Accessibility Markers Removed per requested cleanup */}
</div>
</section>
{/* Primary Content Area */}
<div className="mt-20">
<div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
<div className="max-w-2xl">
<h1 className="text-6xl font-headline font-extrabold text-primary leading-tight tracking-tighter">Discover Barrier-Free<br/>Spaces Online!</h1>
<p className="text-xl text-on-surface-variant mt-4 font-body leading-relaxed">We're molding a world where everyone can move freely. Explore locations with tactile precision and community-verified accessibility data.</p>
</div>
<div className="flex gap-4">
<details className="relative z-30 group">
  <summary className="bg-[#f7f4e1] text-[#9a442d] rounded-full px-6 py-3 font-bold flex items-center gap-2 squishy-button cursor-pointer list-none select-none border-2 border-[#9a442d] hover:bg-[#9a442d]/10 transition-colors">
    <span className="material-symbols-outlined" data-icon="filter_alt">filter_alt</span>
    Available Features
  </summary>
  <div className="absolute top-full mt-4 right-0 bg-white p-6 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] z-50 w-72 md:w-80 border-2 border-[#E4E9F0]">
    <h3 className="font-bold text-[#292928] mb-4 text-sm uppercase tracking-wider">Accessibility Data Monitored</h3>
    <ul className="space-y-3 text-[#55423E] font-medium text-sm">
      <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-md border border-[#c3f832] bg-[#c3f832]/20"></span>Wheelchair Accessible</li>
      <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-md border border-[#c3f832] bg-[#c3f832]/20"></span>Accessible Restrooms</li>
      <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-md border border-[#c3f832] bg-[#c3f832]/20"></span>Accessible Parking</li>
      <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-md border border-[#c3f832] bg-[#c3f832]/20"></span>Ramp Access</li>
      <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-md border border-[#c3f832] bg-[#c3f832]/20"></span>Elevator Access</li>
      <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-md border border-[#c3f832] bg-[#c3f832]/20"></span>Visual/Audio Assistance</li>
      <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-md border border-[#c3f832] bg-[#c3f832]/20"></span>Wide Doorways</li>
      <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-md border border-[#c3f832] bg-[#c3f832]/20"></span>Level Surfaces</li>
    </ul>
  </div>
</details>
</div>
</div>
{/* Asymmetric Bento Grid */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-8">
{/* Large Card - Accessibility Filters */}
<div className="md:col-span-8 group">
<div className="convex-card rounded-xl p-6 pillow-shadow transition-all duration-500 hover:scale-[1.01] flex flex-col h-full">
<div className="relative h-96 rounded-lg overflow-hidden mb-6">
<img alt="Global accessibility network map" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="/images/map-network.jpg"/>
<div className="absolute top-4 left-4 bg-[#9a442d]/90 backdrop-blur-md rounded-full px-4 py-2 font-bold text-white shadow-sm flex items-center gap-2">
<span className="material-symbols-outlined text-sm">accessible</span> Feature Tags
 </div>
</div>
<div className="flex justify-between items-start">
<div>
<h2 className="text-4xl font-headline font-bold text-on-surface">Comprehensive Accessibility Filters</h2>
<p className="text-on-surface-variant mt-2 flex items-center gap-2 leading-relaxed max-w-lg">
Discover inclusive venues with detailed tracking of wheelchair ramps, accessible restrooms, flat terrain, and specialized data curated by the community.
 </p>
</div>
<button className="w-16 h-16 rounded-full bg-[#9a442d] flex items-center justify-center text-white squishy-button shadow-md cursor-default pointer-events-none mt-2">
<span className="material-symbols-outlined" data-icon="filter_alt">filter_alt</span>
</button>
</div>
</div>
</div>
{/* Small Card 1 - Healthy Community */}
<div className="md:col-span-4 group">
<div className="convex-card rounded-xl p-6 pillow-shadow transition-all duration-500 hover:scale-[1.01] flex flex-col h-full border-t-4 border-primary/10">
<div className="relative h-64 rounded-lg overflow-hidden mb-6">
<img alt="Community center" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="/images/community-healthy.jpg"/>
</div>
<h3 className="text-2xl font-headline font-bold text-on-surface">Healthy Community</h3>
<p className="text-on-surface-variant mt-1 text-sm">Connect with others sharing accessibility tips and local favorites.</p>
<div className="mt-auto pt-6 flex gap-2">
<span className="bg-primary-container/30 text-on-primary-container px-4 py-1 rounded-full text-xs font-bold">Inclusive</span>
<span className="bg-primary-container/30 text-on-primary-container px-4 py-1 rounded-full text-xs font-bold">Social</span>
</div>
</div>
</div>
</div>
</div>

{/* Community Reviews Section */}
<CommunityVoices />

{/* Join the Movement Call to Action */}
<section className="mb-24 max-w-7xl mx-auto px-6">
  <div className="bg-[#9c3d2a] text-[#ffefec] rounded-2xl p-10 md:p-16 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 h-full">
    {/* Decorative Shapes */}
    <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-[#ffefec] rounded-full opacity-20 transform scale-150 border-4 border-[#ffefec]/40"></div>
    <div className="absolute -top-12 -left-12 w-48 h-48 bg-black rounded-full opacity-10 blur-xl"></div>
    
    <div className="relative z-10 max-w-2xl">
      <h2 className="text-5xl md:text-6xl font-headline font-extrabold leading-tight mb-4 tracking-tighter drop-shadow-sm">Join the Movement</h2>
      <p className="text-xl md:text-2xl text-[#f7f4e1] opacity-90 max-w-xl font-medium leading-relaxed">
        Help us map the world’s most accessible corners. Sign up today and start contributing your own barrier-free findings.
      </p>
    </div>
    
    <div className="relative z-10 w-full md:w-auto mt-6 md:mt-0 flex-shrink-0">
      <Link href="/login" className="bg-[#c3f832] text-[#292928] w-full md:w-auto px-10 py-5 rounded-full font-bold shadow-xl squishy-button flex items-center justify-center gap-2 text-xl hover:bg-[#b0df2c] transition-colors border-2 border-transparent hover:border-[#292928]">
        Start Mapping Now
        <span className="material-symbols-outlined font-black" data-icon="arrow_forward">arrow_forward</span>
      </Link>
    </div>
  </div>
</section>

</main>
{/* Footer */}
<footer className="w-full flex flex-col md:flex-row justify-between items-center gap-8 px-12 rounded-t-[4rem] p-12 mt-20 bg-[#ece9d6] no-border shadow-[inset_0_10px_20px_rgba(0,0,0,0.05)]">
<div className="flex flex-col gap-4">
<div className="font-['Plus_Jakarta_Sans'] font-bold text-[#9a442d] text-2xl">AccessMap</div>
<p className="font-['Be_Vietnam_Pro'] text-sm text-[#55423e]">© 2024 AccessMap Inc. Everyone deserves a path.</p>
</div>
<div className="flex-1 max-w-md w-full">
<div className="molded-inner bg-surface-container-highest rounded-full p-2 flex items-center border border-white/40">
<input className="bg-transparent border-none focus:ring-0 w-full px-6 text-on-surface-variant font-medium" placeholder="Get accessibility alerts" type="email"/>
<button className="bg-secondary text-white rounded-full p-4 hover:scale-105 transition-transform flex items-center justify-center">
<span className="material-symbols-outlined" data-icon="mail">mail</span>
</button>
</div>
</div>
<nav className="flex gap-8 font-['Be_Vietnam_Pro'] text-sm">
<a className="text-[#55423e] hover:text-[#e07a5f] underline-offset-4 hover:underline transition-colors" href="#">Accessibility</a>
<a className="text-[#55423e] hover:text-[#e07a5f] underline-offset-4 hover:underline transition-colors" href="#">Support</a>
<a className="text-[#55423e] hover:text-[#e07a5f] underline-offset-4 hover:underline transition-colors" href="#">Blog</a>
</nav>
</footer>
{/* BottomNavBar (Mobile Only) */}
<nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-4 bg-[#fdfae7]/80 /80 backdrop-blur-xl rounded-t-[3rem] h-24 no-border shadow-[0_-10px_30px_rgba(154,68,45,0.08)]">
<a className="flex flex-col items-center justify-center text-[#55423e] opacity-70 hover:opacity-100 hover:translate-y-[-2px]" href="#">
<span className="material-symbols-outlined" data-icon="map">map</span>
<span className="font-['Be_Vietnam_Pro'] text-xs font-semibold">Explore</span>
</a>
<a className="flex flex-col items-center justify-center bg-[#9a442d] text-white rounded-full w-16 h-16 -mt-8 shadow-lg transition-all duration-500 scale-110" href="#">
<span className="material-symbols-outlined" data-icon="add_location_alt">add_location_alt</span>
<span className="font-['Be_Vietnam_Pro'] text-xs font-semibold">Contribute</span>
</a>
<a className="flex flex-col items-center justify-center text-[#55423e] opacity-70 hover:opacity-100 hover:translate-y-[-2px]" href="#">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span className="font-['Be_Vietnam_Pro'] text-xs font-semibold">Social</span>
</a>
<a className="flex flex-col items-center justify-center text-[#55423e] opacity-70 hover:opacity-100 hover:translate-y-[-2px]" href="#">
<span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
<span className="font-['Be_Vietnam_Pro'] text-xs font-semibold">Me</span>
</a>
</nav>

</div>
 </>
 );
}
