import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, LogOut, FileText, CheckCircle2, Clock, Image } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login first");
      navigate("/auth");
      return;
    }
    fetchComplaints();
  }, [isAuthenticated, navigate]);

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
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setRemarks("");
    setIsDialogOpen(true);
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint || !user) return;

    if (!remarks.trim()) {
      toast.error("Please enter remarks");
      return;
    }

    setIsUpdating(true);
    try {
      const { error: complaintError } = await supabase
        .from('complaints')
        .update({ status: newStatus as any })
        .eq('id', selectedComplaint.id);

      if (complaintError) throw complaintError;

      const { error: updateError } = await supabase
        .from('complaint_updates')
        .insert({
          complaint_id: selectedComplaint.id,
          admin_id: user.id,
          status: newStatus as any,
          remarks: remarks,
        });

      if (updateError) throw updateError;

      toast.success("Complaint updated successfully");
      setIsDialogOpen(false);
      fetchComplaints();
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      toast.error(error.message || "Failed to update complaint");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filed": return "bg-status-filed";
      case "verified": return "bg-status-verified";
      case "processing": return "bg-status-processing";
      case "resolved": return "bg-status-resolved";
      default: return "bg-muted";
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
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <p className="text-sm text-muted-foreground mb-1">Verified</p>
                <p className="text-3xl font-bold">
                  {complaints.filter((c) => c.status === "verified").length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-status-urgent flex items-center justify-center text-white font-bold">
                !
              </div>
            </div>
          </Card>
        </div>

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
                        {complaint.status}
                      </Badge>
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

        {/* Update Progress Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Complaint - {selectedComplaint?.id}</DialogTitle>
            </DialogHeader>

            {selectedComplaint && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{selectedComplaint.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </div>

                  {/* Attached Media */}
                  {selectedComplaint.image_urls && selectedComplaint.image_urls.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Attached Media ({selectedComplaint.image_urls.length})
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedComplaint.image_urls.map((url, index) => (
                          <div key={index} className="rounded-lg overflow-hidden border">
                            <img 
                              src={url} 
                              alt={`Complaint Image ${index + 1}`}
                              className="w-full h-32 object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => window.open(url, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Complaint ID</Label>
                      <p className="font-medium font-mono">{selectedComplaint.id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Category</Label>
                      <p className="font-medium">{selectedComplaint.category}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="font-medium">{selectedComplaint.location_address}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date Filed</Label>
                      <p className="font-medium">{new Date(selectedComplaint.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Current Status</Label>
                      <Badge className={`${getStatusColor(selectedComplaint.status)} text-white`}>
                        {selectedComplaint.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="status">Update Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="filed">Filed</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks / Update Message *</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Enter update details for the citizen..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <Button 
                    onClick={handleUpdateComplaint} 
                    className="w-full" 
                    size="lg"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Submit Update"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
