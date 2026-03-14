import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  CalendarDays,
  Clock3,
  Globe2,
  Lock,
  Megaphone,
  Pencil,
  PoundSterling,
  X,
} from "lucide-react";
import { DateTime } from "luxon";

import { Button } from "../../../components/ui/button";
import type { Gig } from "../types";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  gig: Gig | null;
  onEdit: (gig: Gig) => void;
};

function formatDate(dateISO?: string) {
  if (!dateISO) return "No date set";
  return DateTime.fromISO(dateISO, { zone: "Europe/London" })
    .setLocale("en-GB")
    .toFormat("cccc d LLLL yyyy");
}

function formatTime(time?: string) {
  if (!time) return "Time not set";
  return DateTime.fromFormat(time, "HH:mm", { zone: "Europe/London" }).toFormat("HH:mm");
}

function formatOptionalMoney(value?: number | string) {
  if (value === undefined || value === "") return "Not set";
  return `£${value}`;
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white/90">{value}</p>
    </div>
  );
}

export default function GigDetailsModal({
  isOpen,
  onOpenChange,
  gig,
  onEdit,
}: Props) {
  if (!gig) return null;

  const statusBadges = [
    gig.privateEvent ? { label: "Private Event", icon: Lock } : null,
    gig.postersNeeded ? { label: "Posters to Action", icon: Megaphone } : null,
    gig._externalGoogleId ? { label: "Google Calendar", icon: Globe2 } : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof Lock }>;

  const hasPayment =
    gig.fee !== undefined ||
    gig.paymentMethod ||
    gig.paymentSplit ||
    gig.paymentSplitRoss ||
    gig.paymentSplitKeith ||
    gig.paymentSplitBarry;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(81,183,172,0.14),_transparent_30%),linear-gradient(180deg,#101c24_0%,#0a1218_100%)] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)] focus:outline-none sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ab5bf]">
                Gig Overview
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {gig.venue || "Untitled event"}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {statusBadges.length > 0 ? (
                  statusBadges.map(({ label, icon: Icon }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#2f5b64] bg-[#12313a] px-3 py-1.5 text-xs font-medium text-[#d4eef4]">
                    Booked Gig
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => onEdit(gig)}
                className="rounded-xl bg-[#d6af67] text-[#151711] hover:bg-[#e3bc74]"
              >
                <Pencil className="h-4 w-4" />
                {gig._id ? "Edit" : "Create Gig"}
              </Button>
              <DialogPrimitive.Close
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[#31525e] bg-[#0d1b23]/85 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#86ddd2]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Date
                  </p>
                  <p className="text-sm font-medium text-white/90">{formatDate(gig.date)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-[#31525e] bg-[#0d1b23]/85 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#86ddd2]">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Start time
                  </p>
                  <p className="text-sm font-medium text-white/90">{formatTime(gig.startTime)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
            <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Description
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/85">
                {gig.description?.trim() || "No description added for this gig."}
              </p>

              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Internal Notes
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/75">
                  {gig.internalNotes?.trim() || "No internal notes saved."}
                </p>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#d6af67]">
                  <PoundSterling className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Payment
                  </p>
                  <p className="text-sm font-medium text-white/90">
                    {hasPayment ? "Stored for this gig" : "No payment details"}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <DetailCard
                  label="Fee"
                  value={
                    gig.fee !== undefined && gig.fee !== ""
                      ? `£${Number(gig.fee).toFixed(2)}`
                      : "Not set"
                  }
                />
                <DetailCard
                  label="Payment Method"
                  value={gig.paymentMethod || "Not set"}
                />
                <DetailCard
                  label="Payment Split"
                  value={gig.paymentSplit || "Not set"}
                />
                {gig.paymentSplit === "Customise" && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <DetailCard
                      label="Ross"
                      value={formatOptionalMoney(gig.paymentSplitRoss)}
                    />
                    <DetailCard
                      label="Keith"
                      value={formatOptionalMoney(gig.paymentSplitKeith)}
                    />
                    <DetailCard
                      label="Barry"
                      value={formatOptionalMoney(gig.paymentSplitBarry)}
                    />
                  </div>
                )}
              </div>
            </section>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
