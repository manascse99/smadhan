import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Target,
  Star,
  Award,
  FileText,
  Users,
  Calendar,
  BarChart3
} from "lucide-react";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock admin data - in production, fetch from backend
  const adminData = {
    fullName: "Rajesh Kumar",
    email: "rajesh.kumar@govt.in",
    department: "Electricity",
    position: "Senior Engineer",
    employeeId: "EMP-2024-1234",
    joinDate: "January 2020",
    avatar: "",
  };

  const performanceStats = {
    totalHandled: 234,
    resolved: 198,
    inProgress: 28,
    pending: 8,
    monthlyTarget: 50,
    monthlyCompleted: 42,
    satisfactionRate: 4.6,
    avgResolutionTime: "3.2 days",
  };

  // Mock complaints data
  const mockComplaints = [
    {
      id: "CMP-2024-001",
      title: "Street light not working",
      status: "Resolved",
      priority: "Medium",
      submittedDate: "2024-10-28",
      resolvedDate: "2024-10-30",
      satisfaction: 5,
    },
    {
      id: "CMP-2024-002",
      title: "Power outage in Sector 15",
      status: "In Progress",
      priority: "High",
      submittedDate: "2024-11-01",
      resolvedDate: null,
      satisfaction: null,
    },
    {
      id: "CMP-2024-003",
      title: "Faulty electricity meter",
      status: "Resolved",
      priority: "High",
      submittedDate: "2024-10-25",
      resolvedDate: "2024-10-27",
      satisfaction: 4,
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-status-resolved text-white";
      case "In Progress":
        return "bg-status-processing text-white";
      case "Pending":
        return "bg-status-pending text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-destructive text-destructive-foreground";
      case "Medium":
        return "bg-status-processing text-white";
      case "Low":
        return "bg-status-pending text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8 border-2 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
                <AvatarImage src={adminData.avatar} alt={adminData.fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(adminData.fullName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{adminData.fullName}</h1>
                  <Badge className="bg-accent text-accent-foreground w-fit mx-auto md:mx-0">
                    Admin Officer
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2">{adminData.email}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-primary" />
                    <strong>{adminData.department}</strong> - {adminData.position}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-primary" />
                    ID: {adminData.employeeId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    Joined {adminData.joinDate}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Handled</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{performanceStats.totalHandled}</div>
              <p className="text-xs text-muted-foreground mt-1">All time complaints</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-status-resolved" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-resolved">{performanceStats.resolved}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((performanceStats.resolved / performanceStats.totalHandled) * 100)}% resolution rate
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-yellow-600">{performanceStats.satisfactionRate}</div>
                <span className="text-muted-foreground">/5.0</span>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= performanceStats.satisfactionRate
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{performanceStats.avgResolutionTime}</div>
              <p className="text-xs text-muted-foreground mt-1">Time to resolve</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Target */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Monthly Target Progress
                </CardTitle>
                <CardDescription>November 2024 Target: {performanceStats.monthlyTarget} complaints</CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {performanceStats.monthlyCompleted}/{performanceStats.monthlyTarget}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress 
              value={(performanceStats.monthlyCompleted / performanceStats.monthlyTarget) * 100} 
              className="h-4"
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{Math.round((performanceStats.monthlyCompleted / performanceStats.monthlyTarget) * 100)}% Complete</span>
              <span>{performanceStats.monthlyTarget - performanceStats.monthlyCompleted} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Complaints Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Managed Complaints</CardTitle>
            <CardDescription>View and track complaints you've handled</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resolved">Resolved ({performanceStats.resolved})</TabsTrigger>
                <TabsTrigger value="progress">In Progress ({performanceStats.inProgress})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({performanceStats.pending})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-status-resolved/10 border-status-resolved">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                          <p className="text-2xl font-bold text-status-resolved">{performanceStats.resolved}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-status-resolved" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-status-processing/10 border-status-processing">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                          <p className="text-2xl font-bold text-status-processing">{performanceStats.inProgress}</p>
                        </div>
                        <Clock className="h-8 w-8 text-status-processing" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-status-pending/10 border-status-pending">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pending</p>
                          <p className="text-2xl font-bold text-status-pending">{performanceStats.pending}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-status-pending" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  {mockComplaints.map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">{complaint.title}</h3>
                              <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                              <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">ID: {complaint.id}</p>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span>Submitted: {complaint.submittedDate}</span>
                              {complaint.resolvedDate && (
                                <span>Resolved: {complaint.resolvedDate}</span>
                              )}
                              {complaint.satisfaction && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                  {complaint.satisfaction}/5
                                </span>
                              )}
                            </div>
                          </div>
                          <Button onClick={() => navigate("/admin/dashboard")}>
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="resolved" className="space-y-3 mt-6">
                {mockComplaints
                  .filter((c) => c.status === "Resolved")
                  .map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">{complaint.title}</h3>
                              <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                              {complaint.satisfaction && (
                                <span className="flex items-center gap-1 text-sm">
                                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                  {complaint.satisfaction}/5
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">ID: {complaint.id}</p>
                            <p className="text-sm text-muted-foreground">Resolved: {complaint.resolvedDate}</p>
                          </div>
                          <Button onClick={() => navigate("/admin/dashboard")}>
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="progress" className="space-y-3 mt-6">
                {mockComplaints
                  .filter((c) => c.status === "In Progress")
                  .map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">{complaint.title}</h3>
                              <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">ID: {complaint.id}</p>
                            <p className="text-sm text-muted-foreground">Submitted: {complaint.submittedDate}</p>
                          </div>
                          <Button onClick={() => navigate("/admin/dashboard")}>
                            Manage
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <p className="text-center text-muted-foreground py-8">No pending complaints</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
