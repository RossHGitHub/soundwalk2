import { GigList } from "../components/GigList";
import soundwalkThreeStories from "../assets/img/soundwalkThreeStories.jpeg";
import Hero from "../components/Hero";

const gigsData = {
  "2025": {
    "August": [
      { id: 1, venue: "These Things Happen, Roker", date: "Fri 1st Aug 2025", time: "20:30" },
      { id: 2, venue: "The Plough, Cramlington", date: "Sat 9th Aug 2025", time: "20:30" },
      { id: 3, venue: "The Seven Stars, Ponteland", date: "Fri 15th Aug 2025", time: "20:30" },
      { id: 4, venue: "The Duke of Cleveland, Hartlepool", date: "Fri 22nd Aug 2025", time: "20:30" },
      { id: 5, venue: "Houghton Rugby Club, Houghton-le-Spring", date: "Sun 24th Aug 2025", time: "16:00" },
    ],
    "September": [
      { id: 6, venue: "The Four Ladies, Cramlington", date: "Fri 12th Sept 2025", time: "21:00" },
      { id: 7, venue: "Benedictine Social Centre, Cramlington", date: "Sat 20th Sept 2025", time: "21:00" },
      { id: 8, venue: "These Things Happen, Roker", date: "Fri 26th Sept 2025", time: "20:30" },
    ],
    "October": [
      { id: 9, venue: "The Blind Tiger, Blyth", date: "Fri 3rd Oct 2025", time: "19:00" },
      { id: 10, venue: "Platform One, Bedlington", date: "Fri 10th Oct 2025", time: "21:00" },
      { id: 11, venue: "NE28 Bar, Wallsend", date: "Sat 11th Oct 2025", time: "20:00" },
      { id: 12, venue: "Champs, Washington", date: "Sat 18th Oct 2025", time: "20:30" },
    ],
    "November": [
      { id: 13, venue: "The Plough, Cramlington", date: "Sat 1st Nov 2025", time: "20:30" },
      { id: 14, venue: "The Jingling Gate, Callerton", date: "Sat 15th Nov 2025", time: "20:30" },
    ],
    "December": [
      { id: 15, venue: "The Seven Stars, Ponteland", date: "Fri 12th Dec 2025", time: "20:30" },
      { id: 16, venue: "The High Crown, Chester-le-Street", date: "Sat 27th Dec 2025", time: "21:00" },
      { id: 17, venue: "The Malleable Social Club, Stockton", date: "Wed 31st Dec 2025", time: "21:00" },
    ],
  },
  "2026": {
    "January": [
      { id: 18, venue: "Vesta Tilley's, Sunderland", date: "Fri 2nd January 2026", time: "20:30" },
    ],
    "February": [
      { id: 19, venue: "Vibe Bar, Bedlington", date: "Sat 7th Feb 2026", time: "20:00" },
    ],
    "April": [
      { id: 20, venue: "Heaton Buffs, Heaton", date: "Sat 4th April 2026", time: "20:00" },
      { id: 21, venue: "The Rum Pot, Chester-le-Street", date: "Fri 17th April 2026", time: "20:00" },
    ],
    "August": [
      { id: 22, venue: "The Rum Pot, Chester-le-Street", date: "Sat 29th August 2026", time: "20:00" },
    ],
    "October": [
      { id: 23, venue: "Vibe Bar, Bedlington", date: "Sat 10th Oct 2026", time: "20:00" },
      { id: 24, venue: "Heaton Buffs, Heaton", date: "Sat 31st Oct 2026", time: "20:00" },
    ],
  },
};

export default function Gigs() {
  return (
      <main className="min-h-screen bg-background text-foreground p-8 max-w-7xl mx-auto">
      {/* Move the hero OUTSIDE the centered content if you want the mobile full-bleed,
          but this component already handles that for you. */}
      <Hero
        image={soundwalkThreeStories}
        title="Upcoming Shows"
      />

      <GigList data={gigsData} />
    </main>
  );
}
