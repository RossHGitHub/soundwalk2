// pages/Gigs.tsx
"use client";
import { useEffect, useState } from "react";
import { GigList } from "../components/GigList";
import soundwalkSheepfolds from "../assets/img/soundwalkSheepfolds.jpeg";
import Hero from "../components/Hero";
type Gig = {
  _id?: string;
  venue: string;
  date: string;
  startTime?: string;
  description?: string;
  fee?: number;
  privateEvent?: boolean;
  postersNeeded?: boolean;
};
// Helper function to group gigs by year and month
function groupGigsByYearAndMonth(gigs: Gig[]) {
  const grouped: { [year: string]: { [month: string]: Gig[] } } = {};
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  gigs.forEach(gig => {
    const date = new Date(gig.date);
    const year = date.getFullYear().toString();
    const month = monthNames[date.getMonth()];
    if (!grouped[year]) {
      grouped[year] = {};
    }
    if (!grouped[year][month]) {
      grouped[year][month] = [];
    }
    grouped[year][month].push(gig);
  });
  return grouped;
}
export default function Gigs() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchGigs() {
      setLoading(true);
      const res = await fetch("/api/gigs");
      const data: Gig[] = await res.json();
      // Filter out private events and past gigs
      const today = new Date();
      // Set the time to midnight for an accurate comparison
      today.setHours(0, 0, 0, 0); 
      const publicAndFutureGigs = data.filter(gig => {
        const gigDate = new Date(gig.date);
        gigDate.setHours(0, 0, 0, 0);
        return !gig.privateEvent && gigDate >= today;
      });
      // Sort gigs by date in ascending order
      publicAndFutureGigs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setGigs(publicAndFutureGigs);
      setLoading(false);
    }
    fetchGigs();
  }, []);
  const gigsData = groupGigsByYearAndMonth(gigs);
  return (
      <main className="min-h-screen bg-background text-foreground p-8 max-w-7xl mx-auto">
      <Hero
        image={soundwalkSheepfolds}
        title="Upcoming Shows"
      />
      {loading ? (
        <p className="text-center text-lg mt-8">Loading gigs...</p>
      ) : gigs.length === 0 ? (
        <p className="text-center text-lg mt-8">No public gigs booked yet.</p>
      ) : (
        <GigList data={gigsData} />
      )}
    </main>
  );
}