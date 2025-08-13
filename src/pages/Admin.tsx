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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGigs();
  }, []);

  async function fetchGigs() {
    setLoading(true);
    const res = await fetch("../api/gigs");
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
      setFormData(gig);
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
      if (name === "venue" && value.length > 0) {
        const uniqueVenues = Array.from(new Set(gigs.map((g) => g.venue)));
        const suggestions = uniqueVenues.filter((v) =>
          v.toLowerCase().startsWith(value.toLowerCase())
        );
        setVenueSuggestions(suggestions);
      } else if (name === "venue" && value.length === 0) {
        setVenueSuggestions([]);
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
    setSaving(true);
    const method = currentGig ? "PUT" : "POST";
    const payload = {
      ...formData,
      fee: Number(formData.fee),
      id: currentGig?._id,
    };
    if (currentGig && payload._id) {
      payload.id = payload._id;
    }
    try {
      const res = await fetch("../api/gigs", {
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
    } finally {
      setSaving(false);
    }
  }

  async function deleteGig() {
    if (!currentGig?._id) return;
    if (!confirm("Are you sure you want to delete this gig?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`../api/gigs?id=${currentGig._id}`, {
        method: "DELETE",
      });
      if ([200, 204].includes(res.status)) {
        await fetchGigs();
        closeModal();
      } else {
        alert("Failed to delete gig: The server responded with an error.");
      }
    } catch (error) {
      alert("Failed to delete gig: An error occurred during the request.");
    } finally {
      setDeleting(false);
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
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Hero image={SettingsAsset} title="Admin Panel" />
      <div className="flex justify-end mb-8">
        <Button onClick={() => openModal()} className="px-8 py-4 text-lg">
          Add Gig
        </Button>
      </div>
      {loading ? (
        <p>Loading gigs...</p>
      ) : gigs.length === 0 ? (
        <p>No gigs booked yet.</p>
      ) : (
        Object.entries(groupGigsByDate(gigs)).map(([year, months]) => (
          <section key={year} className="mb-20">
            <h2 className="text-4xl font-semibold border-b border-muted pb-3 mb-8">
              {year}
            </h2>
            {Object.entries(months).map(([month, monthGigs]) => (
              <div key={month} className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">{month}</h3>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {monthGigs.map((gig) => (
                    <div
                      key={gig._id}
                      onClick={() => openModal(gig)}
                      className="relative p-6 border border-emerald-600 rounded-lg cursor-pointer bg-gray-900 hover:bg-emerald-800 hover:shadow-lg transition-all"
                    >
                      {gig.postersNeeded && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                          Posters Needed!
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <strong className="text-emerald-500 text-xl">{gig.venue}</strong>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(gig.date)}
                        </span>
                      </div>
                      {gig.startTime && (
                        <p className="text-sm text-gray-300 mb-2">
                          {gig.startTime}
                        </p>
                      )}
                      {gig.description && (
                        <p className="text-muted-foreground mb-4">{gig.description}</p>
                      )}
                      <div className="flex justify-end items-end h-full">
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
        <DialogContent className="sm:max-w-[500px] bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>{currentGig ? "Edit Gig" : "Add Gig"}</DialogTitle>
            <DialogDescription>
              Use this form to {currentGig ? "edit the gig details" : "add a new gig"}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveGig} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                name="venue"
                type="text"
                value={formData.venue}
                onChange={handleChange}
                required
                autoFocus
              />
              {venueSuggestions.length > 0 && (
                <ul className="border border-t-0 border-gray-600 rounded-b-lg max-h-48 overflow-y-auto">
                  {venueSuggestions.map((venue) => (
                    <li
                      key={venue}
                      className="p-2 cursor-pointer hover:bg-emerald-800"
                      onClick={() => handleVenueSuggestionClick(venue)}
                    >
                      {venue}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                step={900}
                value={formData.startTime || ""}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="fee">Fee (£)</Label>
              <Input
                id="fee"
                name="fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.fee || ""}
                onChange={handleChange}
              />
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privateEvent"
                  checked={!!formData.privateEvent}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, privateEvent: !!checked }))
                  }
                />
                <Label htmlFor="privateEvent">Private Event</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="postersNeeded"
                  checked={!!formData.postersNeeded}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, postersNeeded: !!checked }))
                  }
                />
                <Label htmlFor="postersNeeded">Posters Needed</Label>
              </div>
            </div>
            <DialogFooter className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <div className="flex space-x-2">
                {currentGig && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={deleteGig}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                )}
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : currentGig ? "Save" : "Add"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
