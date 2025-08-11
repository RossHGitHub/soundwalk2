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
import Hero from "../components/Hero"
import SettingsAsset from "../assets/img/settings_asset.jpg";
type Gig = {
  _id?: string;
  venue: string;
  date: string; // YYYY-MM-DD
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
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
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
        const uniqueVenues = Array.from(new Set(gigs.map(g => g.venue)));
        const suggestions = uniqueVenues.filter(v => v.toLowerCase().startsWith(value.toLowerCase()));
        setVenueSuggestions(suggestions);
      } else if (name === "venue" && value.length === 0) {
        setVenueSuggestions([]);
      }
      return updatedData;
    });
  }
  function handleVenueSuggestionClick(venue: string) {
    setFormData((prev) => ({ ...prev, venue: venue }));
    setVenueSuggestions([]);
  }
  async function saveGig(e: FormEvent) {
    e.preventDefault();
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
      const res = await fetch("/api/gigs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // The fix: Check for the specific status code we expect for a successful update
      if (res.status === 200 || res.status === 204) {
        await fetchGigs();
        closeModal();
      } else {
        // Log the response to the console to help with debugging
        console.error('API responded with an unexpected status code:', res.status);
        alert("Failed to save gig: The server responded with an error.");
      }
    } catch (error) {
      console.error('An error occurred while saving the gig:', error);
      alert("Failed to save gig: An error occurred during the request.");
    }
  }
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Hero image={SettingsAsset} title="Admin Panel"></Hero>
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
        <ul className="space-y-3">
          {gigs.map((gig) => (
            <li
              key={gig._id}
              onClick={() => openModal(gig)}
              className="border p-4 rounded cursor-pointer hover:bg-emerald-800"
            >
              <div className="flex justify-between">
                <strong>{gig.venue}</strong>
                <span>{new Date(gig.date).toLocaleDateString()}</span>
              </div>
              <p>{gig.description}</p>
              <p>£{gig.fee}</p>
            </li>
          ))}
        </ul>
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
                <Label htmlFor="privateEvent" className="mb-0">
                  Private Event
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="postersNeeded"
                  checked={!!formData.postersNeeded}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, postersNeeded: !!checked }))
                  }
                />
                <Label htmlFor="postersNeeded" className="mb-0">
                  Posters Needed
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">{currentGig ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}