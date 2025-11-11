import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, FileText, CheckCircle, Clock, TrendingUp, MapPin, Locate } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ComplaintCard } from "@/components/ComplaintCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const stats = [
    { label: "Total Filed", value: complaints.length, icon: FileText, color: "primary" },
    { label: "Resolved", value: complaints.filter(c => c.status === 'resolved').length, icon: CheckCircle, color: "secondary" },
    { label: "Pending", value: complaints.filter(c => c.status === 'filed' || c.status === 'verified').length, icon: Clock, color: "accent" },
    { label: "In Progress", value: complaints.filter(c => c.status === 'processing').length, icon: TrendingUp, color: "destructive" },
  ];

  const departmentData = [
    { name: "Water Supply", count: 520, resolved: 420 },
    { name: "Road & Transport", count: 480, resolved: 380 },
    { name: "Electricity", count: 420, resolved: 350 },
    { name: "Waste Management", count: 380, resolved: 320 },
    { name: "Public Health", count: 340, resolved: 290 },
    { name: "Education", count: 280, resolved: 240 },
    { name: "Law & Order", count: 240, resolved: 180 },
    { name: "Corruption", count: 187, resolved: 176 },
  ];

  const statusData = [
    { status: "Filed", count: 542, percentage: 19, color: "status-filed" },
    { status: "Verified", count: 420, percentage: 15, color: "status-verified" },
    { status: "Processing", count: 729, percentage: 26, color: "status-processing" },
    { status: "Resolved", count: 1156, percentage: 40, color: "status-resolved" },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to view your dashboard");
      navigate("/auth");
      return;
    }
    getUserLocation();
    fetchUserComplaints();
  }, [isAuthenticated, navigate]);

  const fetchUserComplaints = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedComplaints = (data || []).map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        location: c.location_address,
        status: c.status,
        date: new Date(c.created_at).toLocaleDateString(),
        upvotes: c.upvotes || 0,
        hasUpvoted: false,
      }));
      
      setComplaints(formattedComplaints);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      toast.error("Failed to load your complaints");
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = () => {
    setIsLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          toast.success("Location detected successfully");
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Location error:", error);
          toast.error("Unable to access location. Please enable location services.");
          setIsLoadingLocation(false);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
    }
  };

  const handleUpvote = (complaintId: string) => {
    setComplaints(prev => 
      prev.map(complaint => 
        complaint.id === complaintId 
          ? { ...complaint, hasUpvoted: !complaint.hasUpvoted }
          : complaint
      )
    );
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesDept = filterDepartment === "all" || complaint.category === filterDepartment;
    const matchesStatus = filterStatus === "all" || complaint.status === filterStatus;
    return matchesDept && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">My Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Track and manage your submitted complaints
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="gradient-card shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="gradient-card shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentData.map((dept) => (
                    <SelectItem key={dept.name} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="filed">Filed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Status Distribution */}
          <Card className="gradient-card shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-secondary" />
              <h2 className="text-xl font-bold">Status Distribution</h2>
            </div>

            <div className="space-y-6">
              {/* Donut Chart Simulation */}
              <div className="relative w-64 h-64 mx-auto">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {statusData.map((item, index) => {
                    const prevPercentage = statusData
                      .slice(0, index)
                      .reduce((sum, s) => sum + s.percentage, 0);
                    const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                    const strokeDashoffset = -prevPercentage;

                    return (
                      <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={`hsl(var(--${item.color}))`}
                        strokeWidth="20"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-4">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full status-${item.status.toLowerCase()}`} />
                    <div>
                      <p className="text-sm font-medium">{item.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.count} ({item.percentage}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Location-Based Complaints Section */}
        <Card className="gradient-card shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold">Complaints Near You</h2>
                <p className="text-sm text-muted-foreground">{locationAddress || "Detecting your location..."}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={getUserLocation}
              disabled={isLoadingLocation}
              className="gap-2"
            >
              <Locate className="w-4 h-4" />
              {isLoadingLocation ? "Detecting..." : "Refresh Location"}
            </Button>
          </div>

          {/* Complaints Grid */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              {filteredComplaints.length} Your Complaints
            </h3>
            {isLoading ? (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground animate-spin" />
                <p className="text-muted-foreground">Loading your complaints...</p>
              </div>
            ) : filteredComplaints.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredComplaints.map(complaint => (
                  <ComplaintCard 
                    key={complaint.id} 
                    complaint={complaint}
                    onUpvote={handleUpvote}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No complaints filed yet. Submit your first complaint to get started!</p>
                <Button className="mt-4" onClick={() => navigate("/file-complaint")}>
                  File a Complaint
                </Button>
              </div>
            )}
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
