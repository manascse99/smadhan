import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Search, LogOut, FileText, Upload, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  status: string;
  priority: string;
  imageUrl?: string;
  citizenName: string;
  citizenContact: string;
  progress: number;
  remarks?: string;
  proofUrls?: string[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [proofFiles, setProofFiles] = useState<FileList | null>(null);
  const [progressUpdate, setProgressUpdate] = useState(0);

  // Mock complaints - in production, these would be filtered by ML model based on department
  const allComplaints: Complaint[] = [
    {
      id: "LOK12345",
      title: "Broken Water Pipeline",
      description: "Major water leakage on MG Road causing water wastage and road damage",
      category: "Water Supply",
      location: "MG Road, Sector 21",
      date: "2024-12-20",
      status: "processing",
      priority: "high",
      citizenName: "Rajesh Kumar",
      citizenContact: "9876543210",
      progress: 35,
      remarks: "Pipeline repair team dispatched",
      proofUrls: [],
    },
    {
      id: "LOK12346",
      title: "Pothole on Main Street",
      description: "Large pothole causing accidents, needs immediate repair",
      category: "Road & Transport",
      location: "Main Street, Sector 18",
      date: "2024-12-19",
      status: "verified",
      priority: "medium",
      citizenName: "Priya Sharma",
      citizenContact: "9876543211",
      progress: 10,
    },
    {
      id: "LOK12347",
      title: "Street Light Not Working",
      description: "Multiple street lights not working in residential area",
      category: "Electricity",
      location: "Green Park, Sector 15",
      date: "2024-12-18",
      status: "filed",
      priority: "low",
      citizenName: "Amit Patel",
      citizenContact: "9876543212",
      progress: 0,
    },
    {
      id: "LOK12348",
      title: "Garbage Not Collected",
      description: "Waste accumulation for past 3 days in residential society",
      category: "Waste Management",
      location: "Rose Garden, Sector 12",
      date: "2024-12-17",
      status: "processing",
      priority: "high",
      citizenName: "Sunita Verma",
      citizenContact: "9876543213",
      progress: 60,
      remarks: "Waste collection scheduled for tomorrow",
    },
  ];

  useEffect(() => {
    const session = localStorage.getItem("admin_session");
    if (!session) {
      toast.error("Please login first");
      navigate("/admin/login");
      return;
    }
    setAdminData(JSON.parse(session));
  }, [navigate]);

  const departmentComplaints = allComplaints.filter(
    (c) => c.category === adminData?.department
  );

  const filteredComplaints = departmentComplaints.filter(
    (c) =>
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setRemarks(complaint.remarks || "");
    setProgressUpdate(complaint.progress);
    setIsDialogOpen(true);
  };

  const handleUpdateProgress = () => {
    if (!proofFiles || proofFiles.length === 0) {
      toast.error("Please upload proof images/videos before updating progress");
      return;
    }

    // Mock ML verification
    toast.loading("Verifying proof with ML model...");
    
    setTimeout(() => {
      toast.dismiss();
      toast.success("Proof verified by ML model. Notification sent to citizen for approval.");
      
      // In production, this would update the database
      if (selectedComplaint) {
        selectedComplaint.progress = progressUpdate;
        selectedComplaint.remarks = remarks;
      }
      
      setIsDialogOpen(false);
      setProofFiles(null);
    }, 2000);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-status-urgent";
      case "medium": return "bg-status-processing";
      case "low": return "bg-status-verified";
      default: return "bg-muted";
    }
  };

  if (!adminData) return null;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Department: <span className="font-semibold text-primary">{adminData.department}</span>
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
                <p className="text-3xl font-bold">{departmentComplaints.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </Card>
          <Card className="gradient-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <p className="text-3xl font-bold">
                  {departmentComplaints.filter((c) => c.status === "processing").length}
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
                  {departmentComplaints.filter((c) => c.status === "resolved").length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-status-resolved" />
            </div>
          </Card>
          <Card className="gradient-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">High Priority</p>
                <p className="text-3xl font-bold">
                  {departmentComplaints.filter((c) => c.priority === "high").length}
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
                  <th className="px-6 py-4 text-left text-sm font-semibold">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Progress</th>
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
                      <p className="text-sm text-muted-foreground">{complaint.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{complaint.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getStatusColor(complaint.status)} text-white`}>
                        {complaint.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getPriorityColor(complaint.priority)} text-white`}>
                        {complaint.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-24">
                        <Progress value={complaint.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{complaint.progress}%</p>
                      </div>
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
                {/* Complaint Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{selectedComplaint.title}</h3>
                    <p className="text-sm text-muted-foreground">{selectedComplaint.description}</p>
                  </div>

                  {selectedComplaint.imageUrl && (
                    <div>
                      <Label>Citizen's Evidence</Label>
                      <img
                        src={selectedComplaint.imageUrl}
                        alt="Complaint evidence"
                        className="w-full rounded-lg mt-2"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Citizen Name</Label>
                      <p className="font-medium">{selectedComplaint.citizenName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Contact</Label>
                      <p className="font-medium">{selectedComplaint.citizenContact}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="font-medium">{selectedComplaint.location}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date Filed</Label>
                      <p className="font-medium">{selectedComplaint.date}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Update */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Update Progress ({progressUpdate}%)</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progressUpdate}
                      onChange={(e) => setProgressUpdate(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks / Update Message</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Enter progress update details..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proof">Upload Proof (Images/Videos) *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <Input
                        id="proof"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => setProofFiles(e.target.files)}
                        className="max-w-xs mx-auto"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Required: Upload images or videos as proof of work
                      </p>
                      {proofFiles && (
                        <p className="text-sm text-primary mt-2">
                          {proofFiles.length} file(s) selected
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Uploaded proof will be verified by ML model and sent to the
                      citizen for approval. Progress will be updated only after verification.
                    </p>
                  </div>

                  <Button onClick={handleUpdateProgress} className="w-full" size="lg">
                    Submit Update for Verification
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
