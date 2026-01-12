import type { ChangeEvent, FormEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import type { Gig } from "../types";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  currentGig: Gig | null;
  formData: Gig;
  venueSuggestions: string[];
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onVenueSuggestionClick: (venue: string) => void;
  onSave: (e: FormEvent) => void;
  onDelete: () => void;
  onTogglePrivate: (checked: boolean) => void;
  onTogglePosters: (checked: boolean) => void;
};

export default function GigModal({
  isOpen,
  onOpenChange,
  saving,
  currentGig,
  formData,
  venueSuggestions,
  onChange,
  onVenueSuggestionClick,
  onSave,
  onDelete,
  onTogglePrivate,
  onTogglePosters,
}: Props) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          className="fixed z-[100] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-full max-w-[425px] bg-gray-900 text-white rounded-lg border border-white/10
                     shadow-xl p-6 sm:p-8 focus:outline-none"
        >
          {saving && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] grid place-items-center rounded-lg">
              <div className="flex items-center gap-3">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Saving…</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {currentGig ? "Edit Gig" : "Add Gig"}
            </h2>
            <p className="text-sm text-white/70">
              {currentGig
                ? "Update your gig details below."
                : "Enter details for your new gig."}
            </p>
          </div>

          <form onSubmit={onSave} className="space-y-4" aria-busy={saving}>
            <div className="relative">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={onChange}
                autoComplete="off"
              />
              {venueSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 bg-white text-black border mt-1 z-[110] rounded-md overflow-hidden">
                  {venueSuggestions.map((venue) => (
                    <li
                      key={venue}
                      onClick={() => onVenueSuggestionClick(venue)}
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
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={onChange}
              />
            </div>

            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={onChange}
              />
            </div>

            <div>
              <Label htmlFor="fee">Fee (£)</Label>
              <Input
                type="number"
                id="fee"
                name="fee"
                value={formData.fee}
                onChange={onChange}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={onChange}
              />
            </div>

            <div>
              <Label htmlFor="internalNotes">Internal Notes</Label>
              <Input
                id="internalNotes"
                name="internalNotes"
                value={formData.internalNotes ?? ""}
                onChange={onChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="privateEvent"
                name="privateEvent"
                checked={!!formData.privateEvent}
                onCheckedChange={(checked) => onTogglePrivate(!!checked)}
              />
              <Label htmlFor="privateEvent">Private Event</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="postersNeeded"
                name="postersNeeded"
                checked={!!formData.postersNeeded}
                onCheckedChange={(checked) => onTogglePosters(!!checked)}
              />
              <Label htmlFor="postersNeeded">Posters Needed</Label>
            </div>

            <div className="flex justify-between pt-2">
              {currentGig && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={saving}
                >
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
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  {saving ? "Saving..." : currentGig ? "Save Changes" : "Add Gig"}
                </Button>
              </div>
            </div>
          </form>

          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
