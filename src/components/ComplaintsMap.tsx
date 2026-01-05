import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

interface Complaint {
  id: string;
  title: string;
  status: string;
  category: string;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string;
}

interface ComplaintsMapProps {
  mapboxToken: string;
}

const statusColors: Record<string, string> = {
  filed: "#ef4444",
  verified: "#f97316",
  processing: "#eab308",
  resolved: "#22c55e",
  escalated: "#dc2626",
  fund_required: "#8b5cf6",
};

const ComplaintsMap = ({ mapboxToken }: ComplaintsMapProps) => {
  const { t } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, title, status, category, location_lat, location_lng, location_address")
        .not("location_lat", "is", null)
        .not("location_lng", "is", null);

      if (!error && data) {
        setComplaints(data);
      }
    };

    fetchComplaints();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || complaints.length === 0) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [78.9629, 20.5937], // Center of India
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    complaints.forEach((complaint) => {
      if (complaint.location_lat && complaint.location_lng) {
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

        el.addEventListener("click", () => {
          setSelectedComplaint(complaint);
        });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, complaints]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("complaintMap")}
          <div className="flex gap-2 ml-auto text-xs">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{t(status)}</span>
              </div>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div ref={mapContainer} className="h-[500px] rounded-lg" />
          {selectedComplaint && (
            <div className="absolute bottom-4 left-4 right-4 bg-background border rounded-lg p-4 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{selectedComplaint.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedComplaint.location_address}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge>{selectedComplaint.category}</Badge>
                    <Badge
                      style={{
                        backgroundColor: statusColors[selectedComplaint.status],
                      }}
                    >
                      {t(selectedComplaint.status)}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplaintsMap;
