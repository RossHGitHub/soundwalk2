"use client";
import { useState } from "react";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
} from "../components/ui/dialog"
import soundwalk_stack from "../assets/img/soundwalk_stack2.jpeg";
import { formatDate } from "../lib/date";
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
type GigListProps = {
  data: {
    [year: string]: {
      [month: string]: Gig[];
    };
  };
};
export function GigList({ data }: GigListProps) {
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  return (
    <>
      {Object.entries(data).map(([year, months]) => (
        <section key={year} className="mb-20">
          <h2 className="text-4xl font-semibold border-b border-muted pb-3 mb-8">{year}</h2>
          {Object.entries(months).map(([month, gigs]) => (
            <div key={month} className="mb-12">
              <h3 className="text-2xl font-semibold mb-6">{month}</h3>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {gigs.map((gig) => (
                  <Card
                    key={gig._id}
                    className="p-6 border border-emerald-600 rounded-lg cursor-pointer bg-gray-900 hover:bg-emerald-800 hover:shadow-lg transition-all relative"
                    onClick={() => setSelectedGig(gig)}
                  >
                    <div className="text-emerald-500 text-xl">{gig.venue}</div>
                    <div className="text-muted-foreground">{formatDate(gig.date)}</div>
                    <div className="text-muted-foreground">{gig.description}</div>
                    <div className="text-muted-foreground">Start Time: {gig.startTime}</div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    <Dialog open={!!selectedGig} onOpenChange={(open) => !open && setSelectedGig(null)}>
  <DialogContent className="max-w-4xl p-6 rounded-lg sm:p-8 border-emerald-600">
    {selectedGig && (
      <div className="flex flex-col lg:flex-row h-full">
        {/* Map: Left on desktop, top on mobile */}
        <div className="lg:w-1/2 w-full h-64 lg:h-auto rounded-l-lg overflow-hidden bg-gray-300 flex items-center justify-center text-muted-foreground">
         <img
            src={soundwalk_stack}
            alt="Soundwalk Stack"
            className="object-cover w-full h-full"
          />
         {/* <div className="text-center p-4">
            <div className="text-xl font-semibold mb-2">{selectedGig.venue}</div>
            <div className="mb-2">Date: {formatDate(selectedGig.date)}</div>
            <div className="mb-2">Time: {selectedGig.startTime}</div>
          </div> */}
        </div>
        {/* Info: Right on desktop, below on mobile */}
        <div className="lg:w-1/2 w-full p-6 flex flex-col justify-center rounded-r-lg">
          <h2 className="text-2xl font-bold mb-2">{selectedGig.venue}</h2>
          <p className="text-muted-foreground mb-4">Date: {formatDate(selectedGig.date)}</p>
          <p className="text-muted-foreground mb-4">Time: {selectedGig.startTime}</p>
          <p className="text-sm mb-4">
            {selectedGig.description || "No description provided."}
          </p>
          <button
            onClick={() => setSelectedGig(null)}
            className="mt-auto px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </>
  );
}
