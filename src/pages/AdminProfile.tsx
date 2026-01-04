import { useState, useEffect } from "react";
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
  Calendar,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EditProfileDialog from "@/components/EditProfileDialog";

interface AdminComplaint {
  id: string;
  title: string;
  status: string;
  category: string;
  created_at: string;
  resolution_date: string | null;
  satisfaction_rating: number | null;
}

interface ProfileData {
  full_name: string;
  email: string;
  department: string | null;
  position: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function AdminProfile() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [stats, setStats] = useState({
    totalHandled: 0,
    resolved: 0,
    inProgress: 0,
    pending: 0,
    monthlyTarget: 50,
    monthlyCompleted: 0,
    satisfactionRate: 0,
    avgResolutionTime: "N/A",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    fetchAdminData();
  }, [isAuthenticated, navigate, user]);

  const fetchAdminData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      setProfileData(profile);

      // Fetch complaints assigned to or updated by this admin
      const { data: updatesData, error: updatesError } = await supabase
        .from('complaint_updates')
        .select('complaint_id')
        .eq('admin_id', user.id);

      if (updatesError) throw updatesError;

      const complaintIds = [...new Set((updatesData || []).map(u => u.complaint_id))];

      if (complaintIds.length > 0) {
        const { data: complaintsData, error: complaintsError } = await supabase
          .from('complaints')
          .select('*')
          .in('id', complaintIds)
          .order('created_at', { ascending: false });

        if (complaintsError) throw complaintsError;
        setComplaints(complaintsData || []);

        // Calculate stats
        const total = complaintsData?.length || 0;
        const resolved = complaintsData?.filter(c => c.status === 'resolved').length || 0;
        const processing = complaintsData?.filter(c => c.status === 'processing').length || 0;
        const filed = complaintsData?.filter(c => c.status === 'filed' || c.status === 'verified').length || 0;

        // Calculate average satisfaction
        const ratingsData = complaintsData?.filter(c => c.satisfaction_rating !== null) || [];
        const avgSatisfaction = ratingsData.length > 0 
          ? ratingsData.reduce((sum, c) => sum + (c.satisfaction_rating || 0), 0) / ratingsData.length 
          : 0;

        // Calculate average resolution time
        const resolvedComplaints = complaintsData?.filter(c => c.resolution_date) || [];
        let avgDays = "N/A";
        if (resolvedComplaints.length > 0) {
          const totalDays = resolvedComplaints.reduce((sum, c) => {
            const created = new Date(c.created_at);
            const resolved = new Date(c.resolution_date!);
            return sum + Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          }, 0);
          avgDays = `${(totalDays / resolvedComplaints.length).toFixed(1)} days`;
        }

        // Monthly completed (this month)
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyResolved = complaintsData?.filter(c => 
          c.resolution_date && new Date(c.resolution_date) >= monthStart
        ).length || 0;

        setStats({
          totalHandled: total,
          resolved,
          inProgress: processing,
          pending: filed,
          monthlyTarget: 50,
          monthlyCompleted: monthlyResolved,
          satisfactionRate: Number(avgSatisfaction.toFixed(1)),
          avgResolutionTime: avgDays,
        });
      }
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-status-resolved text-white";
      case "processing":
        return "bg-status-processing text-white";
      case "verified":
        return "bg-status-verified text-white";
      case "filed":
        return "bg-status-filed text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const memberSince = profileData?.created_at 
    ? new Date(profileData.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : "Loading...";

  const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
  const processingComplaints = complaints.filter(c => c.status === 'processing');
  const pendingComplaints = complaints.filter(c => c.status === 'filed' || c.status === 'verified');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8 border-2 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
                <AvatarImage src={profileData?.avatar_url || ""} alt={profileData?.full_name || "Admin"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {profileData?.full_name ? getInitials(profileData.full_name) : "A"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {isLoading ? "Loading..." : profileData?.full_name || user?.fullName || "Admin"}
                  </h1>
                  <Badge className="bg-accent text-accent-foreground w-fit mx-auto md:mx-0">
                    Admin Officer
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2">{profileData?.email || user?.email}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-primary" />
                    <strong>{profileData?.department || "Department"}</strong>
                    {profileData?.position && ` - ${profileData.position}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    Joined {memberSince}
                  </span>
                </div>
                <div className="mt-4">
                  <EditProfileDialog 
                    profileData={profileData} 
                    onProfileUpdated={fetchAdminData} 
                  />
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
              <div className="text-3xl font-bold text-primary">
                {isLoading ? "..." : stats.totalHandled}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time complaints</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-status-resolved" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-status-resolved">
                {isLoading ? "..." : stats.resolved}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalHandled > 0 
                  ? `${Math.round((stats.resolved / stats.totalHandled) * 100)}% resolution rate`
                  : "No complaints yet"}
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
                <div className="text-3xl font-bold text-yellow-600">
                  {isLoading ? "..." : stats.satisfactionRate || "N/A"}
                </div>
                {stats.satisfactionRate > 0 && <span className="text-muted-foreground">/5.0</span>}
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= stats.satisfactionRate
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
              <div className="text-3xl font-bold text-primary">
                {isLoading ? "..." : stats.avgResolutionTime}
              </div>
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
                <CardDescription>
                  {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Target: {stats.monthlyTarget} complaints
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {stats.monthlyCompleted}/{stats.monthlyTarget}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress 
              value={(stats.monthlyCompleted / stats.monthlyTarget) * 100} 
              className="h-4"
            />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{Math.round((stats.monthlyCompleted / stats.monthlyTarget) * 100)}% Complete</span>
              <span>{stats.monthlyTarget - stats.monthlyCompleted} remaining</span>
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
                <TabsTrigger value="resolved">Resolved ({resolvedComplaints.length})</TabsTrigger>
                <TabsTrigger value="progress">In Progress ({processingComplaints.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingComplaints.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-status-resolved/10 border-status-resolved">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                          <p className="text-2xl font-bold text-status-resolved">{stats.resolved}</p>
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
                          <p className="text-2xl font-bold text-status-processing">{stats.inProgress}</p>
                        </div>
                        <Clock className="h-8 w-8 text-status-processing" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-status-filed/10 border-status-filed">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pending</p>
                          <p className="text-2xl font-bold text-status-filed">{stats.pending}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-status-filed" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {isLoading ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground animate-spin" />
                    <p className="text-muted-foreground">Loading complaints...</p>
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No complaints handled yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {complaints.slice(0, 5).map((complaint) => (
                      <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-foreground">{complaint.title}</h3>
                                <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">ID: {complaint.id}</p>
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span>Submitted: {new Date(complaint.created_at).toLocaleDateString('en-IN')}</span>
                                {complaint.resolution_date && (
                                  <span>Resolved: {new Date(complaint.resolution_date).toLocaleDateString('en-IN')}</span>
                                )}
                                {complaint.satisfaction_rating && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                    {complaint.satisfaction_rating}/5
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
                )}
              </TabsContent>

              <TabsContent value="resolved" className="space-y-3 mt-6">
                {resolvedComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No resolved complaints</p>
                  </div>
                ) : (
                  resolvedComplaints.map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">{complaint.title}</h3>
                              {complaint.satisfaction_rating && (
                                <span className="flex items-center gap-1 text-sm">
                                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                  {complaint.satisfaction_rating}/5
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">ID: {complaint.id}</p>
                            <p className="text-sm text-muted-foreground">
                              Resolved: {complaint.resolution_date 
                                ? new Date(complaint.resolution_date).toLocaleDateString('en-IN')
                                : "N/A"}
                            </p>
                          </div>
                          <Button onClick={() => navigate("/admin/dashboard")}>
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="progress" className="space-y-3 mt-6">
                {processingComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No complaints in progress</p>
                  </div>
                ) : (
                  processingComplaints.map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground">{complaint.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">ID: {complaint.id}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {new Date(complaint.created_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <Button onClick={() => navigate("/admin/dashboard")}>
                            Manage
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                {pendingComplaints.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending complaints</p>
                ) : (
                  <div className="space-y-3">
                    {pendingComplaints.map((complaint) => (
                      <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-foreground">{complaint.title}</h3>
                                <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">ID: {complaint.id}</p>
                              <p className="text-sm text-muted-foreground">
                                Submitted: {new Date(complaint.created_at).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                            <Button onClick={() => navigate("/admin/dashboard")}>
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
