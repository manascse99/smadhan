import { supabase } from "@/integrations/supabase/client";

let apiKeyPromise: Promise<string | null> | null = null;
let isScriptLoading = false;
let isScriptLoaded = false;
let loadPromise: Promise<boolean> | null = null;

// Fetch API key from edge function (cached)
export const getGoogleMapsApiKey = async (): Promise<string | null> => {
  if (!apiKeyPromise) {
    apiKeyPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-google-maps-token");
        if (error) throw error;
        return data?.apiKey as string | null;
      } catch (e) {
        console.error("Failed to load Google Maps API key", e);
        return null;
      }
    })();
  }
  return apiKeyPromise;
};

// Load Google Maps script (singleton pattern)
export const loadGoogleMapsScript = async (): Promise<boolean> => {
  // Already loaded
  if (window.google?.maps?.places) {
    isScriptLoaded = true;
    return true;
  }

  // Return existing promise if loading
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const apiKey = await getGoogleMapsApiKey();
    if (!apiKey) {
      return false;
    }

    // Check again after getting key
    if (window.google?.maps?.places) {
      isScriptLoaded = true;
      return true;
    }

    // Check if script tag already exists
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      // Wait for it to load
      return new Promise<boolean>((resolve) => {
        const checkLoaded = setInterval(() => {
          if (window.google?.maps?.places) {
            isScriptLoaded = true;
            clearInterval(checkLoaded);
            resolve(true);
          }
        }, 100);

        // Timeout after 15 seconds
        setTimeout(() => {
          clearInterval(checkLoaded);
          if (!window.google?.maps?.places) {
            resolve(false);
          }
        }, 15000);
      });
    }

    isScriptLoading = true;

    return new Promise<boolean>((resolve) => {
      (window as any).initGoogleMapsCallback = () => {
        isScriptLoaded = true;
        isScriptLoading = false;
        resolve(true);
      };

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        isScriptLoading = false;
        loadPromise = null;
        resolve(false);
      };
      document.head.appendChild(script);
    });
  })();

  return loadPromise;
};

// Check if Google Maps is loaded
export const isGoogleMapsLoaded = (): boolean => {
  return isScriptLoaded || !!window.google?.maps?.places;
};

// Check if script is currently loading
export const isGoogleMapsLoading = (): boolean => {
  return isScriptLoading;
};