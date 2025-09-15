"use client";
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "../components/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
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
  internalNotes?: string;
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
    internalNotes: "",
  });
  const [venueSuggestions, setVenueSuggestions] = useState<string[]>([]);
  const [showFutureOnly, setShowFutureOnly] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setFormData({
        ...gig,
        _id: gig._id,
        internalNotes: gig.internalNotes ?? "",
      });
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
        internalNotes: "",
      });
    }
    setSaving(false);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setVenueSuggestions([]);
    setSaving(false);
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
      return updatedData as Gig;
    });
  }

  function handleVenueSuggestionClick(venue: string) {
    setFormData((prev) => ({ ...prev, venue }));
    setVenueSuggestions([]);
  }

  async function saveGig(e: FormEvent) {
    e.preventDefault();

    if (!formData.date) {
      alert("Please select a date");
      return;
    }

    setSaving(true);

    const method = currentGig ? "PUT" : "POST";
    const payload: any = {
      ...formData,
      fee: Number(formData.fee) || 0,
    };

    if (currentGig?._id) payload._id = currentGig._id;

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
        const errorData = await res.json().catch(() => ({}));
        console.error("Error response:", errorData);
        alert(`Failed to save gig: ${errorData.error || "Server error"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save gig: An error occurred during the request.");
    } finally {
      setSaving(false);
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

      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Portal>
          {/* Overlay BELOW content */}
          <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-[1px]" />
          {/* Content ABOVE overlay */}
          <DialogPrimitive.Content
            className="fixed z-[100] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-full max-w-[425px] bg-gray-900 text-white rounded-lg border border-white/10
                       shadow-xl p-6 sm:p-8 focus:outline-none"
          >
            {/* Saving overlay */}
            {saving && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] grid place-items-center rounded-lg">
                <div className="flex items-center gap-3">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Saving…</span>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{currentGig ? "Edit Gig" : "Add Gig"}</h2>
              <p className="text-sm text-white/70">
                {currentGig ? "Update your gig details below." : "Enter details for your new gig."}
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={saveGig} className="space-y-4" aria-busy={saving}>
              {/* Venue */}
              <div className="relative">
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" name="venue" value={formData.venue} onChange={handleChange} autoComplete="off" />
                {venueSuggestions.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 bg-white text-black border mt-1 z-[110] rounded-md overflow-hidden">
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

              {/* Date */}
              <div>
                <Label htmlFor="date">Date</Label>
                <Input type="date" id="date" name="date" value={formData.date} onChange={handleChange} />
              </div>

              {/* Start Time */}
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleChange} />
              </div>

              {/* Fee */}
              <div>
                <Label htmlFor="fee">Fee (£)</Label>
                <Input type="number" id="fee" name="fee" value={formData.fee} onChange={handleChange} />
              </div>

              {/* Description (for your app only; not pushed to Calendar) */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
              </div>

              {/* Internal Notes -> pushed to Calendar Description */}
              <div>
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Input
                  id="internalNotes"
                  name="internalNotes"
                  value={formData.internalNotes ?? ""}
                  onChange={handleChange}
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privateEvent"
                  name="privateEvent"
                  checked={!!formData.privateEvent}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, privateEvent: !!checked }))}
                />
                <Label htmlFor="privateEvent">Private Event</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="postersNeeded"
                  name="postersNeeded"
                  checked={!!formData.postersNeeded}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, postersNeeded: !!checked }))}
                />
                <Label htmlFor="postersNeeded">Posters Needed</Label>
              </div>

              {/* Footer */}
              <div className="flex justify-between pt-2">
                {currentGig && (
                  <Button type="button" variant="destructive" onClick={deleteGig} disabled={saving}>
                    Delete
                  </Button>
                )}
                <div className="ml-auto">
                  <Button type="submit" disabled={saving}>
                    {saving && (
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    {saving ? "Saving..." : currentGig ? "Save Changes" : "Add Gig"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Close button */}
            <DialogPrimitive.Close
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
