import { supabase } from "@/integrations/supabase/client";

let apiKeyPromise: Promise<string | null> | null = null;
let isScriptLoading = false;
let isScriptLoaded = false;
let loadPromise: Promise<boolean> | null = null;
let lastLoadError: string | null = null;
let authFailed = false;

const setError = (msg: string) => {
  lastLoadError = msg;
};

const resetLoadPromise = () => {
  isScriptLoading = false;
  isScriptLoaded = false;
  loadPromise = null;
};

// Fetch API key from backend function (cached; retries on failure)
export const getGoogleMapsApiKey = async (): Promise<string | null> => {
  if (!apiKeyPromise) {
    apiKeyPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-google-maps-token");
        if (error) throw error;

        const key = (data?.apiKey as string | null) ?? null;
        if (!key) {
          apiKeyPromise = null;
          setError("Google Maps API key not configured.");
          return null;
        }

        return key;
      } catch (e) {
        console.error("Failed to load Google Maps API key", e);
        apiKeyPromise = null;
        setError("Failed to load Google Maps API key.");
        return null;
      }
    })();
  }

  return apiKeyPromise;
};

// Load Google Maps script (singleton pattern; retries on failure)
export const loadGoogleMapsScript = async (): Promise<boolean> => {
  // Already loaded
  if (window.google?.maps?.places) {
    isScriptLoaded = true;
    lastLoadError = null;
    return true;
  }

  if (authFailed) {
    setError(
      "Google Maps authorization failed. Please verify billing/API enablement and any domain restrictions for this site."
    );
    return false;
  }

  // Return existing promise if loading
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const apiKey = await getGoogleMapsApiKey();
    if (!apiKey) {
      loadPromise = null; // allow retry after key is configured
      return false;
    }

    // Check again after getting key
    if (window.google?.maps?.places) {
      isScriptLoaded = true;
      lastLoadError = null;
      return true;
    }

    // Called by Google Maps when auth fails (e.g. referrer restriction / billing)
    authFailed = false;
    (window as any).gm_authFailure = () => {
      authFailed = true;
      console.error("Google Maps auth failure (gm_authFailure)");
      setError(
        "Google Maps authorization failed. Please verify billing/API enablement and any domain restrictions for this site."
      );
      resetLoadPromise();
    };

    // Check if script tag already exists
    const existingScript = document.getElementById("google-maps-script") as HTMLScriptElement | null;
    if (existingScript) {
      isScriptLoading = true;

      // Wait for it to load
      return new Promise<boolean>((resolve) => {
        const startedAt = Date.now();
        const checkLoaded = setInterval(() => {
          if (authFailed) {
            clearInterval(checkLoaded);
            isScriptLoading = false;
            loadPromise = null;
            resolve(false);
            return;
          }

          if (window.google?.maps?.places) {
            isScriptLoaded = true;
            isScriptLoading = false;
            lastLoadError = null;
            clearInterval(checkLoaded);
            resolve(true);
            return;
          }

          // Timeout after 15 seconds
          if (Date.now() - startedAt > 15000) {
            clearInterval(checkLoaded);
            isScriptLoading = false;
            loadPromise = null;
            setError("Timed out loading Google Maps.");
            resolve(false);
          }
        }, 100);
      });
    }

    isScriptLoading = true;

    return new Promise<boolean>((resolve) => {
      (window as any).initGoogleMapsCallback = () => {
        // Allow gm_authFailure a chance to fire first
        setTimeout(() => {
          if (authFailed) {
            isScriptLoading = false;
            loadPromise = null;
            resolve(false);
            return;
          }

          if (window.google?.maps?.places) {
            isScriptLoaded = true;
            isScriptLoading = false;
            lastLoadError = null;
            resolve(true);
            return;
          }

          // Script loaded but Places library didn't
          isScriptLoading = false;
          loadPromise = null;
          setError("Google Maps loaded without Places library.");
          resolve(false);
        }, 0);
      };

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        apiKey
      )}&libraries=places&v=weekly&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        isScriptLoading = false;
        loadPromise = null;
        setError("Failed to load Google Maps script.");
        resolve(false);
      };
      document.head.appendChild(script);
    });
  })();

  return loadPromise;
};

// Optional: surface the last loader error for UI debugging
export const getGoogleMapsLastError = (): string | null => lastLoadError;

// Check if Google Maps is loaded
export const isGoogleMapsLoaded = (): boolean => {
  return isScriptLoaded || !!window.google?.maps?.places;
};

// Check if script is currently loading
export const isGoogleMapsLoading = (): boolean => {
  return isScriptLoading;
};
