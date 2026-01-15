import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with bundlers
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
}

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

const LocationPicker = ({ value, onChange }: LocationPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasAutoFetched, setHasAutoFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onChange(address, lat, lng);
      } catch {
        onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
      }
    },
    [onChange]
  );

  const setMarker = useCallback(
    (lat: number, lng: number) => {
      const latlng: L.LatLngExpression = [lat, lng];
      const map = mapRef.current;
      if (!map) return;

      if (!markerRef.current) {
        markerRef.current = L.marker(latlng, { draggable: true }).addTo(map);
        markerRef.current.on("dragend", async () => {
          const pos = markerRef.current?.getLatLng();
          if (!pos) return;
          setSelectedLocation({ lat: pos.lat, lng: pos.lng });
          await reverseGeocode(pos.lat, pos.lng);
        });
      } else {
        markerRef.current.setLatLng(latlng);
      }

      map.setView(latlng, Math.max(map.getZoom(), 15), { animate: true });
    },
    [reverseGeocode]
  );

  const handleLocationSelect = useCallback(
    async (lat: number, lng: number) => {
      setSelectedLocation({ lat, lng });
      if (mapRef.current) setMarker(lat, lng);
      await reverseGeocode(lat, lng);
    },
    [reverseGeocode, setMarker]
  );

  const initMapIfNeeded = useCallback(() => {
    if (!isOpen) return;
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const center: [number, number] = selectedLocation
      ? [selectedLocation.lat, selectedLocation.lng]
      : INDIA_CENTER;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(center, selectedLocation ? 15 : 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(mapRef.current);

    mapRef.current.on("click", async (e: L.LeafletMouseEvent) => {
      await handleLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    // If we already have a location, show it
    if (selectedLocation) {
      setMarker(selectedLocation.lat, selectedLocation.lng);
    }

    // Important when inside dialogs/portals
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 150);
  }, [handleLocationSelect, isOpen, selectedLocation, setMarker]);

  // Initialize map when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    // next tick to ensure DialogContent mounted
    const t = setTimeout(() => initMapIfNeeded(), 0);
    return () => clearTimeout(t);
  }, [initMapIfNeeded, isOpen]);

  // Keep map in sync with selected location
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedLocation) return;
    if (!mapRef.current) return;

    setMarker(selectedLocation.lat, selectedLocation.lng);
  }, [isOpen, selectedLocation, setMarker]);

  const destroyMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.off();
      mapRef.current.remove();
    }
    mapRef.current = null;
    markerRef.current = null;
  }, []);

  const getCurrentLocation = useCallback(
    (showToast = true) => {
      setIsLocating(true);
      if (!navigator.geolocation) {
        if (showToast) toast.error("Geolocation is not supported by your browser");
        setIsLocating(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await handleLocationSelect(latitude, longitude);
          if (showToast) toast.success("Location detected successfully!");
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (showToast) toast.error("Unable to get your location. Please enable location services.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    },
    [handleLocationSelect]
  );

  // Auto-fetch location on component mount (only once)
  useEffect(() => {
    if (!hasAutoFetched && !value) {
      setHasAutoFetched(true);
      const timer = setTimeout(() => {
        getCurrentLocation(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [getCurrentLocation, hasAutoFetched, value]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1&countrycodes=in`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        setSelectedLocation({ lat: latitude, lng: longitude });
        onChange(display_name, latitude, longitude);

        // Ensure map exists then set marker + view
        if (!mapRef.current) initMapIfNeeded();
        setTimeout(() => {
          setMarker(latitude, longitude);
        }, 0);

        toast.success("Location found!");
      } else {
        toast.error("Location not found. Please try a different search.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search location.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      setIsOpen(false);
      toast.success("Location selected!");
    }
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    destroyMap();
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Enter location or select from map"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-24"
        />
        <div className="absolute right-1 top-1 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => getCurrentLocation(true)}
            disabled={isLocating}
            className="h-8 px-2"
            title="Use current location"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleDialogClose())}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8 px-2">
                <MapPin className="w-4 h-4 mr-1" />
                Map
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Select Location from Map</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search for a location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Button type="button" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => getCurrentLocation(true)}
                    disabled={isLocating}
                    className="flex-1"
                  >
                    <Navigation className={`w-4 h-4 mr-2 ${isLocating ? "animate-spin" : ""}`} />
                    {isLocating ? "Detecting..." : "Use Current Location"}
                  </Button>
                </div>

                <div className="relative h-[400px] rounded-lg border overflow-hidden bg-muted/30">
                  {!isOpen && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                  <div ref={mapContainerRef} className="h-full w-full" />
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Click on the map to select a location, search above, or use GPS
                </p>

                {selectedLocation && (
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <div className="text-sm">
                      <p className="font-medium">Selected location:</p>
                      <p className="text-muted-foreground truncate max-w-md">
                        {value || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
                      </p>
                    </div>
                    <Button onClick={handleConfirm}>Confirm Location</Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
