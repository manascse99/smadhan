/// <reference types="google.maps" />
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, X, Loader2 } from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  status: string;
  category: string;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string;
}

const statusColors: Record<string, string> = {
  filed: "#ef4444",
  verified: "#f97316",
  processing: "#eab308",
  resolved: "#22c55e",
  escalated: "#dc2626",
  fund_required: "#8b5cf6",
};

const statusLabels: Record<string, string> = {
  filed: "Filed",
  verified: "Verified",
  processing: "In Progress",
  resolved: "Resolved",
  escalated: "Escalated",
  fund_required: "Fund Required",
};

declare global {
  interface Window {
    initGoogleMapsCallback: () => void;
  }
}

type Props = {
  complaints?: Complaint[];
};

const ComplaintsMap = ({ complaints: externalComplaints }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [complaints, setComplaints] = useState<Complaint[]>(externalComplaints || []);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Keep local complaints in sync when parent passes them
  useEffect(() => {
    if (externalComplaints) setComplaints(externalComplaints);
  }, [externalComplaints]);

  // Fetch API key from backend function
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-google-maps-token");
        if (error) throw error;
        const key = data?.apiKey as string | undefined;
        if (!key) {
          setMapError("Google Maps API key is not configured.");
          setIsLoading(false);
          return;
        }
        setApiKey(key);
      } catch (e) {
        console.error("Failed to load Google Maps API key", e);
        setMapError("Google Maps API key is not configured.");
        setIsLoading(false);
      }
    };

    loadApiKey();
  }, []);

  // If no complaints are passed, fetch all complaints with coordinates
  useEffect(() => {
    if (externalComplaints) return;

    const fetchComplaints = async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, title, status, category, location_lat, location_lng, location_address")
        .not("location_lat", "is", null)
        .not("location_lng", "is", null);

      if (!error && data) setComplaints(data);
    };

    fetchComplaints();

    const channel = supabase
      .channel("complaints-map-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaints" },
        () => fetchComplaints()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [externalComplaints]);

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) return;

    // Check if already loaded
    if (window.google?.maps) {
      setIsMapLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      return;
    }

    window.initGoogleMapsCallback = () => {
      setIsMapLoaded(true);
      setIsLoading(false);
    };

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setMapError("Failed to load Google Maps. Please check your API key.");
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup callback
      delete (window as any).initGoogleMapsCallback;
    };
  }, [apiKey]);

  // Initialize map once Google Maps is loaded
  useEffect(() => {
    if (!mapContainer.current || !isMapLoaded || mapRef.current) return;

    try {
      mapRef.current = new window.google.maps.Map(mapContainer.current, {
        center: { lat: 20.5937, lng: 78.9629 }, // India center
        zoom: 5,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
    } catch (error) {
      console.error("Map initialization error:", error);
      setMapError("Failed to initialize map.");
    }
  }, [isMapLoaded]);

  // Render markers whenever complaints update
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidLocations = false;

    complaints.forEach((complaint) => {
      if (complaint.location_lat == null || complaint.location_lng == null) return;

      const position = { lat: complaint.location_lat, lng: complaint.location_lng };

      const marker = new window.google.maps.Marker({
        position,
        map: mapRef.current,
        title: complaint.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: statusColors[complaint.status] || "#6b7280",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
          scale: 12,
        },
      });

      marker.addListener("click", () => {
        setSelectedComplaint(complaint);
        mapRef.current?.panTo(position);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
      hasValidLocations = true;
    });

    // Fit bounds if we have locations
    if (hasValidLocations && markersRef.current.length > 1) {
      mapRef.current.fitBounds(bounds);
    } else if (hasValidLocations && markersRef.current.length === 1) {
      mapRef.current.setCenter(bounds.getCenter());
      mapRef.current.setZoom(12);
    }
  }, [complaints, isMapLoaded]);

  const complaintsWithLocations = useMemo(
    () => complaints.filter((c) => c.location_lat != null && c.location_lng != null).length,
    [complaints]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Complaint Map
          <div className="flex gap-2 ml-auto text-xs flex-wrap">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{statusLabels[status]}</span>
              </div>
            ))}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading && !mapError && (
          <div className="h-[500px] rounded-lg bg-muted/30 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {mapError && (
          <div className="h-[500px] rounded-lg bg-muted/30 flex items-center justify-center">
            <div className="text-center text-muted-foreground max-w-md px-4">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Map is not available yet</p>
              <p className="text-sm mt-1">
                {mapError} Add your Google Maps API key in backend secrets as
                <span className="font-mono"> GOOGLE_MAPS_API_KEY</span>.
              </p>
            </div>
          </div>
        )}

        {!mapError && !isLoading && (
          <div className="relative">
            <div ref={mapContainer} className="h-[500px] rounded-lg bg-muted/30" />

            {selectedComplaint && (
              <div className="absolute bottom-4 left-4 right-4 bg-background border rounded-lg p-4 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{selectedComplaint.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedComplaint.location_address}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge>{selectedComplaint.category}</Badge>
                      <Badge
                        style={{
                          backgroundColor: statusColors[selectedComplaint.status],
                          color: "white",
                        }}
                      >
                        {statusLabels[selectedComplaint.status] || selectedComplaint.status}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-2 text-xs text-muted-foreground">
              Showing {complaintsWithLocations} complaint(s) with locations
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComplaintsMap;
