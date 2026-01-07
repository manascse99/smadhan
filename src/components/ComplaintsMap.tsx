import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, X } from "lucide-react";

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

const ComplaintsMap = ({ complaints: externalComplaints }: Props) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [complaints, setComplaints] = useState<Complaint[]>(externalComplaints || []);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Keep local complaints in sync when parent passes them
  useEffect(() => {
    if (externalComplaints) setComplaints(externalComplaints);
  }, [externalComplaints]);

  // Fetch token from backend function
  useEffect(() => {
    const loadToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mapbox-token");
        if (error) throw error;
        const token = (data as any)?.token as string | undefined;
        if (!token) {
          setMapError("Map token is not configured.");
          return;
        }
        setMapboxToken(token);
      } catch (e) {
        console.error("Failed to load map token", e);
        setMapError("Map token is not configured.");
      }
    };

    loadToken();
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

  // Init map once
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [78.9629, 20.5937],
        zoom: 4,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.current.on("load", () => {
        setIsMapLoaded(true);
      });
    } catch (error) {
      console.error("Map initialization error:", error);
      setMapError("Failed to initialize map.");
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Render markers whenever complaints update
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    complaints.forEach((complaint) => {
      if (complaint.location_lat == null || complaint.location_lng == null) return;

      const el = document.createElement("div");
      el.className = "complaint-marker";
      el.style.width = "24px";
      el.style.height = "24px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = statusColors[complaint.status] || "#6b7280";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([complaint.location_lng, complaint.location_lat])
        .addTo(map.current!);

      el.addEventListener("click", () => setSelectedComplaint(complaint));
      markersRef.current.push(marker);
    });
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
        {mapError && (
          <div className="h-[500px] rounded-lg bg-muted/30 flex items-center justify-center">
            <div className="text-center text-muted-foreground max-w-md px-4">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Map is not available yet</p>
              <p className="text-sm mt-1">
                {mapError} Add your Mapbox public token in backend secrets as
                <span className="font-mono"> MAPBOX_PUBLIC_TOKEN</span>.
              </p>
            </div>
          </div>
        )}

        {!mapError && (
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
