import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, MapPin, Calendar, CheckCircle, Clock, FileText, TrendingUp, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

interface UserComplaint {
  id: string;
  title: string;
  category: string;
  status: "filed" | "verified" | "processing" | "resolved";
  date: string;
  location: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    // Mock user complaints data
    const mockComplaints: UserComplaint[] = [
      {
        id: "LOK12345",
        title: "Broken Water Pipeline",
        category: "Water Supply",
        status: "processing",
        date: "2024-10-28",
        location: "MG Road, Sector 21"
      },
      {
        id: "LOK12346",
        title: "Street Light Not Working",
        category: "Electricity",
        status: "resolved",
        date: "2024-10-25",
        location: "Green Park, Sector 15"
      },
      {
        id: "LOK12347",
        title: "Pothole on Main Street",
        category: "Road & Transport",
        status: "verified",
        date: "2024-10-29",
        location: "Main Street, Sector 18"
      },
    ];

    setComplaints(mockComplaints);
  }, [isAuthenticated, navigate]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filed": return "status-filed";
      case "verified": return "status-verified";
      case "processing": return "status-processing";
      case "resolved": return "status-resolved";
      default: return "status-filed";
    }
  };

  const filedComplaints = complaints.filter(c => c.status === "filed");
  const processingComplaints = complaints.filter(c => c.status === "processing");
  const resolvedComplaints = complaints.filter(c => c.status === "resolved");

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="gradient-card shadow-xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary shadow-lg">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {user?.fullName ? getInitials(user.fullName) : "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{user?.fullName || "User"}</h1>
                <p className="text-muted-foreground mb-3">{user?.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant="secondary" className="text-sm">
                    <User className="w-3 h-3 mr-1" />
                    {user?.role || "Citizen"}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    <Calendar className="w-3 h-3 mr-1" />
                    Member since Oct 2024
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("/file-complaint")} className="shadow-md">
                  <FileText className="w-4 h-4 mr-2" />
                  File New Complaint
                </Button>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{complaints.length}</p>
                  <p className="text-sm text-muted-foreground">Total Complaints</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resolvedComplaints.length}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{processingComplaints.length}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[hsl(var(--status-verified))]/10 rounded-lg">
                  <Award className="w-6 h-6 text-[hsl(var(--status-verified))]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-sm text-muted-foreground">Upvotes Given</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Complaints Tabs */}
          <Card className="gradient-card shadow-xl p-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">All ({complaints.length})</TabsTrigger>
                <TabsTrigger value="processing">Processing ({processingComplaints.length})</TabsTrigger>
                <TabsTrigger value="resolved">Resolved ({resolvedComplaints.length})</TabsTrigger>
                <TabsTrigger value="contributions">Contributions</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {complaints.map((complaint) => (
                  <Card key={complaint.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{complaint.title}</h3>
                          <Badge className={`status-badge ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {complaint.id}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {complaint.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(complaint.date).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/track-complaint?id=${complaint.id}`)}
                      >
                        Track Status
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="processing" className="space-y-4">
                {processingComplaints.map((complaint) => (
                  <Card key={complaint.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{complaint.title}</h3>
                          <Badge className={`status-badge ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {complaint.id}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {complaint.location}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => navigate(`/track-complaint?id=${complaint.id}`)}
                      >
                        Track Status
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="resolved" className="space-y-4">
                {resolvedComplaints.map((complaint) => (
                  <Card key={complaint.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{complaint.title}</h3>
                          <Badge className={`status-badge ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {complaint.id}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {complaint.location}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => navigate(`/track-complaint?id=${complaint.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="contributions" className="space-y-4">
                <Card className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Your Contributions</h3>
                  <p className="text-muted-foreground mb-4">
                    You've helped the community by upvoting and supporting 24 complaints
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">24</p>
                      <p className="text-sm text-muted-foreground">Upvotes Given</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-secondary">8</p>
                      <p className="text-sm text-muted-foreground">Comments Posted</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-accent">3</p>
                      <p className="text-sm text-muted-foreground">Solutions Shared</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
