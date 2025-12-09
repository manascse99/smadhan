import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, CheckCircle, Clock, Wrench, FileCheck, ThumbsUp, Image, Calendar, User, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ComplaintUpdate {
  id: string;
  status: string;
  remarks: string;
  proof_url: string | null;
  proof_urls: string[] | null;
  created_at: string;
  admin_id: string;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location_address: string;
  created_at: string;
  status: string;
  upvotes: number;
  image_urls: string[] | null;
}

const TrackComplaint = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const [complaintId, setComplaintId] = useState(initialId);
  const [showResult, setShowResult] = useState(false);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const statusOrder = ["filed", "verified", "processing", "resolved"];

  const timeline = [
    { status: "filed", label: "Filed", icon: FileCheck },
    { status: "verified", label: "Verified", icon: CheckCircle },
    { status: "processing", label: "In Process", icon: Wrench },
    { status: "resolved", label: "Resolved", icon: Clock },
  ];

  useEffect(() => {
    if (initialId) {
      handleSearch(null, initialId);
    }
  }, [initialId]);

  useEffect(() => {
    if (complaint) {
      const statusIndex = statusOrder.indexOf(complaint.status);
      const target = (statusIndex / (timeline.length - 1)) * 100;
      const id = requestAnimationFrame(() => setProgressWidth(target));
      return () => cancelAnimationFrame(id);
    }
  }, [complaint]);

  const handleSearch = async (e: React.FormEvent | null, searchId?: string) => {
    if (e) e.preventDefault();
    const idToSearch = searchId || complaintId;
    
    if (!idToSearch) {
      toast.error("Please enter Complaint ID");
      return;
    }

    setIsLoading(true);
    try {
      // Fetch complaint
      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', idToSearch.toUpperCase())
        .single();

      if (complaintError || !complaintData) {
        toast.error("Complaint not found");
        setShowResult(false);
        return;
      }

      setComplaint(complaintData);
      setUpvotes(complaintData.upvotes || 0);

      // Fetch updates
      const { data: updatesData } = await supabase
        .from('complaint_updates')
        .select('*')
        .eq('complaint_id', complaintData.id)
        .order('created_at', { ascending: false });

      setUpdates(updatesData || []);
      setShowResult(true);
      toast.success("Complaint found!");
    } catch (error) {
      console.error('Error fetching complaint:', error);
      toast.error("Failed to fetch complaint");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!complaint) return;
    
    if (hasUpvoted) {
      toast.info("You've already upvoted this complaint");
      return;
    }

    try {
      const { error } = await supabase
        .from('complaints')
        .update({ upvotes: upvotes + 1 })
        .eq('id', complaint.id);

      if (error) throw error;

      setUpvotes(upvotes + 1);
      setHasUpvoted(true);
      toast.success("Upvoted successfully!");
    } catch (error) {
      console.error('Error upvoting:', error);
      toast.error("Failed to upvote");
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

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Track Your Complaint</h1>
            <p className="text-lg text-muted-foreground">
              Enter your Complaint ID to track status
            </p>
          </div>

          {/* Search Form */}
          <Card className="gradient-card shadow-xl p-8 mb-8">
            <form onSubmit={(e) => handleSearch(e)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="complaintId">Complaint ID</Label>
                <Input
                  id="complaintId"
                  placeholder="LOK12345"
                  value={complaintId}
                  onChange={(e) => setComplaintId(e.target.value)}
                  className="text-center text-lg font-mono"
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-primary hover:bg-primary-dark shadow-md"
                disabled={isLoading}
              >
                <Search className="w-5 h-5 mr-2" />
                {isLoading ? "Searching..." : "Track Complaint"}
              </Button>
            </form>
          </Card>

          {/* Results */}
          {showResult && complaint && (
            <div className="space-y-8 animate-fade-in">
              {/* Status Timeline */}
              <Card className="gradient-card shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-8 text-center">Complaint Status</h2>

                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-8 left-0 right-0 h-2 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full progress-fill transition-[width] duration-1000 ease-out rounded-full"
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>

                  {/* Timeline Steps */}
                  <div className="relative grid grid-cols-4 gap-4">
                    {timeline.map((step, index) => {
                      const Icon = step.icon;
                      const statusIndex = statusOrder.indexOf(complaint.status);
                      const isCompleted = index <= statusIndex;
                      const isActive = index === statusIndex;

                      return (
                        <div key={index} className="flex flex-col items-center gap-3">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                              isCompleted
                                ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.8),0_0_40px_rgba(16,185,129,0.4)] scale-110"
                                : "bg-muted/50 border-2 border-muted"
                            }`}
                          >
                            <Icon className={`w-8 h-8 ${isCompleted ? "text-white drop-shadow-lg" : "text-muted-foreground/50"}`} />
                          </div>
                          <p
                            className={`text-sm font-medium text-center ${
                              isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Complaint Details */}
              <Card className="gradient-card shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6">Complaint Summary</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Complaint ID</p>
                      <p className="font-medium font-mono">{complaint.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date Filed</p>
                      <p className="font-medium">{new Date(complaint.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Category</p>
                      <p className="font-medium">{complaint.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p className="font-medium">{complaint.location_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Status</p>
                      <Badge className={`${getStatusColor(complaint.status)} text-white`}>
                        {complaint.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Title</p>
                    <p className="font-semibold">{complaint.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm leading-relaxed">{complaint.description}</p>
                  </div>

                  {/* Complaint Media */}
                  {complaint.image_urls && complaint.image_urls.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Complaint Media ({complaint.image_urls.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {complaint.image_urls.map((url, index) => (
                          <div key={index} className="rounded-lg overflow-hidden border">
                            <img 
                              src={url} 
                              alt={`Complaint media ${index + 1}`}
                              className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => window.open(url, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upvote Section */}
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Community Support</p>
                      <p className="text-2xl font-bold text-primary">{upvotes} Upvotes</p>
                    </div>
                    <Button
                      onClick={handleUpvote}
                      variant={hasUpvoted ? "outline" : "default"}
                      size="lg"
                      className={hasUpvoted ? "" : "bg-secondary hover:bg-secondary/90"}
                    >
                      <ThumbsUp className="w-5 h-5 mr-2" />
                      {hasUpvoted ? "Upvoted" : "Upvote"}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Admin Updates - Animated Timeline */}
              {updates.length > 0 && (
                <Card className="gradient-card shadow-xl p-8">
                  <h2 className="text-2xl font-bold mb-6">Progress Updates</h2>
                  
                  <div className="relative">
                    {/* Animated flow line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-muted/30" />
                    
                    <div className="space-y-8">
                      {updates.map((update, index) => (
                        <div 
                          key={update.id} 
                          className="relative pl-12 animate-fade-in"
                          style={{ animationDelay: `${index * 150}ms` }}
                        >
                          {/* Animated checkmark circle */}
                          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-scale-in"
                            style={{ animationDelay: `${index * 150 + 100}ms` }}
                          >
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          
                          {/* Pulse effect */}
                          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-green-500/30 animate-ping" 
                            style={{ animationDuration: '2s', animationDelay: `${index * 150}ms` }}
                          />
                          
                          <div className="bg-muted/30 rounded-lg p-4 border border-border/50 hover:border-primary/30 transition-colors">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <Badge className={`${getStatusColor(update.status)} text-white`}>
                                {update.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(update.created_at).toLocaleDateString()} at {new Date(update.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">{update.remarks}</p>
                            
                            {/* Proof Media - Multiple URLs */}
                            {(update.proof_urls && update.proof_urls.length > 0) || update.proof_url ? (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                  <Image className="w-3 h-3" />
                                  Resolution Proof ({update.proof_urls?.length || 1} file(s))
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {(update.proof_urls || [update.proof_url]).filter(Boolean).map((url, idx) => {
                                    const isVideo = url?.includes('.mp4') || url?.includes('.webm') || url?.includes('.mov');
                                    return (
                                      <div key={idx} className="rounded-lg overflow-hidden border group">
                                        {isVideo ? (
                                          <video 
                                            src={url!}
                                            controls
                                            className="w-full h-24 object-cover"
                                          />
                                        ) : (
                                          <img 
                                            src={url!} 
                                            alt={`Resolution proof ${idx + 1}`}
                                            className="w-full h-24 object-cover group-hover:scale-105 transition-transform cursor-pointer"
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
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackComplaint;