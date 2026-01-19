import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, LogOut, FileText, CheckCircle2, Clock, User, Star, MapPin } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OfficerMetricsCard from "@/components/OfficerMetricsCard";
import ComplaintsMap from "@/components/ComplaintsMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location_address: string;
  created_at: string;
  status: string;
  user_id: string;
  department_id: string | null;
  assigned_to: string | null;
  image_urls: string[] | null;
  satisfaction_rating: number | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login first");
      navigate("/auth");
      return;
    }

    if (!user) return;

    if (user.role !== "admin" && user.role !== "officer") {
      toast.error("Access denied");
      navigate("/dashboard");
      return;
    }

    fetchComplaints();

    const channel = supabase
      .channel("admin-dashboard-complaints")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, navigate, user]);

  const fetchComplaints = async () => {
    try {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('department')
        .eq('id', user.id)
        .single();

      if (!profile?.department) {
        toast.error("No department assigned to your account");
        return;
      }

      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('name', profile.department)
        .single();

      if (!dept) {
        toast.error("Department not found");
        return;
      }

      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('department_id', dept.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      toast.error("Failed to load complaints");
    }
  };

  const filteredComplaints = complaints.filter(
    (c) =>
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const handleViewDetails = (complaint: Complaint) => {
    navigate(`/admin/manage-complaint/${complaint.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filed": return "bg-status-filed";
      case "verified": return "bg-status-verified";
      case "processing": return "bg-status-processing";
      case "resolved": return "bg-status-resolved";
      case "escalated": return "bg-orange-500";
      case "fund_required": return "bg-purple-500";
      default: return "bg-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "filed": return "Filed";
      case "verified": return "Verified";
      case "processing": return "In Progress";
      case "resolved": return "Resolved";
      case "escalated": return "Escalated";
      case "fund_required": return "Fund Required";
      default: return status;
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Managing: <span className="font-semibold text-primary">{complaints.length} Complaints</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin/profile')} variant="outline">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="gradient-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Complaints</p>
                <p className="text-3xl font-bold">{complaints.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </Card>
          <Card className="gradient-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <p className="text-3xl font-bold">
                  {complaints.filter((c) => c.status === "processing").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-status-processing" />
            </div>
          </Card>
          <Card className="gradient-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                <p className="text-3xl font-bold">
                  {complaints.filter((c) => c.status === "resolved").length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-status-resolved" />
            </div>
          </Card>
          <Card className="gradient-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Escalated</p>
                <p className="text-3xl font-bold">
                  {complaints.filter((c) => c.status === "escalated" || c.status === "fund_required").length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                !
              </div>
            </div>
          </Card>
          <Card className="gradient-card p-6 border-2 border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg. Satisfaction</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">
                    {(() => {
                      const rated = complaints.filter(c => c.satisfaction_rating);
                      if (rated.length === 0) return "-";
                      const avg = rated.reduce((sum, c) => sum + (c.satisfaction_rating || 0), 0) / rated.length;
                      return avg.toFixed(1);
                    })()}
                  </p>
                  <span className="text-sm text-muted-foreground">/5</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {complaints.filter(c => c.satisfaction_rating).length} ratings
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Officer Performance Metrics */}
        <div className="mb-8">
          <OfficerMetricsCard />
        </div>

        {/* Map and Search Tabs */}
        <Tabs defaultValue="list" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="list" className="gap-2">
              <FileText className="w-4 h-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <MapPin className="w-4 h-4" />
              Map View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="mt-6">
            <ComplaintsMap complaints={complaints as any} />
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search by ID, title, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Complaints Table */}
            <Card className="gradient-card shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Location</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Satisfaction</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredComplaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm">{complaint.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{complaint.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground">{complaint.location_address}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm">{new Date(complaint.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${getStatusColor(complaint.status)} text-white`}>
                            {getStatusLabel(complaint.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {complaint.satisfaction_rating ? (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= complaint.satisfaction_rating! 
                                      ? "fill-yellow-400 text-yellow-400" 
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                          ) : complaint.status === 'resolved' ? (
                            <span className="text-xs text-muted-foreground">Pending</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() => handleViewDetails(complaint)}
                            size="sm"
                            variant="outline"
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
