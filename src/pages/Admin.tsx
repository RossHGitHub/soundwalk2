"use client";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Hero from "../components/Hero";
import SettingsAsset from "../assets/img/settings_asset.jpg";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";

import type {
  AdminSection,
  FacebookAutoPostRunResult,
  Gig,
  GoogleCalendarFeed,
  MediaItem,
  MediaSyncResult,
  SavedSetList,
  SiteMediaSlot,
  Song,
  SyncResult,
} from "./admin/types";
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
import {
  deleteSong as deleteSongApi,
  fetchSongs as fetchSongsFromApi,
  saveSong as saveSongApi,
} from "./admin/services/songs";
import {
  fetchMedia as fetchMediaFromApi,
  syncMediaBucket as syncMediaBucketApi,
} from "./admin/services/media";
import { runFacebookAutoPost as runFacebookAutoPostApi } from "./admin/services/facebookAutoPost";
import {
  fetchSiteMediaSlots as fetchSiteMediaSlotsFromApi,
  saveSiteMediaSlot as saveSiteMediaSlotApi,
} from "./admin/services/siteMedia";
import {
  deleteSetList as deleteSetListApi,
  fetchSetLists as fetchSetListsFromApi,
  saveSetList as saveSetListApi,
} from "./admin/services/setlists";
import {
  buildSongFormData,
  isValidDuration,
  normalizeDurationValue,
} from "./admin/songs";
import AdminMenuBar from "./admin/components/AdminMenuBar";
import AdminHeader from "./admin/components/AdminHeader";
import GigsListSection from "./admin/components/GigsListSection";
import GigsCalendarSection from "./admin/components/GigsCalendarSection";
import RevenueRundownSection from "./admin/components/RevenueRundownSection";
import PayslipsSection from "./admin/components/PayslipsSection";
import ToolsSection from "./admin/components/ToolsSection";
import GigModal from "./admin/components/GigModal";
import GigDetailsModal from "./admin/components/GigDetailsModal";
import SetListBuilderSection from "./admin/components/SetListBuilderSection";
import SongModal from "./admin/components/SongModal";
import SongDetailsModal from "./admin/components/SongDetailsModal";
import SiteImagesSection from "./admin/components/SiteImagesSection";
import Seo from "../components/Seo";

export default function Admin() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [savedSetLists, setSavedSetLists] = useState<SavedSetList[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [siteMediaSlots, setSiteMediaSlots] = useState<SiteMediaSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [songsLoading, setSongsLoading] = useState(true);
  const [savedSetListsLoading, setSavedSetListsLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [siteMediaLoading, setSiteMediaLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isSongDetailsModalOpen, setIsSongDetailsModalOpen] = useState(false);
  const [currentGig, setCurrentGig] = useState<Gig | null>(null);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
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
  const [songFormData, setSongFormData] = useState<Song>(buildSongFormData());
  const [venueSuggestions, setVenueSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [songSaving, setSongSaving] = useState(false);
  const [setListSaving, setSetListSaving] = useState(false);
  const [mediaSyncing, setMediaSyncing] = useState(false);
  const [mediaSyncResult, setMediaSyncResult] = useState<MediaSyncResult | null>(null);
  const [mediaSyncError, setMediaSyncError] = useState<string | null>(null);
  const [siteMediaSavingKey, setSiteMediaSavingKey] = useState<string | null>(null);
  const [facebookPosting, setFacebookPosting] = useState(false);
  const [facebookPostResult, setFacebookPostResult] =
    useState<FacebookAutoPostRunResult | null>(null);
  const [facebookPostError, setFacebookPostError] = useState<string | null>(null);

  // Always include Google Calendar events
  const [googleFeed, setGoogleFeed] = useState<GoogleCalendarFeed>({
    items: [],
    diagnostics: {
      serviceAccountEmail: null,
      credentialsConfigured: null,
      timeMin: null,
      timeMax: null,
      sources: [],
      dedupedCount: 0,
      fetchError: null,
    },
  });

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
    fetchSongs();
  }, []);

  useEffect(() => {
    fetchSetLists();
  }, []);

  useEffect(() => {
    fetchMedia();
  }, []);

  useEffect(() => {
    fetchSiteMediaSlots();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchGoogleEvents();
        setGoogleFeed(data);
      } catch (error) {
        setGoogleFeed({
          items: [],
          diagnostics: {
            serviceAccountEmail: null,
            credentialsConfigured: null,
            timeMin: null,
            timeMax: null,
            sources: [],
            dedupedCount: 0,
            fetchError:
              error instanceof Error
                ? error.message
                : "Unknown error loading /api/google-events",
          },
        });
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

  async function fetchSongs() {
    setSongsLoading(true);
    try {
      const data = await fetchSongsFromApi();
      setSongs(data);
    } catch (error) {
      console.error(error);
      setSongs([]);
    } finally {
      setSongsLoading(false);
    }
  }

  async function fetchSetLists() {
    setSavedSetListsLoading(true);
    try {
      const data = await fetchSetListsFromApi();
      setSavedSetLists(data);
    } catch (error) {
      console.error(error);
      setSavedSetLists([]);
    } finally {
      setSavedSetListsLoading(false);
    }
  }

  async function fetchMedia() {
    setMediaLoading(true);
    try {
      const data = await fetchMediaFromApi();
      setMediaItems(data);
    } catch (error) {
      console.error(error);
      setMediaItems([]);
    } finally {
      setMediaLoading(false);
    }
  }

  async function fetchSiteMediaSlots() {
    setSiteMediaLoading(true);
    try {
      const data = await fetchSiteMediaSlotsFromApi();
      setSiteMediaSlots(data);
    } catch (error) {
      console.error(error);
      setSiteMediaSlots([]);
    } finally {
      setSiteMediaLoading(false);
    }
  }

  function buildFormData(gig: Gig | null = null) {
    if (gig) {
      return {
        ...gig,
        description:
          gig.description ?? (gig._externalGoogleId ? gig.internalNotes ?? "" : ""),
        _id: gig._id,
        internalNotes: gig.internalNotes ?? "",
        paymentMethod: gig.paymentMethod ?? "",
        paymentSplit: gig.paymentSplit ?? "Even",
        paymentSplitRoss: gig.paymentSplitRoss ?? "",
        paymentSplitKeith: gig.paymentSplitKeith ?? "",
        paymentSplitBarry: gig.paymentSplitBarry ?? "",
      } satisfies Gig;
    }

    return {
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
    } satisfies Gig;
  }

  function openEditModal(gig: Gig | null = null) {
    const editableGig = gig?._id ? gig : null;
    const seededForm = gig ? buildFormData(gig) : buildFormData(null);

    setCurrentGig(editableGig);
    setFormData(seededForm);
    setSaving(false);
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setCurrentGig(null);
    setVenueSuggestions([]);
    setSaving(false);
  }

  function openDetailsModal(gig: Gig) {
    setSelectedGig(gig);
    setIsDetailsModalOpen(true);
  }

  function handleEditModalOpenChange(open: boolean) {
    if (!open) {
      closeEditModal();
      return;
    }
    setIsEditModalOpen(true);
  }

  function handleDetailsModalOpenChange(open: boolean) {
    setIsDetailsModalOpen(open);
    if (!open) {
      setSelectedGig(null);
    }
  }

  function openSongModal(song: Song | null = null) {
    const editableSong = song?._id ? song : null;
    setCurrentSong(editableSong);
    setSongFormData(buildSongFormData(song));
    setSongSaving(false);
    setIsSongModalOpen(true);
  }

  function closeSongModal() {
    setIsSongModalOpen(false);
    setCurrentSong(null);
    setSongSaving(false);
  }

  function openSongDetailsModal(song: Song) {
    setSelectedSong(song);
    setIsSongDetailsModalOpen(true);
  }

  function handleSongModalOpenChange(open: boolean) {
    if (!open) {
      closeSongModal();
      return;
    }
    setIsSongModalOpen(true);
  }

  function handleSongDetailsOpenChange(open: boolean) {
    setIsSongDetailsModalOpen(open);
    if (!open) {
      setSelectedSong(null);
    }
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

  function handleSongChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setSongFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "duration"
            ? normalizeDurationValue(value)
            : value,
    }));
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
      closeEditModal();
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
      closeEditModal();
    } catch (error) {
      console.error(error);
      alert("Failed to delete gig: An error occurred during the request.");
    }
  }

  async function handleSaveSong(e: FormEvent) {
    e.preventDefault();

    if (!songFormData.title.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (!isValidDuration(songFormData.duration)) {
      alert("Please enter a duration in m:ss or h:mm:ss format.");
      return;
    }

    setSongSaving(true);

    try {
      const savedSong = await saveSongApi(
        {
          ...songFormData,
          duration: normalizeDurationValue(songFormData.duration),
        },
        currentSong
      );
      await fetchSongs();
      if (selectedSong?._id && savedSong?._id === selectedSong._id) {
        setSelectedSong(savedSong);
      }
      closeSongModal();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "An error occurred during the request.";
      alert(`Failed to save song: ${message}`);
    } finally {
      setSongSaving(false);
    }
  }

  async function handleDeleteSong() {
    if (!currentSong?._id) return;
    if (!confirm(`Are you sure you want to delete "${currentSong.title}"?`)) return;

    try {
      await deleteSongApi(currentSong._id);
      await fetchSongs();
      setSelectedSong((prev) => (prev?._id === currentSong._id ? null : prev));
      closeSongModal();
      setIsSongDetailsModalOpen(false);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "An error occurred during the request.";
      alert(`Failed to delete song: ${message}`);
    }
  }

  async function handleSaveSetList(
    payload: SavedSetList,
    currentSetListId?: string | null
  ) {
    setSetListSaving(true);
    try {
      const savedSetList = await saveSetListApi(payload, currentSetListId);
      await fetchSetLists();
      return savedSetList;
    } finally {
      setSetListSaving(false);
    }
  }

  async function handleDeleteSetList(setListId: string) {
    await deleteSetListApi(setListId);
    await fetchSetLists();
  }

  function openCreateAt(dateISO: string, startTimeHHmm?: string) {
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
    setCurrentGig(null);
    setSaving(false);
    setIsEditModalOpen(true);
  }

  function handleEditFromDetails(gig: Gig) {
    setIsDetailsModalOpen(false);
    openEditModal(gig);
  }

  function handleEditSongFromDetails(song: Song) {
    setIsSongDetailsModalOpen(false);
    openSongModal(song);
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
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "Unknown error running sync"
      );
    } finally {
      setSyncing(false);
    }
  }

  async function runMediaSync() {
    setMediaSyncing(true);
    setMediaSyncError(null);
    setMediaSyncResult(null);

    try {
      const result = await syncMediaBucketApi();
      setMediaSyncResult(result);
      await fetchMedia();
      await fetchSiteMediaSlots();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error running media sync";
      setMediaSyncError(message);
    } finally {
      setMediaSyncing(false);
    }
  }

  async function handleSaveSiteMediaSlot(key: string, mediaId: string | null) {
    setSiteMediaSavingKey(key);
    try {
      await saveSiteMediaSlotApi(key, mediaId);
      await fetchSiteMediaSlots();
    } finally {
      setSiteMediaSavingKey(null);
    }
  }

  async function runFacebookAutoPost() {
    setFacebookPosting(true);
    setFacebookPostError(null);
    setFacebookPostResult(null);

    try {
      const result = await runFacebookAutoPostApi();
      setFacebookPostResult(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error running Facebook auto-post";
      setFacebookPostError(message);
    } finally {
      setFacebookPosting(false);
    }
  }

  const isGigsSection =
    activeSection === "gigs-list" || activeSection === "gigs-calendar";
  const pageTitle =
    activeSection === "set-list-builder"
      ? "Set List Builder"
      : activeSection === "site-images"
        ? "Site Images"
      : activeSection === "gigs-list"
      ? "Gig Listings"
      : activeSection === "gigs-calendar"
        ? "Calendar"
        : activeSection === "payments-revenue"
          ? "Revenue Rundown"
          : activeSection === "payments-payslips"
            ? "Payslips"
          : "Backend Tools";

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

  function handleLogout() {
    localStorage.removeItem("auth-token");
    navigate("/login", { replace: true });
  }

  return (
    <>
      <Seo
        title="Admin Panel | Soundwalk"
        description="Secure admin area for Soundwalk site management."
        path="/admin"
        robots="noindex,nofollow"
      />
      <div className="max-w-6xl mx-auto p-6">
        <Hero image={SettingsAsset} title="Admin Panel" />

      <div ref={menuRef} className="scroll-mt-[125px]">
        <AdminMenuBar
          activeSection={activeSection}
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
            activeSection === "set-list-builder"
              ? "Build the live show flow, keep the song catalogue current, and track each set length."
              : activeSection === "site-images"
                ? "Assign gallery images to the public site without touching code."
              : isGigsSection
                ? "View and manage gigs."
              : activeSection === "payments-revenue"
                ? "Track income trends and compare across time periods."
                : activeSection === "payments-payslips"
                  ? "Generate payslips by band member and month."
                  : "Run backend maintenance, syncing, and publishing checks."
          }
          secondaryActionLabel="Log Out"
          onSecondaryAction={handleLogout}
          actionLabel={
            isGigsSection
                ? "Add Gig"
                : undefined
          }
          onAction={
            isGigsSection
                ? () => openEditModal()
                : undefined
          }
        />
      </div>

      {activeSection === "set-list-builder" && (
        <SetListBuilderSection
          songs={songs}
          loading={songsLoading}
          savedSetLists={savedSetLists}
          savedSetListsLoading={savedSetListsLoading}
          setListSaving={setListSaving}
          onCreateSong={() => openSongModal()}
          onSelectSong={openSongDetailsModal}
          onEditSong={openSongModal}
          onSaveSetList={handleSaveSetList}
          onDeleteSetList={handleDeleteSetList}
        />
      )}

      {activeSection === "site-images" && (
        <SiteImagesSection
          slots={siteMediaSlots}
          slotsLoading={siteMediaLoading}
          mediaItems={mediaItems}
          mediaLoading={mediaLoading}
          savingKey={siteMediaSavingKey}
          onAssign={handleSaveSiteMediaSlot}
        />
      )}

      {activeSection === "gigs-list" && (
        <GigsListSection
          loading={loading}
          search={search}
          displayedGigs={displayedGigs}
          onSearchChange={setSearch}
          onClearSearch={() => setSearch("")}
          onSelectGig={openDetailsModal}
        />
      )}

      {activeSection === "gigs-calendar" && (
        <GigsCalendarSection
          loading={loading}
          gigs={displayedGigs}
          googleFeed={googleFeed}
          onEventClick={openDetailsModal}
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
          mediaItems={mediaItems}
          mediaLoading={mediaLoading}
          mediaSyncing={mediaSyncing}
          mediaSyncError={mediaSyncError}
          mediaSyncResult={mediaSyncResult}
          onRunMediaSync={runMediaSync}
          facebookPosting={facebookPosting}
          facebookPostResult={facebookPostResult}
          facebookPostError={facebookPostError}
          onRunFacebookAutoPost={runFacebookAutoPost}
        />
      )}

      <GigDetailsModal
        isOpen={isDetailsModalOpen}
        onOpenChange={handleDetailsModalOpenChange}
        gig={selectedGig}
        onEdit={handleEditFromDetails}
      />

      <GigModal
        isOpen={isEditModalOpen}
        onOpenChange={handleEditModalOpenChange}
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

      <SongDetailsModal
        isOpen={isSongDetailsModalOpen}
        onOpenChange={handleSongDetailsOpenChange}
        song={selectedSong}
        onEdit={handleEditSongFromDetails}
      />

        <SongModal
          isOpen={isSongModalOpen}
          onOpenChange={handleSongModalOpenChange}
          saving={songSaving}
          currentSong={currentSong}
          formData={songFormData}
          onChange={handleSongChange}
          onSave={handleSaveSong}
          onDelete={handleDeleteSong}
        />
      </div>
    </>
  );
}
