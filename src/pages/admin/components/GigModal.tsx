import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
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
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
  const [isEditing, setIsEditing] = useState(!currentGig);

  useEffect(() => {
    if (isOpen) {
      setIsEditing(!currentGig);
    }
  }, [isOpen, currentGig]);

  const feeNumber = Number(formData.fee) || 0;
  const splitSum =
    (Number(formData.paymentSplitRoss) || 0) +
    (Number(formData.paymentSplitKeith) || 0) +
    (Number(formData.paymentSplitBarry) || 0);
  const splitMismatch =
    formData.paymentSplit === "Customise" && Math.abs(splitSum - feeNumber) > 0.01;
  const paymentMethodMissing = !formData.paymentMethod;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          className="fixed z-[100] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-[92vw] sm:w-2/3 max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white rounded-lg border border-white/10
                     shadow-xl p-5 sm:p-6 focus:outline-none"
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

          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {currentGig ? "Edit Gig" : "Add Gig"}
              </h2>
              <p className="text-sm text-white/70">
                {currentGig
                  ? "Update your gig details below."
                  : "Enter details for your new gig."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentGig && (
                <Button
                  type="button"
                  variant={isEditing ? "secondary" : "outline"}
                  onClick={() => setIsEditing((prev) => !prev)}
                  disabled={saving}
                >
                  {isEditing ? "Done Editing" : "Edit"}
                </Button>
              )}
              <DialogPrimitive.Close
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <form onSubmit={onSave} className="space-y-6" aria-busy={saving}>
            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Gig Details
              </h3>
              <div className="relative">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={onChange}
                  autoComplete="off"
                  disabled={!isEditing}
                />
                {isEditing && venueSuggestions.length > 0 && (
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={onChange}
                    disabled={!isEditing}
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
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                In-Depth Details
              </h3>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Input
                  id="internalNotes"
                  name="internalNotes"
                  value={formData.internalNotes ?? ""}
                  onChange={onChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="postersNeeded"
                    name="postersNeeded"
                    checked={!!formData.postersNeeded}
                    onCheckedChange={(checked) => onTogglePosters(!!checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="postersNeeded">Posters Needed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="privateEvent"
                    name="privateEvent"
                    checked={!!formData.privateEvent}
                    onCheckedChange={(checked) => onTogglePrivate(!!checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="privateEvent">Private Event</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                Payment Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fee">Fee (£)</Label>
                  <Input
                    type="number"
                    id="fee"
                    name="fee"
                    value={formData.fee}
                    onChange={onChange}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod ?? ""}
                    onChange={onChange}
                    disabled={!isEditing}
                    className="border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    <option value="">Select a method</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                  {paymentMethodMissing && isEditing && (
                    <p className="text-sm text-red-400 mt-1">
                      Payment method is required.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="paymentSplit">Payment Split</Label>
                <select
                  id="paymentSplit"
                  name="paymentSplit"
                  value={formData.paymentSplit ?? "Even"}
                  onChange={onChange}
                  disabled={!isEditing}
                  className="border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  <option value="Even">Even</option>
                  <option value="Customise">Customise</option>
                </select>
              </div>

              {formData.paymentSplit === "Customise" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="paymentSplitRoss" className="min-w-16">
                      Ross:
                    </Label>
                    <span className="text-white/70">£</span>
                    <Input
                      type="number"
                      id="paymentSplitRoss"
                      name="paymentSplitRoss"
                      value={formData.paymentSplitRoss ?? ""}
                      onChange={onChange}
                      disabled={!isEditing}
                      className="max-w-32"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="paymentSplitKeith" className="min-w-16">
                      Keith:
                    </Label>
                    <span className="text-white/70">£</span>
                    <Input
                      type="number"
                      id="paymentSplitKeith"
                      name="paymentSplitKeith"
                      value={formData.paymentSplitKeith ?? ""}
                      onChange={onChange}
                      disabled={!isEditing}
                      className="max-w-32"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="paymentSplitBarry" className="min-w-16">
                      Barry:
                    </Label>
                    <span className="text-white/70">£</span>
                    <Input
                      type="number"
                      id="paymentSplitBarry"
                      name="paymentSplitBarry"
                      value={formData.paymentSplitBarry ?? ""}
                      onChange={onChange}
                      disabled={!isEditing}
                      className="max-w-32"
                    />
                  </div>
                  {splitMismatch && (
                    <p className="text-sm text-red-400">
                      Split total (£{splitSum.toFixed(2)}) must match fee (£
                      {feeNumber.toFixed(2)}).
                    </p>
                  )}
                </div>
              )}
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
                <Button
                  type="submit"
                  disabled={saving || !isEditing || splitMismatch || paymentMethodMissing}
                >
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

        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
