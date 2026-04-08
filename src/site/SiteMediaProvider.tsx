import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MediaItem } from "../pages/admin/types";
import type { SiteMediaSlotKey } from "./siteMediaConfig";

export type SiteMediaSlot = {
  key: SiteMediaSlotKey;
  label: string;
  description: string;
  mediaId: string | null;
  imageUrl: string | null;
  media: MediaItem | null;
  updatedAt?: string | null;
};

type SiteMediaContextValue = {
  loading: boolean;
  slots: SiteMediaSlot[];
  getSlot: (key: SiteMediaSlotKey) => SiteMediaSlot | undefined;
};

const SiteMediaContext = createContext<SiteMediaContextValue>({
  loading: true,
  slots: [],
  getSlot: () => undefined,
});

export function SiteMediaProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<SiteMediaSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      try {
        const res = await fetch("/api/site-media");
        if (!res.ok) {
          throw new Error(`Failed to fetch site media (${res.status})`);
        }

        const data = (await res.json()) as SiteMediaSlot[];
        if (!cancelled) {
          setSlots(data);
        }
      } catch (error) {
        console.error("Failed to load site media", error);
        if (!cancelled) {
          setSlots([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SiteMediaContextValue>(
    () => ({
      loading,
      slots,
      getSlot: (key) => slots.find((slot) => slot.key === key),
    }),
    [loading, slots]
  );

  return (
    <SiteMediaContext.Provider value={value}>
      {children}
    </SiteMediaContext.Provider>
  );
}

export function useSiteMedia() {
  return useContext(SiteMediaContext);
}
