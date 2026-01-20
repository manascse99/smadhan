import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Image, 
  Upload, 
  X, 
  Video, 
  Plus, 
  Calendar, 
  History, 
  AlertTriangle, 
  Wallet,
  MapPin,
  User,
  Phone,
  Mail,
  Building,
  Tag,
  Send,
  FileCheck,
  ClipboardList,
  DollarSign,
  Users,
  Briefcase,
  ArrowUp,
  Minus,
  ArrowDown,
  Timer
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { sendStatusNotification } from "@/utils/notifications";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import PriorityBadge from "@/components/PriorityBadge";
import SLAIndicator from "@/components/SLAIndicator";
import { TooltipProvider } from "@/components/ui/tooltip";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  status: string;
  user_id: string;
  department_id: string | null;
  assigned_to: string | null;
  image_urls: string[] | null;
  satisfaction_rating: number | null;
  priority: "low" | "medium" | "high" | "critical" | null;
  sla_deadline: string | null;
}

interface ComplaintUpdate {
  id: string;
  status: string;
  remarks: string;
  proof_url: string | null;
  proof_urls: string[] | null;
  created_at: string;
  admin_id: string;
}

interface UserProfile {
  full_name: string | null;
  email: string | null;
}

const ManageComplaint = () => {
  const navigate = useNavigate();
  const { complaintId } = useParams<{ complaintId: string }>();
  const { user, isAuthenticated } = useAuth();
  
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [citizenProfile, setCitizenProfile] = useState<UserProfile | null>(null);
  const [previousUpdates, setPreviousUpdates] = useState<ComplaintUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [resourcesUsed, setResourcesUsed] = useState("");
  const [teamInvolved, setTeamInvolved] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundPurpose, setFundPurpose] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical" | "">("");
  const [slaDeadline, setSlaDeadline] = useState<Date | undefined>(undefined);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<{ url: string; type: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login first");
      navigate("/auth");
      return;
    }

    if (!user || (user.role !== "admin" && user.role !== "officer")) {
      toast.error("Access denied");
      navigate("/dashboard");
      return;
    }

    if (complaintId) {
      fetchComplaintDetails();
    }
  }, [isAuthenticated, user, complaintId, navigate]);

  const fetchComplaintDetails = async () => {
    if (!complaintId) return;
    
    setIsLoading(true);
    try {
      // Fetch complaint
      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', complaintId)
        .single();

      if (complaintError) throw complaintError;
      
      // Cast priority to proper type
      const typedComplaint: Complaint = {
        ...complaintData,
        priority: complaintData.priority as "low" | "medium" | "high" | "critical" | null,
        sla_deadline: complaintData.sla_deadline,
      };
      
      setComplaint(typedComplaint);
      setNewStatus(complaintData.status);
      setPriority(complaintData.priority as "low" | "medium" | "high" | "critical" || "");
      if (complaintData.sla_deadline) {
        setSlaDeadline(new Date(complaintData.sla_deadline));
      }

      // Fetch citizen profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', complaintData.user_id)
        .single();

      setCitizenProfile(profileData);

      // Fetch previous updates
      const { data: updates } = await supabase
        .from('complaint_updates')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: false });

      setPreviousUpdates(updates || []);
    } catch (error: any) {
      console.error('Error fetching complaint:', error);
      toast.error("Failed to load complaint details");
      navigate('/admin/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: { url: string; type: string }[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB per file.`);
        return;
      }

      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isImage) {
        toast.error(`${file.name} is not a valid image or video file.`);
        return;
      }

      newFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({
          url: reader.result as string,
          type: isVideo ? 'video' : 'image'
        });
        if (newPreviews.length === newFiles.length) {
          setProofFiles(prev => [...prev, ...newFiles]);
          setProofPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeProof = (index: number) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
    setProofPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateComplaint = async () => {
    if (!complaint || !user) return;

    if (!remarks.trim()) {
      toast.error("Please enter update remarks");
      return;
    }

    if (newStatus === 'escalated' && !escalationReason.trim()) {
      toast.error("Please provide escalation reason");
      return;
    }

    if (newStatus === 'fund_required' && (!fundAmount.trim() || !fundPurpose.trim())) {
      toast.error("Please provide fund amount and purpose");
      return;
    }

    setIsUpdating(true);
    try {
      const proofUrls: string[] = [];

      // Upload all proof files
      if (proofFiles.length > 0) {
        setIsUploading(true);
        
        for (let i = 0; i < proofFiles.length; i++) {
          const file = proofFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${complaint.id}_${Date.now()}_${i}.${fileExt}`;
          const filePath = `proofs/${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('complaint-media')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast.error(`Failed to upload ${file.name}`);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('complaint-media')
            .getPublicUrl(filePath);

          proofUrls.push(publicUrl);
          setUploadProgress(Math.round(((i + 1) / proofFiles.length) * 100));
        }
        setIsUploading(false);
      }

      // Build full remarks with all details
      let fullRemarks = remarks;
      
      if (resolutionSummary.trim()) {
        fullRemarks += `\n\n**Resolution Summary:** ${resolutionSummary}`;
      }
      if (actionsTaken.trim()) {
        fullRemarks += `\n\n**Actions Taken:** ${actionsTaken}`;
      }
      if (estimatedCost.trim()) {
        fullRemarks += `\n\n**Estimated Cost:** ₹${estimatedCost}`;
      }
      if (resourcesUsed.trim()) {
        fullRemarks += `\n\n**Resources Used:** ${resourcesUsed}`;
      }
      if (teamInvolved.trim()) {
        fullRemarks += `\n\n**Team Involved:** ${teamInvolved}`;
      }
      if (nextSteps.trim()) {
        fullRemarks += `\n\n**Next Steps:** ${nextSteps}`;
      }
      if (newStatus === 'escalated' && escalationReason.trim()) {
        fullRemarks += `\n\n**Escalation Reason:** ${escalationReason}`;
      }
      if (newStatus === 'fund_required') {
        fullRemarks += `\n\n**Fund Required:** ₹${fundAmount}`;
        fullRemarks += `\n**Fund Purpose:** ${fundPurpose}`;
      }

      const updateData: Record<string, any> = { 
        status: newStatus as any,
        resolution_date: newStatus === 'resolved' ? new Date().toISOString() : null
      };
      
      // Add priority if set
      if (priority) {
        updateData.priority = priority;
      }
      
      // Add SLA deadline if set
      if (slaDeadline) {
        updateData.sla_deadline = slaDeadline.toISOString();
      }

      const { error: complaintError } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaint.id);

      if (complaintError) throw complaintError;

      const { error: updateError } = await supabase
        .from('complaint_updates')
        .insert({
          complaint_id: complaint.id,
          admin_id: user.id,
          status: newStatus as any,
          remarks: fullRemarks,
          proof_url: proofUrls.length > 0 ? proofUrls[0] : null,
          proof_urls: proofUrls.length > 0 ? proofUrls : null,
        });

      if (updateError) throw updateError;

      // Fetch user details to send notification with email
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', complaint.user_id)
        .single();

      const { data: adminData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Send notification to the user (both in-app and email)
      await sendStatusNotification(
        complaint.id,
        complaint.user_id,
        userData?.email || '',
        userData?.full_name || 'Citizen',
        complaint.title,
        complaint.status,
        newStatus,
        fullRemarks,
        adminData?.full_name || 'Admin'
      );

      toast.success("Complaint updated successfully");
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      toast.error(error.message || "Failed to update complaint");
    } finally {
      setIsUpdating(false);
      setIsUploading(false);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Complaint Not Found</h2>
            <Button onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Complaint</h1>
              <p className="text-muted-foreground font-mono text-lg">{complaint.id}</p>
            </div>
            <Badge className={`${getStatusColor(complaint.status)} text-white text-lg px-4 py-2`}>
              {getStatusLabel(complaint.status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Complaint Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Complaint Info Card */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Complaint Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Title</Label>
                  <p className="font-semibold">{complaint.title}</p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="text-sm whitespace-pre-wrap">{complaint.description}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Category
                    </Label>
                    <p className="font-medium">{complaint.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Filed On
                    </Label>
                    <p className="font-medium">{new Date(complaint.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location
                  </Label>
                  <p className="font-medium">{complaint.location_address}</p>
                </div>

                {/* Priority and SLA Display */}
                {(complaint.priority || complaint.sla_deadline) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      {complaint.priority && (
                        <div>
                          <Label className="text-muted-foreground text-xs flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" /> Priority
                          </Label>
                          <div className="mt-1">
                            <PriorityBadge priority={complaint.priority} />
                          </div>
                        </div>
                      )}
                      {complaint.sla_deadline && (
                        <div>
                          <Label className="text-muted-foreground text-xs flex items-center gap-1">
                            <Timer className="w-3 h-3" /> SLA Deadline
                          </Label>
                          <div className="mt-1">
                            <SLAIndicator slaDeadline={complaint.sla_deadline} status={complaint.status} />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Citizen Info Card */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Citizen Information
              </h2>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Full Name</Label>
                  <p className="font-medium">{citizenProfile?.full_name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </Label>
                  <p className="font-medium text-sm">{citizenProfile?.email || "N/A"}</p>
                </div>
              </div>
            </Card>

            {/* Attached Media */}
            {complaint.image_urls && complaint.image_urls.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  Attached Media ({complaint.image_urls.length})
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {complaint.image_urls.map((url, index) => (
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
              </Card>
            )}

            {/* Previous Updates */}
            {previousUpdates.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Update History ({previousUpdates.length})
                </h2>
                
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {previousUpdates.map((update) => (
                    <div 
                      key={update.id} 
                      className="p-4 bg-muted/30 rounded-lg border border-border/50"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={`${getStatusColor(update.status)} text-white text-xs`}>
                          {getStatusLabel(update.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(update.created_at).toLocaleDateString()} at {new Date(update.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {update.remarks}
                      </p>
                      
                      {/* Show previous proof files */}
                      {(update.proof_urls && update.proof_urls.length > 0) || update.proof_url ? (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            Proof ({update.proof_urls?.length || 1} file(s))
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {(update.proof_urls || [update.proof_url]).filter(Boolean).map((url, idx) => {
                              const isVideo = url?.includes('.mp4') || url?.includes('.webm') || url?.includes('.mov');
                              return (
                                <div key={idx} className="w-16 h-16 rounded border overflow-hidden">
                                  {isVideo ? (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                      <Video className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <img 
                                      src={url!} 
                                      alt={`Previous proof ${idx + 1}`}
                                      className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                                      onClick={() => window.open(url!, '_blank')}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Update Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-primary" />
                Update Complaint Status
              </h2>

              <div className="space-y-6">
                {/* Status Selection */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-base font-medium">New Status *</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="bg-background h-12">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="filed">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-status-filed" />
                          <span>Filed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="verified">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-status-verified" />
                          <span>Verified</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="processing">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-status-processing" />
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="escalated">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span>Escalated (Higher Authority)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="fund_required">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-purple-500" />
                          <span>Fund Required</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="resolved">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-status-resolved" />
                          <span>Resolved</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority and SLA Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/20">
                  {/* Priority Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-base font-medium flex items-center gap-2">
                      <ArrowUp className="w-4 h-4" />
                      Priority Level
                    </Label>
                    <Select value={priority} onValueChange={(val) => setPriority(val as "low" | "medium" | "high" | "critical")}>
                      <SelectTrigger className="bg-background h-12">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <ArrowDown className="w-4 h-4 text-muted-foreground" />
                            <span>Low</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Minus className="w-4 h-4 text-accent-foreground" />
                            <span>Medium</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <ArrowUp className="w-4 h-4 text-status-processing" />
                            <span>High</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="critical">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <span>Critical</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {priority && (
                      <div className="mt-2">
                        <PriorityBadge priority={priority || null} />
                      </div>
                    )}
                  </div>

                  {/* SLA Deadline */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      SLA Deadline
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 justify-start text-left font-normal",
                            !slaDeadline && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {slaDeadline ? format(slaDeadline, "PPP") : "Select deadline"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={slaDeadline}
                          onSelect={setSlaDeadline}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                        <div className="p-3 border-t space-y-2">
                          <p className="text-xs text-muted-foreground">Quick set:</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSlaDeadline(addDays(new Date(), 1))}
                            >
                              24h
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSlaDeadline(addDays(new Date(), 3))}
                            >
                              3 days
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSlaDeadline(addDays(new Date(), 7))}
                            >
                              1 week
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {slaDeadline && complaint && (
                      <div className="mt-2">
                        <SLAIndicator slaDeadline={slaDeadline.toISOString()} status={newStatus || complaint.status} />
                      </div>
                    )}
                    {slaDeadline && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => setSlaDeadline(undefined)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear deadline
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Main Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="remarks" className="text-base font-medium">Update Message / Remarks *</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Enter detailed update message for the citizen..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Escalation Fields */}
                {newStatus === 'escalated' && (
                  <Card className="p-4 border-orange-500/50 bg-orange-500/5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="w-5 h-5" />
                      Escalation Details
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="escalationReason">Reason for Escalation *</Label>
                      <Textarea
                        id="escalationReason"
                        placeholder="Explain why this complaint needs to be escalated to higher authority..."
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </Card>
                )}

                {/* Fund Required Fields */}
                {newStatus === 'fund_required' && (
                  <Card className="p-4 border-purple-500/50 bg-purple-500/5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-600">
                      <DollarSign className="w-5 h-5" />
                      Fund Requirement Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fundAmount">Amount Required (₹) *</Label>
                        <Input
                          id="fundAmount"
                          type="number"
                          placeholder="Enter amount in rupees"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="fundPurpose">Purpose of Fund *</Label>
                        <Textarea
                          id="fundPurpose"
                          placeholder="Describe what the fund will be used for..."
                          value={fundPurpose}
                          onChange={(e) => setFundPurpose(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                )}

                <Separator />

                {/* Resolution Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="resolutionSummary" className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      Resolution Summary
                    </Label>
                    <Textarea
                      id="resolutionSummary"
                      placeholder="Describe what was resolved or fixed..."
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actionsTaken" className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Actions Taken
                    </Label>
                    <Textarea
                      id="actionsTaken"
                      placeholder="List the steps taken to address this issue..."
                      value={actionsTaken}
                      onChange={(e) => setActionsTaken(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedCost" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Estimated Cost (₹)
                    </Label>
                    <Input
                      id="estimatedCost"
                      type="number"
                      placeholder="Enter estimated cost"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resourcesUsed" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Resources Used
                    </Label>
                    <Input
                      id="resourcesUsed"
                      placeholder="Equipment, materials, etc."
                      value={resourcesUsed}
                      onChange={(e) => setResourcesUsed(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamInvolved" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Involved
                    </Label>
                    <Input
                      id="teamInvolved"
                      placeholder="Names or departments involved"
                      value={teamInvolved}
                      onChange={(e) => setTeamInvolved(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nextSteps" className="flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                      Next Steps
                    </Label>
                    <Input
                      id="nextSteps"
                      placeholder="What needs to be done next"
                      value={nextSteps}
                      onChange={(e) => setNextSteps(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Proof Upload Section */}
                <div className="space-y-4 p-6 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload Proof Media
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload images or videos showing resolution progress
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-sm">{proofFiles.length} file(s)</Badge>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProofUpload}
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-dashed h-16"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Images / Videos
                  </Button>

                  {/* Preview Grid */}
                  {proofPreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mt-4">
                      {proofPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          {preview.type === 'video' ? (
                            <div className="h-28 rounded-lg bg-muted flex items-center justify-center border">
                              <Video className="w-10 h-10 text-muted-foreground" />
                            </div>
                          ) : (
                            <img 
                              src={preview.url} 
                              alt={`Proof ${index + 1}`} 
                              className="h-28 w-full rounded-lg object-cover border"
                            />
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeProof(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-3" />
                      <p className="text-sm text-muted-foreground text-center">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleUpdateComplaint} 
                  className="w-full h-14 text-lg" 
                  size="lg"
                  disabled={isUpdating || isUploading}
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Updating Complaint...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Update
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </TooltipProvider>
  );
};

export default ManageComplaint;
