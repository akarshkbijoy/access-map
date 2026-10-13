import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';

async function getStats(): Promise<{ locationCount: number; userCount: number; citiesCount: number } | null> {
  try {
    const [locationCount, userCount, locations] = await Promise.all([
      prisma.lOCATION.count(),
      prisma.aPP_USER.count(),
      prisma.lOCATION.findMany({
        select: { address: true },
        where: { address: { not: null } },
      }),
    ]);

    // Extract unique cities from addresses (take last meaningful part as city)
    const cities = new Set<string>();
    for (const loc of locations) {
      if (loc.address) {
        const parts = loc.address.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          cities.add(parts[parts.length - 2].toLowerCase());
        } else if (parts.length === 1) {
          cities.add(parts[0].toLowerCase());
        }
      }
    }

    return { locationCount, userCount, citiesCount: cities.size };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return null;
  }
}

export default async function AboutPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#fbfbe2] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl p-10 shadow-[0px_20px_40px_rgba(86,67,56,0.08)]">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#ffdad6] rounded-full flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" fill="#9f393b"/>
              </svg>
            </div>
            <h1 className="font-black text-2xl text-[#564338] mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>Weak Network</h1>
            <p className="text-[#564338]/70 text-base mb-8 leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Unable to retrieve data from database. Please check your internet connection and try again.
            </p>
            <a
              href="/about"
              className="inline-block bg-[#9f393b] text-white px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wider hover:scale-105 transition-transform active:scale-95"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Retry
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { locationCount, userCount, citiesCount } = stats;

  return (
 <>
 <style dangerouslySetInnerHTML={{__html: ` .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; } .clay-card { box-shadow: 0px 20px 40px rgba(86, 67, 56, 0.08); } .debossed-well { box-shadow: inset 2px 4px 8px rgba(27, 29, 14, 0.12); } .text-shadow-soft { text-shadow: 0 2px 4px rgba(86, 67, 56, 0.1); } .stat-orb { transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); } .stat-orb:hover { transform: scale(1.08); } `}} />
 <div className="bg-surface text-on-surface font-body selection:bg-secondary-container">

{/* TopAppBar */}
<nav className="bg-[#fbfbe2]/70 /70 backdrop-blur-xl docked full-width top-0 sticky z-50 shadow-[0px_20px_40px_rgba(86,67,56,0.08)]">
<div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-[#9f393b] text-2xl" data-icon="map">map</span>
<span className="text-2xl font-black text-[#564338] #fbfbe2] tracking-tighter font-headline">AccessMap</span>
</div>
<div className="hidden md:flex gap-8 items-center">
<a className="text-[#564338]/60 #fbfbe2]/60 font-['Manrope'] font-semibold uppercase tracking-wider text-[11px] hover:scale-105 transition-transform duration-300" href="#">Home</a>
<a className="text-[#564338]/60 #fbfbe2]/60 font-['Manrope'] font-semibold uppercase tracking-wider text-[11px] hover:scale-105 transition-transform duration-300" href="#">Explore</a>
<a className="text-[#9f393b] font-bold font-['Manrope'] font-semibold uppercase tracking-wider text-[11px] hover:scale-105 transition-transform duration-300" href="#">Info</a>
<a className="text-[#564338]/60 #fbfbe2]/60 font-['Manrope'] font-semibold uppercase tracking-wider text-[11px] hover:scale-105 transition-transform duration-300" href="#">Profile</a>
</div>
<button className="bg-primary text-on-primary px-6 py-2 rounded-full font-label font-bold text-[11px] uppercase tracking-wider hover:scale-105 transition-transform active:shadow-inner active:scale-95">
 Sign In
 </button>
</div>
</nav>
<main className="relative overflow-hidden">
{/* Hero Section */}
<section className="relative px-6 pt-12 pb-24 overflow-hidden">
<div className="max-w-md mx-auto relative z-10 text-center">
<span className="inline-block bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] mb-6">Our Vision</span>
<h1 className="font-headline font-black text-5xl leading-[1.1] tracking-tight text-on-surface mb-6 text-shadow-soft">
 Barrier-Free Navigation
 </h1>
<p className="text-on-surface-variant text-lg leading-relaxed font-medium mb-10">
 Our mission is to map the world's most accessible corners, making every journey possible for everyone.
 </p>
<button className="bg-primary text-on-primary rounded-full px-11 py-5 font-bold shadow-[0px_10px_25px_rgba(159,57,59,0.3)] hover:scale-105 transition-transform active:shadow-inner active:scale-95">
 Start Exploring
 </button>
</div>
{/* Decorative "Squishy" Elements */}
<div className="absolute -right-12 top-20 w-48 h-48 bg-tertiary-container/20 rounded-full blur-3xl"></div>
<div className="absolute -left-12 bottom-10 w-64 h-64 bg-secondary-container/30 rounded-full blur-3xl"></div>
</section>
{/* Our Process Section */}
<section className="px-6 py-12 bg-surface-container-low rounded-t-[3rem]">
<div className="max-w-md mx-auto">
<div className="flex items-center justify-between mb-12">
<h2 className="font-headline font-black text-3xl tracking-tight">Our Process</h2>
<span className="material-symbols-outlined text-primary text-3xl" data-icon="route">route</span>
</div>
<div className="space-y-8">
{/* Process Card 1 */}
<div className="bg-surface-bright p-8 rounded-lg clay-card relative overflow-hidden group">
<div className="flex items-start gap-6">
<div className="bg-surface-container-highest w-14 h-14 rounded-full flex items-center justify-center debossed-well shrink-0">
<span className="material-symbols-outlined text-on-surface" data-icon="verified_user">verified_user</span>
</div>
<div>
<h3 className="font-headline font-extrabold text-xl mb-2">Verification</h3>
<p className="text-on-surface-variant font-medium text-sm leading-relaxed">
 Every location is cross-referenced with accessibility standards to ensure absolute accuracy.
 </p>
</div>
</div>
</div>
{/* Process Card 2 */}
<div className="bg-surface-bright p-8 rounded-lg clay-card relative overflow-hidden group">
<div className="flex items-start gap-6">
<div className="bg-surface-container-highest w-14 h-14 rounded-full flex items-center justify-center debossed-well shrink-0">
<span className="material-symbols-outlined text-on-surface" data-icon="rate_review">rate_review</span>
</div>
<div>
<h3 className="font-headline font-extrabold text-xl mb-2">Review</h3>
<p className="text-on-surface-variant font-medium text-sm leading-relaxed">
 Our specialists manually review site photos and structural data points for quality assurance.
 </p>
</div>
</div>
</div>
{/* Process Card 3 */}
<div className="bg-surface-bright p-8 rounded-lg clay-card relative overflow-hidden group">
<div className="flex items-start gap-6">
<div className="bg-surface-container-highest w-14 h-14 rounded-full flex items-center justify-center debossed-well shrink-0">
<span className="material-symbols-outlined text-on-surface" data-icon="groups">groups</span>
</div>
<div>
<h3 className="font-headline font-extrabold text-xl mb-2">Community Feedback</h3>
<p className="text-on-surface-variant font-medium text-sm leading-relaxed">
 Live updates from our users keep the map current with real-time accessibility status changes.
 </p>
</div>
</div>
</div>
</div>
</div>
</section>
{/* Impact in Numbers Section — Fixed Layout */}
<section className="px-6 py-24 bg-surface">
<div className="max-w-lg mx-auto">
<h2 className="font-headline font-black text-3xl tracking-tight mb-12 text-center">Impact in Numbers</h2>
<div className="grid grid-cols-3 gap-6 justify-items-center">
  {/* Locations Mapped */}
  <div className="bg-secondary-container w-36 h-36 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center text-center p-4 clay-card stat-orb">
    <span className="font-headline font-black text-3xl md:text-4xl text-on-secondary-container">{locationCount}</span>
    <span className="font-label font-bold text-[10px] uppercase tracking-wider text-on-secondary-container mt-1">Locations Mapped</span>
  </div>
  {/* Active Users */}
  <div className="bg-tertiary-container w-36 h-36 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center text-center p-4 shadow-[0px_15px_30px_rgba(156,62,43,0.2)] stat-orb">
    <span className="font-headline font-black text-3xl md:text-4xl text-black">{userCount}</span>
    <span className="font-label font-bold text-[10px] uppercase tracking-wider text-black mt-1">Active Users</span>
  </div>
  {/* Cities Covered */}
  <div className="bg-primary-container w-36 h-36 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center text-center p-4 clay-card stat-orb">
    <span className="font-headline font-black text-3xl md:text-4xl text-black">{citiesCount}</span>
    <span className="font-label font-bold text-[10px] uppercase tracking-wider text-black mt-1">Cities Covered</span>
  </div>
</div>
</div>
</section>
{/* Aesthetic Brand Moment */}
<section className="px-6 pb-32">
<div className="bg-surface-container-highest rounded-xl p-8 debossed-well text-center">
<h4 className="font-headline font-black text-2xl mb-4">Ready to Join Us?</h4>
<p className="text-on-surface-variant font-medium mb-8">Download AccessMap and start contributing to the world's most inclusive map today.</p>
<div className="flex flex-col gap-4">
<button className="bg-inverse-surface text-inverse-on-surface py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95">
<span className="material-symbols-outlined" data-icon="download" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
 App Store
 </button>
<button className="bg-surface-bright text-on-surface py-4 rounded-full font-bold border-outline-variant/20 border-2 hover:scale-105 transition-transform active:scale-95">
 Volunteer Program
 </button>
</div>
</div>
</section>
</main>
{/* BottomNavBar */}
<nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-20 px-4 md:hidden">
<div className="bg-[#fbfbe2]/80 /80 backdrop-blur-2xl rounded-full mb-6 mx-auto w-[90%] max-w-md flex justify-around items-center h-16 shadow-[0px_20px_40px_rgba(86,67,56,0.12)]">
<a className="text-[#564338] #fbfbe2] p-3 hover:bg-[#fbfbe2] :bg-stone-700 transition-colors" href="#">
<span className="material-symbols-outlined" data-icon="home">home</span>
</a>
<a className="text-[#564338] #fbfbe2] p-3 hover:bg-[#fbfbe2] :bg-stone-700 transition-colors" href="#">
<span className="material-symbols-outlined" data-icon="explore">explore</span>
</a>
<a className="bg-[#d7ec95] #4a5d23] text-[#1b1d0e] rounded-full p-3 shadow-inner scale-90 duration-200" href="#">
<span className="material-symbols-outlined" data-icon="info">info</span>
</a>
<a className="text-[#564338] #fbfbe2] p-3 hover:bg-[#fbfbe2] :bg-stone-700 transition-colors" href="#">
<span className="material-symbols-outlined" data-icon="person">person</span>
</a>
</div>
</nav>

</div>
 </>
 );
}
