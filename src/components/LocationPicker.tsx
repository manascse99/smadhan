import { useState, useEffect } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface LocationPickerProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
}

const LocationPicker = ({ value, onChange }: LocationPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 20.5937, lng: 78.9629 });
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        setSelectedLocation({ lat: latitude, lng: longitude });
        
        // Reverse geocoding using Nominatim (free service)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          onChange(address, latitude, longitude);
          toast.success("Location detected successfully!");
        } catch (error) {
          onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, latitude, longitude);
          toast.success("Location coordinates captured!");
        }
        setIsLocating(false);
        setIsOpen(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Unable to get your location. Please enable location services.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate lat/lng from click position (simplified for demo)
    const lat = mapCenter.lat + (rect.height / 2 - y) * 0.001;
    const lng = mapCenter.lng + (x - rect.width / 2) * 0.001;
    
    setSelectedLocation({ lat, lng });
    
    // Reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      onChange(address, lat, lng);
    } catch (error) {
      onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      setIsOpen(false);
      toast.success("Location selected!");
    }
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
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                
                {/* Simple map visualization */}
                <div
                  className="relative w-full h-[400px] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border-2 border-dashed border-primary/30 cursor-crosshair overflow-hidden"
                  onClick={handleMapClick}
                >
                  {/* Map grid */}
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className="border border-primary/10" />
                    ))}
                  </div>
                  
                  {/* Center marker for current position */}
                  {selectedLocation && (
                    <div 
                      className="absolute transform -translate-x-1/2 -translate-y-full"
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                    >
                      <div className="relative">
                        <MapPin className="w-8 h-8 text-destructive fill-destructive" />
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-destructive rounded-full animate-ping" />
                      </div>
                    </div>
                  )}
                  
                  {/* Instructions overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      Click anywhere on the map to select a location, or use "Current Location" button
                    </p>
                  </div>
                </div>

                {selectedLocation && (
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <div className="text-sm">
                      <p className="font-medium">Selected coordinates:</p>
                      <p className="text-muted-foreground">
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
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
