"use client";
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import Hero from "../components/Hero";
import SettingsAsset from "../assets/img/settings_asset.jpg";

import type { AdminSection, Gig, SyncResult } from "./admin/types";
import { matchesSearch } from "./admin/gigs";
import {
  buildRevenueSummary,
  type RevenueGranularity,
} from "./admin/revenue";
import {
  fetchGigs as fetchGigsFromApi,
  fetchGoogleEvents,
  saveGig,
  deleteGig,
  runCalendarSync as runCalendarSyncApi,
} from "./admin/services/gigs";
import AdminMenuBar from "./admin/components/AdminMenuBar";
import AdminHeader from "./admin/components/AdminHeader";
import GigsListSection from "./admin/components/GigsListSection";
import GigsCalendarSection from "./admin/components/GigsCalendarSection";
import RevenueRundownSection from "./admin/components/RevenueRundownSection";
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
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
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

    try {
      await saveGig(formData, currentGig);
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

  async function deleteGig() {
    if (!currentGig?._id) return;
    if (!confirm("Are you sure you want to delete this gig?")) return;
    try {
      await deleteGig(currentGig._id);
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
      privateEvent: false,
      postersNeeded: false,
      internalNotes: "",
    });
    setSaving(false);
    setIsOpen(true);
  }

  const todayISO = new Date(new Date().toISOString().slice(0, 10)); // midnight local
  const futureOnly = gigs.filter((g) => new Date(g.date) >= todayISO);

  const displayedGigs = (search ? gigs : futureOnly).filter((g) => matchesSearch(g, search));

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
          : "Tools";

  const revenueSummary = buildRevenueSummary({
    gigs,
    granularity: revenueGranularity,
    revenueStart,
    revenueEnd,
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Hero image={SettingsAsset} title="Admin Panel" />

      <AdminMenuBar
        activeSection={activeSection}
        isGigsSection={isGigsSection}
        pageTitle={pageTitle}
        onSectionChange={setActiveSection}
      />

      <AdminHeader
        pageTitle={pageTitle}
        description={
          isGigsSection
            ? "View and manage gigs."
            : activeSection === "payments-revenue"
              ? "Track income trends and compare across time periods."
              : "This section is ready for future updates."
        }
        showAddGig={isGigsSection}
        onAddGig={() => openModal()}
      />

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
        onSave={saveGig}
        onDelete={deleteGig}
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
