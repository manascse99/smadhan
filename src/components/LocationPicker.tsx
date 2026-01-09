/// <reference types="google.maps" />
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { loadGoogleMapsScript, isGoogleMapsLoaded } from "@/utils/googleMaps";

interface LocationPickerProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
}

const LocationPicker = ({ value, onChange }: LocationPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Load Google Maps script when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    if (isGoogleMapsLoaded()) {
      setIsMapLoaded(true);
      return;
    }

    setIsLoadingMap(true);

    loadGoogleMapsScript().then((loaded) => {
      setIsMapLoaded(loaded);
      setIsLoadingMap(false);
      if (!loaded) {
        toast.error("Failed to load Google Maps");
      }
    });
  }, [isOpen]);

  const updateMarker = useCallback((lat: number, lng: number) => {
    const position = { lat, lng };

    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else if (mapRef.current) {
      markerRef.current = new window.google.maps.Marker({
        position,
        map: mapRef.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });

      // Add drag end listener
      markerRef.current.addListener("dragend", async () => {
        const pos = markerRef.current?.getPosition();
        if (pos) {
          const newLat = pos.lat();
          const newLng = pos.lng();
          setSelectedLocation({ lat: newLat, lng: newLng });
          await reverseGeocode(newLat, newLng);
        }
      });
    }

    setSelectedLocation({ lat, lng });
    mapRef.current?.panTo(position);
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!window.google?.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        onChange(response.results[0].formatted_address, lat, lng);
      } else {
        onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
      }
    } catch (error) {
      onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
    }
  }, [onChange]);

  // Initialize map when loaded
  useEffect(() => {
    if (!isMapLoaded || !mapContainerRef.current || mapRef.current) return;

    const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center

    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: selectedLocation || defaultCenter,
      zoom: selectedLocation ? 15 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Add click listener for map
    mapRef.current.addListener("click", async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateMarker(lat, lng);
      await reverseGeocode(lat, lng);
    });

    // Initialize autocomplete on the search input
    if (autocompleteInputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {
          componentRestrictions: { country: "in" },
          fields: ["formatted_address", "geometry"],
        }
      );

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          updateMarker(lat, lng);
          mapRef.current?.setCenter({ lat, lng });
          mapRef.current?.setZoom(15);
          setSelectedLocation({ lat, lng });
          onChange(place.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
        }
      });
    }
  }, [isMapLoaded, selectedLocation, updateMarker, reverseGeocode, onChange]);

  const getCurrentLocation = useCallback(() => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (mapRef.current && isMapLoaded) {
          updateMarker(latitude, longitude);
          mapRef.current.setCenter({ lat: latitude, lng: longitude });
          mapRef.current.setZoom(15);
          await reverseGeocode(latitude, longitude);
        } else {
          // Fallback to Nominatim if map not loaded
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            onChange(address, latitude, longitude);
            setSelectedLocation({ lat: latitude, lng: longitude });
          } catch {
            onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, latitude, longitude);
            setSelectedLocation({ lat: latitude, lng: longitude });
          }
        }

        toast.success("Location detected successfully!");
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Unable to get your location. Please enable location services.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [isMapLoaded, updateMarker, reverseGeocode, onChange]);

  const handleConfirm = () => {
    if (selectedLocation) {
      setIsOpen(false);
      toast.success("Location selected!");
    }
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    // Reset map reference so it reinitializes next time
    mapRef.current = null;
    markerRef.current = null;
    autocompleteRef.current = null;
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
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="h-8 px-2"
            title="Use current location"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleDialogClose()}>
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
                {/* Search Input with Autocomplete */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={autocompleteInputRef}
                    type="text"
                    placeholder="Search for a location..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={isLocating}
                    className="flex-1"
                  >
                    <Navigation className={`w-4 h-4 mr-2 ${isLocating ? 'animate-spin' : ''}`} />
                    {isLocating ? "Detecting..." : "Use Current Location"}
                  </Button>
                </div>

                {/* Map Container */}
                <div className="relative">
                  {(isLoadingMap || !isMapLoaded) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading map...</p>
                      </div>
                    </div>
                  )}
                  <div
                    ref={mapContainerRef}
                    className="w-full h-[400px] rounded-lg border bg-muted/30"
                  />
                </div>

                {/* Instructions */}
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