import { useState } from "react";
import { Search, CheckCircle, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Complaint {
  id: string;
  citizen: string;
  category: string;
  location: string;
  status: "Filed" | "Verified" | "Processing" | "Resolved";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignedTo: string;
  dateFiled: string;
  description: string;
}

const Admin = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: "LOK12345",
      citizen: "Rahul Kumar",
      category: "Water Supply",
      location: "Sector 15, Delhi",
      status: "Processing",
      priority: "High",
      assignedTo: "Water Dept. Officer",
      dateFiled: "20 Dec 2024",
      description: "Frequent water supply disruption affecting 200+ households.",
    },
    {
      id: "LOK12344",
      citizen: "Priya Sharma",
      category: "Road & Transport",
      location: "MG Road, Bangalore",
      status: "Verified",
      priority: "Urgent",
      assignedTo: "Road Dept. Officer",
      dateFiled: "19 Dec 2024",
      description: "Large pothole causing frequent accidents.",
    },
    {
      id: "LOK12343",
      citizen: "Amit Patel",
      category: "Electricity",
      location: "Phase 2, Noida",
      status: "Resolved",
      priority: "Medium",
      assignedTo: "Power Dept. Officer",
      dateFiled: "18 Dec 2024",
      description: "Power outage in industrial area.",
    },
    {
      id: "LOK12342",
      citizen: "Sneha Reddy",
      category: "Waste Management",
      location: "Koramangala, Bangalore",
      status: "Filed",
      priority: "High",
      assignedTo: "Unassigned",
      dateFiled: "17 Dec 2024",
      description: "Garbage not collected for 10 days.",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Filed":
        return "status-filed";
      case "Verified":
        return "status-verified";
      case "Processing":
        return "status-processing";
      case "Resolved":
        return "status-resolved";
      default:
        return "status-filed";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-blue-500";
      case "Medium":
        return "bg-yellow-500";
      case "High":
        return "bg-orange-500";
      case "Urgent":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleMarkResolved = (id: string) => {
    setComplaints(
      complaints.map((c) => (c.id === id ? { ...c, status: "Resolved" as const } : c))
    );
    setIsDialogOpen(false);
    toast.success("Complaint marked as resolved!");
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDialogOpen(true);
  };

  const filteredComplaints = complaints.filter(
    (c) =>
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.citizen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Admin Panel</h1>
          <p className="text-lg text-muted-foreground">
            Manage and resolve citizen complaints efficiently
          </p>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="lg:col-span-2 gradient-card shadow-lg p-6">
            <label className="text-sm font-medium mb-2 block">Search Complaints</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by ID, citizen, or category..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </Card>

          <Card className="gradient-card shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-8 h-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{complaints.filter((c) => c.status === "Processing").length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </Card>

          <Card className="gradient-card shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-2xl font-bold">{complaints.filter((c) => c.status === "Resolved").length}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Complaints Table */}
        <Card className="gradient-card shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-semibold">ID</th>
                  <th className="text-left p-4 font-semibold">Citizen</th>
                  <th className="text-left p-4 font-semibold">Category</th>
                  <th className="text-left p-4 font-semibold">Location</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Priority</th>
                  <th className="text-left p-4 font-semibold">Assigned To</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{complaint.id}</td>
                    <td className="p-4">{complaint.citizen}</td>
                    <td className="p-4 text-sm">{complaint.category}</td>
                    <td className="p-4 text-sm text-muted-foreground">{complaint.location}</td>
                    <td className="p-4">
                      <span className={`status-badge ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{complaint.assignedTo}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(complaint)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {complaint.status !== "Resolved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkResolved(complaint.id)}
                            className="text-secondary hover:text-secondary"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Complaint ID</p>
                  <p className="font-medium">{selectedComplaint.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Citizen Name</p>
                  <p className="font-medium">{selectedComplaint.citizen}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-medium">{selectedComplaint.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date Filed</p>
                  <p className="font-medium">{selectedComplaint.dateFiled}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span className={`status-badge ${getStatusColor(selectedComplaint.status)}`}>
                    {selectedComplaint.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Priority</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(selectedComplaint.priority)}`}>
                    {selectedComplaint.priority}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm leading-relaxed">{selectedComplaint.description}</p>
              </div>
              <div className="flex gap-3 pt-4">
                {selectedComplaint.status !== "Resolved" && (
                  <Button
                    onClick={() => handleMarkResolved(selectedComplaint.id)}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Admin;
