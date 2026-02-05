"use client";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import Hero from "../components/Hero";
import SettingsAsset from "../assets/img/settings_asset.jpg";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";

import type { AdminSection, Gig, SyncResult } from "./admin/types";
import { matchesSearch } from "./admin/gigs";
import {
  buildRevenueSummary,
  type RevenueGranularity,
} from "./admin/revenue";
import {
  fetchGigs as fetchGigsFromApi,
  fetchGoogleEvents,
  saveGig as saveGigApi,
  deleteGig as deleteGigApi,
  runCalendarSync as runCalendarSyncApi,
} from "./admin/services/gigs";
import AdminMenuBar from "./admin/components/AdminMenuBar";
import AdminHeader from "./admin/components/AdminHeader";
import GigsListSection from "./admin/components/GigsListSection";
import GigsCalendarSection from "./admin/components/GigsCalendarSection";
import RevenueRundownSection from "./admin/components/RevenueRundownSection";
import PayslipsSection from "./admin/components/PayslipsSection";
import ToolsSection from "./admin/components/ToolsSection";
import GigModal from "./admin/components/GigModal";

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
    paymentMethod: "",
    paymentSplit: "Even",
    paymentSplitRoss: "",
    paymentSplitKeith: "",
    paymentSplitBarry: "",
    privateEvent: false,
    postersNeeded: false,
    internalNotes: "",
  });
  const [venueSuggestions, setVenueSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Always include Google Calendar events
  const [gcalEvents, setGcalEvents] = useState<Array<any>>([]);

  // Search state
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] =
    useState<AdminSection>("gigs-list");
  const [revenueGranularity, setRevenueGranularity] =
    useState<RevenueGranularity>("monthly");
  const [showRevenueRange, setShowRevenueRange] = useState(false);
  const [revenueStart, setRevenueStart] = useState("");
  const [revenueEnd, setRevenueEnd] = useState("");

  // Sanity check / sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showHistoricGigs, setShowHistoricGigs] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchGigs();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchGoogleEvents();
        setGcalEvents(data);
      } catch {
        setGcalEvents([]);
      }
    })();
  }, []);

  async function fetchGigs() {
    setLoading(true);
    try {
      const data = await fetchGigsFromApi();
      setGigs(data);
    } catch (error) {
      console.error(error);
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }

  function openModal(gig: Gig | null = null) {
    if (gig) {
      setCurrentGig(gig);
      setFormData({
        ...gig,
        _id: gig._id,
        internalNotes: gig.internalNotes ?? "",
        paymentMethod: gig.paymentMethod ?? "",
        paymentSplit: gig.paymentSplit ?? "Even",
        paymentSplitRoss: gig.paymentSplitRoss ?? "",
        paymentSplitKeith: gig.paymentSplitKeith ?? "",
        paymentSplitBarry: gig.paymentSplitBarry ?? "",
      });
    } else {
      setCurrentGig(null);
      setFormData({
        venue: "",
        date: "",
        startTime: "",
        description: "",
        fee: "",
        paymentMethod: "",
        paymentSplit: "Even",
        paymentSplitRoss: "",
        paymentSplitKeith: "",
        paymentSplitBarry: "",
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

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      };

      const nextPaymentSplit =
        name === "paymentSplit" ? value : updatedData.paymentSplit ?? "Even";
      const nextFee = name === "fee" ? Number(value) || 0 : Number(updatedData.fee) || 0;
      if (nextPaymentSplit === "Even") {
        const evenSplit = Math.round(nextFee / 3);
        updatedData.paymentSplitRoss = evenSplit;
        updatedData.paymentSplitKeith = evenSplit;
        updatedData.paymentSplitBarry = evenSplit;
      }

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

  async function handleSaveGig(e: FormEvent) {
    e.preventDefault();

    if (!formData.date) {
      alert("Please select a date");
      return;
    }

    if (!formData.paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    if (formData.paymentSplit === "Customise") {
      const feeNumber = Number(formData.fee) || 0;
      const splitSum =
        (Number(formData.paymentSplitRoss) || 0) +
        (Number(formData.paymentSplitKeith) || 0) +
        (Number(formData.paymentSplitBarry) || 0);
      if (Math.abs(splitSum - feeNumber) > 0.01) {
        alert("Payment split total must match the gig fee.");
        return;
      }
    }

    setSaving(true);

    try {
      await saveGigApi(formData, currentGig);
      await fetchGigs();
      closeModal();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "An error occurred during the request.";
      alert(`Failed to save gig: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGig() {
    if (!currentGig?._id) return;
    if (!confirm("Are you sure you want to delete this gig?")) return;
    try {
      await deleteGigApi(currentGig._id);
      await fetchGigs();
      closeModal();
    } catch (error) {
      console.error(error);
      alert("Failed to delete gig: An error occurred during the request.");
    }
  }

  function openCreateAt(dateISO: string, startTimeHHmm?: string) {
    setCurrentGig(null);
    setFormData({
      venue: "",
      date: dateISO, // yyyy-mm-dd (Europe/London)
      startTime: startTimeHHmm || "", // e.g. from Week slot
      description: "",
      fee: "",
      paymentMethod: "",
      paymentSplit: "Even",
      paymentSplitRoss: "",
      paymentSplitKeith: "",
      paymentSplitBarry: "",
      privateEvent: false,
      postersNeeded: false,
      internalNotes: "",
    });
    setSaving(false);
    setIsOpen(true);
  }

  const todayISO = new Date(new Date().toISOString().slice(0, 10)); // midnight local
  const futureOnly = gigs.filter((g) => new Date(g.date) >= todayISO);
  const filteredGigs = showHistoricGigs ? gigs : futureOnly;
  const displayedGigs = filteredGigs.filter((g) => matchesSearch(g, search));

  // NEW: run the calendar sanity check / sync
  async function runCalendarSync() {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);

    try {
      const data = await runCalendarSyncApi();
      setSyncResult(data);
    } catch (e: any) {
      setSyncError(e?.message || "Unknown error running sync");
    } finally {
      setSyncing(false);
    }
  }

  const isGigsSection =
    activeSection === "gigs-list" || activeSection === "gigs-calendar";
  const pageTitle =
    activeSection === "gigs-list"
      ? "Gig Listings"
      : activeSection === "gigs-calendar"
        ? "Calendar"
        : activeSection === "payments-revenue"
          ? "Revenue Rundown"
          : activeSection === "payments-payslips"
            ? "Payslips"
          : "Tools";

  const revenueSummary = buildRevenueSummary({
    gigs,
    granularity: revenueGranularity,
    revenueStart,
    revenueEnd,
  });

  function handleSectionChange(section: AdminSection) {
    setActiveSection(section);
    requestAnimationFrame(() => {
      menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Hero image={SettingsAsset} title="Admin Panel" />

      <div ref={menuRef} className="scroll-mt-[125px]">
        <AdminMenuBar
          activeSection={activeSection}
          isGigsSection={isGigsSection}
          pageTitle={pageTitle}
          onSectionChange={handleSectionChange}
        />
        {activeSection === "gigs-list" && (
          <div className="mt-3 rounded-xl border border-white/10 bg-gray-950/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showHistoricGigs"
                  checked={showHistoricGigs}
                  onCheckedChange={(checked) => {
                    const nextValue = !!checked;
                    setShowHistoricGigs(nextValue);
                    if (nextValue) {
                      fetchGigs();
                    }
                  }}
                />
                <Label htmlFor="showHistoricGigs" className="cursor-pointer">
                  View historic gigs
                </Label>
              </div>
              <span className="text-xs text-white/50">
                Includes past gigs from the database.
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="scroll-mt-24">
        <AdminHeader
          pageTitle={pageTitle}
          description={
            isGigsSection
              ? "View and manage gigs."
              : activeSection === "payments-revenue"
                ? "Track income trends and compare across time periods."
                : activeSection === "payments-payslips"
                  ? "Generate payslips by band member and month."
                : "This section is ready for future updates."
          }
          showAddGig={isGigsSection}
          onAddGig={() => openModal()}
        />
      </div>

      {activeSection === "gigs-list" && (
        <GigsListSection
          loading={loading}
          search={search}
          displayedGigs={displayedGigs}
          onSearchChange={setSearch}
          onClearSearch={() => setSearch("")}
          onSelectGig={openModal}
        />
      )}

      {activeSection === "gigs-calendar" && (
        <GigsCalendarSection
          loading={loading}
          gigs={displayedGigs}
          extraEvents={gcalEvents}
          onEventClick={(gig) => openModal(gig)}
          onCreateGig={(dateISO, startHHmm) => openCreateAt(dateISO, startHHmm)}
        />
      )}

      {activeSection === "payments-revenue" && (
        <RevenueRundownSection
          granularity={revenueGranularity}
          onGranularityChange={setRevenueGranularity}
          showRange={showRevenueRange}
          onToggleRange={() => setShowRevenueRange((prev) => !prev)}
          revenueStart={revenueStart}
          revenueEnd={revenueEnd}
          onStartChange={setRevenueStart}
          onEndChange={setRevenueEnd}
          onClearRange={() => {
            setRevenueStart("");
            setRevenueEnd("");
          }}
          summary={revenueSummary}
        />
      )}

      {activeSection === "payments-payslips" && (
        <PayslipsSection gigs={gigs} />
      )}

      {activeSection === "tools" && (
        <ToolsSection
          syncing={syncing}
          syncError={syncError}
          syncResult={syncResult}
          onRunCalendarSync={runCalendarSync}
        />
      )}

      <GigModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        saving={saving}
        currentGig={currentGig}
        formData={formData}
        venueSuggestions={venueSuggestions}
        onChange={handleChange}
        onVenueSuggestionClick={handleVenueSuggestionClick}
        onSave={handleSaveGig}
        onDelete={handleDeleteGig}
        onTogglePrivate={(checked) =>
          setFormData((prev) => ({ ...prev, privateEvent: checked }))
        }
        onTogglePosters={(checked) =>
          setFormData((prev) => ({ ...prev, postersNeeded: checked }))
        }
      />
    </div>
  );
}
