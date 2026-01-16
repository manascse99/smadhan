import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, X, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

type Props = {
  complaints?: Complaint[];
};

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

const ComplaintsMap = ({ complaints: externalComplaints }: Props) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>(externalComplaints || []);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(externalComplaints === undefined);

  // Keep local complaints in sync when parent passes them
  useEffect(() => {
    if (externalComplaints) {
      setComplaints(externalComplaints);
      setIsLoading(false);
    }
  }, [externalComplaints]);

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
      setIsLoading(false);
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

  const complaintsWithLocations = useMemo(
    () => complaints.filter((c) => c.location_lat != null && c.location_lng != null),
    [complaints]
  );

  // Init map (wait until the container is actually mounted)
  useEffect(() => {
    if (isLoading) return;
    if (!mapContainerRef.current) return;

    const container = mapContainerRef.current;

    // If the map already exists (e.g., tab re-renders), just refresh sizing
    if (mapRef.current) {
      mapRef.current.invalidateSize();
      return;
    }

    mapRef.current = L.map(container, {
      zoomControl: true,
      attributionControl: true,
    }).setView(INDIA_CENTER, 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(mapRef.current);

    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

    // Fix blank maps when mounted inside tabs/dialogs where size is 0 at first paint
    const ro = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    ro.observe(container);

    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);

    return () => {
      ro.disconnect();
      mapRef.current?.off();
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [isLoading]);

  // Create a location pin icon with the given color
  const createPinIcon = (color: string) => {
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="#ffffff" stroke="${color}" stroke-width="1"/>
      </svg>
    `;
    return L.divIcon({
      html: svgIcon,
      className: "custom-pin-icon",
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
    });
  };

  // Render markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (complaintsWithLocations.length === 0) {
      map.setView(INDIA_CENTER, 5);
      return;
    }

    const bounds = L.latLngBounds([]);

    complaintsWithLocations.forEach((c) => {
      const lat = c.location_lat!;
      const lng = c.location_lng!;
      const color = statusColors[c.status] || "#6b7280";

      const marker = L.marker([lat, lng], {
        icon: createPinIcon(color),
      });

      marker.on("click", () => {
        setSelectedComplaint(c);
        map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
      });

      marker.bindPopup(
        `<div style="min-width:180px">
          <div style="font-weight:600; margin-bottom:4px">${escapeHtml(c.title)}</div>
          <div style="font-size:12px; opacity:.8">${escapeHtml(c.location_address)}</div>
        </div>`
      );

      marker.addTo(layer);
      bounds.extend([lat, lng]);
    });

    if (complaintsWithLocations.length === 1) {
      map.setView(bounds.getCenter(), 12);
    } else {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [complaintsWithLocations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Complaint Hotspot Map
          <Badge variant="secondary" className="ml-2">
            {complaintsWithLocations.length} locations
          </Badge>
        </CardTitle>
        <div className="flex gap-2 text-xs flex-wrap mt-2">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize">{statusLabels[status]}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="h-[500px] rounded-lg bg-muted/30 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="relative">
            <div ref={mapContainerRef} className="h-[500px] rounded-lg overflow-hidden" />

            {selectedComplaint && (
              <div className="absolute bottom-4 left-4 right-4 bg-background border rounded-lg p-4 shadow-lg z-[1000]">
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
              Showing {complaintsWithLocations.length} complaint(s) • Click markers to view details
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default ComplaintsMap;
