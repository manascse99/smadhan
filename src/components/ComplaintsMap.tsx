import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, X, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-cluster";

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

// Create custom colored markers
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

type Props = {
  complaints?: Complaint[];
};

// Component to fit bounds
const FitBounds = ({ complaints }: { complaints: Complaint[] }) => {
  const map = useMap();

  useEffect(() => {
    const validComplaints = complaints.filter(
      (c) => c.location_lat != null && c.location_lng != null
    );

    if (validComplaints.length > 0) {
      const bounds = L.latLngBounds(
        validComplaints.map((c) => [c.location_lat!, c.location_lng!])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [complaints, map]);

  return null;
};

const ComplaintsMap = ({ complaints: externalComplaints }: Props) => {
  const [complaints, setComplaints] = useState<Complaint[]>(externalComplaints || []);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center

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

      if (!error && data) {
        setComplaints(data);
      }
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

  // Custom cluster icon
  const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let color = "#22c55e"; // green for few
    if (count >= 10) color = "#ef4444"; // red for hotspots
    else if (count >= 5) color = "#f97316"; // orange for medium
    else if (count >= 3) color = "#eab308"; // yellow for low-medium

    return L.divIcon({
      html: `<div style="
        background-color: ${color};
        width: ${Math.min(count * 2 + 30, 60)}px;
        height: ${Math.min(count * 2 + 30, 60)}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${count}</div>`,
      className: "custom-cluster-icon",
      iconSize: L.point(40, 40, true),
    });
  };

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
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapContainer
                center={defaultCenter}
                zoom={5}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds complaints={complaintsWithLocations} />
                <MarkerClusterGroup
                  chunkedLoading
                  iconCreateFunction={createClusterCustomIcon}
                >
                  {complaintsWithLocations.map((complaint) => (
                    <Marker
                      key={complaint.id}
                      position={[complaint.location_lat!, complaint.location_lng!]}
                      icon={createColoredIcon(statusColors[complaint.status] || "#6b7280")}
                      eventHandlers={{
                        click: () => setSelectedComplaint(complaint),
                      }}
                    >
                      <Popup>
                        <div className="p-1">
                          <h3 className="font-semibold text-sm">{complaint.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {complaint.location_address}
                          </p>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {complaint.category}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded text-white"
                              style={{
                                backgroundColor: statusColors[complaint.status] || "#6b7280",
                              }}
                            >
                              {statusLabels[complaint.status] || complaint.status}
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            </div>

            {/* Hotspot Legend */}
            <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
              <p className="text-xs font-medium mb-2">Hotspot Intensity</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span>10+ complaints</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500" />
                  <span>5-9 complaints</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  <span>3-4 complaints</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span>1-2 complaints</span>
                </div>
              </div>
            </div>

            {selectedComplaint && (
              <div className="absolute bottom-4 left-4 right-4 bg-background border rounded-lg p-4 shadow-lg z-[1000]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{selectedComplaint.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedComplaint.location_address}
                    </p>
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
              Showing {complaintsWithLocations.length} complaint(s) • Click on clusters to zoom
              into hotspots
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComplaintsMap;
