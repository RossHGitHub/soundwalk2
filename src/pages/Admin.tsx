"use client";
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import Hero from "../components/Hero";
import SettingsAsset from "../assets/img/settings_asset.jpg";

type Gig = {
  _id?: string;
  venue: string;
  date: string;
  startTime?: string;
  description?: string;
  fee?: number | string;
  privateEvent?: boolean;
  postersNeeded?: boolean;
};

export default function Admin() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentGig, setCurrentGig] = useState<Gig | null>(null);
  const [formData, setFormData] = useState<Gig>({
    venue: "",
    date: "",
    startTime: "",
    description: "",
    fee: "",
    privateEvent: false,
    postersNeeded: false,
  });
  const [venueSuggestions, setVenueSuggestions] = useState<string[]>([]);
  const [showFutureOnly, setShowFutureOnly] = useState(true);

  useEffect(() => {
    fetchGigs();
  }, []);

  async function fetchGigs() {
    setLoading(true);
    const res = await fetch("/api/gigs");
    const data = await res.json();
    setGigs(
      data.map((gig: any) => ({
        ...gig,
        _id: gig._id?.toString(),
        date: new Date(gig.date).toISOString().slice(0, 10),
      }))
    );
    setLoading(false);
  }

  function openModal(gig: Gig | null = null) {
    if (gig) {
      setCurrentGig(gig);
      setFormData({ ...gig, _id: gig._id });
    } else {
      setCurrentGig(null);
      setFormData({
        venue: "",
        date: "",
        startTime: "",
        description: "",
        fee: "",
        privateEvent: false,
        postersNeeded: false,
      });
    }
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setVenueSuggestions([]);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]:
          type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : value,
      };
      if (name === "venue") {
        if (value.length > 0) {
          const uniqueVenues = Array.from(new Set(gigs.map((g) => g.venue)));
          const suggestions = uniqueVenues.filter((v) =>
            v.toLowerCase().startsWith(value.toLowerCase())
          );
          setVenueSuggestions(suggestions);
        } else {
          setVenueSuggestions([]);
        }
      }
      return updatedData;
    });
  }

  function handleVenueSuggestionClick(venue: string) {
    setFormData((prev) => ({ ...prev, venue }));
    setVenueSuggestions([]);
  }

async function saveGig(e: FormEvent) {
  e.preventDefault();

  const method = currentGig ? "PUT" : "POST";
  const payload = {
    ...formData,
    fee: Number(formData.fee),
    id: currentGig?._id || undefined, // always use currentGig._id
  };

  try {
    const res = await fetch("/api/gigs", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if ([200, 201, 204].includes(res.status)) {
      await fetchGigs();
      closeModal();
    } else {
      alert("Failed to save gig: The server responded with an error.");
    }
  } catch (error) {
    alert("Failed to save gig: An error occurred during the request.");
  }
}

  async function deleteGig() {
    if (!currentGig?._id) return;
    if (!confirm("Are you sure you want to delete this gig?")) return;
    try {
      const res = await fetch(`/api/gigs?id=${currentGig._id}`, { method: "DELETE" });
      if ([200, 204].includes(res.status)) {
        await fetchGigs();
        closeModal();
      } else {
        alert("Failed to delete gig: The server responded with an error.");
      }
    } catch (error) {
      alert("Failed to delete gig: An error occurred during the request.");
    }
  }

  function groupGigsByDate(gigs: Gig[]) {
    return gigs.reduce((acc, gig) => {
      const date = new Date(gig.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString("default", { month: "long" });
      acc[year] = acc[year] || {};
      acc[year][month] = acc[year][month] || [];
      acc[year][month].push(gig);
      return acc;
    }, {} as { [year: string]: { [month: string]: Gig[] } });
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  function formatTime(timeString?: string) {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  }

  const filteredGigs = showFutureOnly
    ? gigs.filter((g) => new Date(g.date) >= new Date())
    : gigs;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Hero image={SettingsAsset} title="Admin Panel" />
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-2">
          <Label htmlFor="futureToggle">Show future gigs only</Label>
          <Checkbox
            id="futureToggle"
            checked={showFutureOnly}
            onCheckedChange={(checked) => setShowFutureOnly(!!checked)}
          />
        </div>
        <Button onClick={() => openModal()} className="px-8 py-4 text-lg">
          Add Gig
        </Button>
      </div>

      {loading ? (
        <p>Loading gigs...</p>
      ) : filteredGigs.length === 0 ? (
        <p>No gigs booked yet.</p>
      ) : (
        Object.entries(groupGigsByDate(filteredGigs)).map(([year, months]) => (
          <section key={year} className="mb-20">
            <h2 className="text-4xl font-semibold border-b border-muted pb-3 mb-8">{year}</h2>
            {Object.entries(months).map(([month, monthGigs]) => (
              <div key={month} className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">{month}</h3>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {monthGigs.map((gig) => (
                    <div
                      key={gig._id}
                      onClick={() => openModal(gig)}
                      className="p-6 border border-emerald-600 rounded-lg cursor-pointer bg-gray-900 hover:bg-emerald-800 hover:shadow-lg transition-all relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <strong className="text-emerald-500 text-xl">{gig.venue}</strong>
                        <span className="text-sm text-muted-foreground">{formatDate(gig.date)}</span>
                      </div>
                      {gig.postersNeeded && (
                        <div className="absolute top-[2px] right-[2px] bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          Posters Needed!
                        </div>
                      )}
                      {gig.startTime && (
                        <p className="text-sm text-emerald-300 mb-2">Start: {formatTime(gig.startTime)}</p>
                      )}
                      {gig.description && <p className="text-muted-foreground mb-4">{gig.description}</p>}
                      <div className="flex justify-between items-end">
                        <p className="text-xl text-emerald-400">£{gig.fee}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800">
          <DialogHeader>
            <DialogTitle>{currentGig ? "Edit Gig" : "Add Gig"}</DialogTitle>
            <DialogDescription>
              {currentGig ? "Update your gig details below." : "Enter details for your new gig."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveGig} className="space-y-4">
            <div className="relative">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                autoComplete="off"
              />
              {venueSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 bg-white text-black border mt-1 z-10">
                  {venueSuggestions.map((venue) => (
                    <li
                      key={venue}
                      onClick={() => handleVenueSuggestionClick(venue)}
                      className="px-3 py-1 cursor-pointer hover:bg-gray-200"
                    >
                      {venue}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input type="date" id="date" name="date" value={formData.date} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="fee">Fee (£)</Label>
              <Input type="number" id="fee" name="fee" value={formData.fee} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="privateEvent"
                name="privateEvent"
                checked={formData.privateEvent}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, privateEvent: !!checked }))}
              />
              <Label htmlFor="privateEvent">Private Event</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="postersNeeded"
                name="postersNeeded"
                checked={formData.postersNeeded}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, postersNeeded: !!checked }))}
              />
              <Label htmlFor="postersNeeded">Posters Needed</Label>
            </div>

            <DialogFooter className="flex justify-between">
              {currentGig && (
                <Button type="button" variant="destructive" onClick={deleteGig}>
                  Delete
                </Button>
              )}
              <Button type="submit">{currentGig ? "Save Changes" : "Add Gig"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
