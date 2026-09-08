import { type ChangeEvent, type FormEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  CalendarDays,
  ChevronDown,
  LoaderCircle,
  MapPin,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
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
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
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
  const fee = Number(formData.fee) || 0;
  const splitSum =
    Number(formData.paymentSplitRoss || 0) +
    Number(formData.paymentSplitKeith || 0) +
    Number(formData.paymentSplitBarry || 0);
  const splitMismatch =
    formData.paymentSplit === "Customise" && Math.abs(splitSum - fee) > 0.01;
  const date = DateTime.fromISO(formData.date);
  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!saving) onOpenChange(open);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" />
        <DialogPrimitive.Content className="admin-theme booking-dialog">
          <header className="booking-header">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">
                Soundwalk / Bookings
              </p>
              <DialogPrimitive.Title className="mt-2 text-2xl font-semibold tracking-tight">
                {currentGig ? "Edit gig" : "Create gig"}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 text-sm text-white/55">
                {currentGig
                  ? "Keep the show details up to date."
                  : "Turn the date into your next show."}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              disabled={saving}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15"
              aria-label="Close"
            >
              <X size={18} />
            </DialogPrimitive.Close>
          </header>
          <form onSubmit={onSave} aria-busy={saving} className="booking-form">
            <fieldset disabled={saving} className="booking-fields">
              <div className="booking-date-banner">
                <CalendarDays size={20} />
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/45">
                    The date
                  </span>
                  <p className="mt-1 text-sm font-medium">
                    {date.isValid
                      ? date.toFormat("cccc d LLLL yyyy")
                      : "Choose a date below"}
                  </p>
                </div>
              </div>
              <section className="booking-section">
                <h3>
                  <MapPin size={15} />
                  The essentials
                </h3>
                <div className="relative">
                  <Label htmlFor="venue">
                    Venue <span className="text-white/40">*</span>
                  </Label>
                  <Input
                    autoFocus
                    required
                    id="venue"
                    name="venue"
                    autoComplete="off"
                    placeholder="Where are we playing?"
                    value={formData.venue}
                    onChange={onChange}
                  />
                  {venueSuggestions.length > 0 && (
                    <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-xl border border-white/15 bg-[#182036] shadow-xl">
                      {venueSuggestions.map((venue) => (
                        <li key={venue}>
                          <button
                            type="button"
                            className="w-full px-4 py-3 text-left text-sm hover:bg-white/10"
                            onClick={() => onVenueSuggestionClick(venue)}
                          >
                            {venue}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      required
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={onChange}
                    />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="startTime">Start time</Label>
                    <Input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </section>
              <section className="booking-section">
                <h3>Fee & payment</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="fee">Agreed fee (£)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      id="fee"
                      name="fee"
                      placeholder="0.00"
                      value={formData.fee}
                      onChange={onChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment method *</Label>
                    <select
                      required
                      id="paymentMethod"
                      name="paymentMethod"
                      value={formData.paymentMethod || ""}
                      onChange={onChange}
                    >
                      <option value="">Choose a method</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank transfer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="paymentSplit">Split between the band</Label>
                  <select
                    id="paymentSplit"
                    name="paymentSplit"
                    value={formData.paymentSplit || "Even"}
                    onChange={onChange}
                  >
                    <option value="Even">Even split</option>
                    <option value="Customise">Custom split</option>
                  </select>
                </div>
                {formData.paymentSplit === "Customise" ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {(["Ross", "Keith", "Barry"] as const).map((person) => {
                        const name = `paymentSplit${person}` as const;
                        return (
                          <div className="min-w-0" key={person}>
                            <Label htmlFor={name}>{person} (£)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              id={name}
                              name={name}
                              value={formData[name] ?? ""}
                              onChange={onChange}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {splitMismatch && (
                      <p role="status" className="text-sm text-amber-200">
                        Split total £{splitSum.toFixed(2)} must match the £
                        {fee.toFixed(2)} fee.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-white/50">
                    Ross, Keith and Barry · £{Math.round(fee / 3)} each (rounded
                    to whole pounds).
                  </p>
                )}
              </section>
              <details className="booking-extras">
                <summary>
                  Notes & promotion{" "}
                  <span className="ml-auto text-xs font-normal text-white/40">
                    Optional
                  </span>
                  <ChevronDown size={16} />
                </summary>
                <div className="booking-section">
                  <div>
                    <Label htmlFor="internalNotes">Band notes</Label>
                    <Textarea
                      id="internalNotes"
                      name="internalNotes"
                      placeholder="Access, timings, requests…"
                      value={formData.internalNotes || ""}
                      onChange={onChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Public description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </details>
              <div className="booking-toggles">
                <label>
                  <Checkbox
                    id="privateEvent"
                    checked={!!formData.privateEvent}
                    onCheckedChange={(value) => onTogglePrivate(!!value)}
                  />
                  <span>
                    Private event
                    <small>Keep this off the public gig listings</small>
                  </span>
                </label>
                <label>
                  <Checkbox
                    id="postersNeeded"
                    checked={!!formData.postersNeeded}
                    onCheckedChange={(value) => onTogglePosters(!!value)}
                  />
                  <span>
                    Posters needed<small>Flag this show for promotion</small>
                  </span>
                </label>
              </div>
            </fieldset>
            <footer className="booking-footer">
              {currentGig ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-300"
                  disabled={saving}
                  onClick={onDelete}
                >
                  Delete gig
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={saving || splitMismatch}
                className="bg-white px-6 text-[#050816] hover:bg-white/90"
              >
                {saving && <LoaderCircle size={16} className="animate-spin" />}
                {saving
                  ? "Saving…"
                  : currentGig
                    ? "Save changes"
                    : "Create gig"}
              </Button>
            </footer>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
