import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

type InstallStatus = "available" | "already-installed" | "not-supported" | "unavailable";

type InstallPromptOutcome = "accepted" | "dismissed" | "unavailable";

type PwaContextValue = {
  installStatus: InstallStatus;
  canInstall: boolean;
  promptInstall: () => Promise<InstallPromptOutcome>;
  needRefresh: boolean;
  refreshApp: () => Promise<void>;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [supportsInstallPrompt, setSupportsInstallPrompt] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    immediate: import.meta.env.PROD,
    onRegisteredSW: (_swScriptUrl, registration) => {
      setServiceWorkerRegistration(registration ?? null);
    },
    onRegisterError: (error) => {
      console.error("PWA service worker registration failed", error);
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsStandalone(isStandaloneMode());
    setSupportsInstallPrompt("onbeforeinstallprompt" in window);

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredInstallPrompt(null);
    };

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsStandalone(true);
      }
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const installStatus: InstallStatus = useMemo(() => {
    if (!import.meta.env.PROD) return "not-supported";
    if (isStandalone) return "already-installed";
    if (!supportsInstallPrompt) return "not-supported";
    if (deferredInstallPrompt) return "available";
    return "unavailable";
  }, [deferredInstallPrompt, isStandalone, supportsInstallPrompt]);

  const promptInstall = useCallback(async (): Promise<InstallPromptOutcome> => {
    if (!deferredInstallPrompt) {
      return "unavailable";
    }

    await deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);

    return outcome === "accepted" ? "accepted" : "dismissed";
  }, [deferredInstallPrompt]);

  const refreshApp = useCallback(async () => {
    await updateServiceWorker(true);
  }, [updateServiceWorker]);

  const value = useMemo<PwaContextValue>(
    () => ({
      installStatus,
      canInstall: installStatus === "available",
      promptInstall,
      needRefresh,
      refreshApp,
      serviceWorkerRegistration,
    }),
    [installStatus, needRefresh, promptInstall, refreshApp, serviceWorkerRegistration]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error("usePwa must be used inside PwaProvider");
  }
  return context;
}
