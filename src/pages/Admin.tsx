// pages/admin.tsx
"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";

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

  // For dialog modal control:
  const [isOpen, setIsOpen] = useState(false);
  const [currentGig, setCurrentGig] = useState<Gig | null>(null);

  const [checked, setChecked] = useState(false);

  const [formData, setFormData] = useState<Gig>({
    venue: "",
    date: "",
    startTime: "",
    description: "",
    fee: "",
    privateEvent: false,
    postersNeeded: false,
  });

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
  }

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  }

  async function saveGig(e: FormEvent) {
    e.preventDefault();
    const method = currentGig ? "PUT" : "POST";
    const payload = {
      ...formData,
      fee: Number(formData.fee),
      id: currentGig?._id,
    };

    const res = await fetch("/api/gigs", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await fetchGigs();
      closeModal();
    } else {
      alert("Failed to save gig");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin: Manage Gigs</h1>

      <Button onClick={() => openModal()} className="mb-4">
        Add Gig
      </Button>

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
              className="border p-4 rounded cursor-pointer hover:bg-emerald-50"
            >
              <div className="flex justify-between">
                <strong>{gig.venue}</strong>
                <span>{new Date(gig.date).toLocaleDateString()}</span>
              </div>
              <p>{gig.description}</p>
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
