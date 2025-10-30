import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, CheckCircle, Clock, Wrench, FileCheck, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const TrackComplaint = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const [complaintId, setComplaintId] = useState(initialId);
  const [mobile, setMobile] = useState("");
  const [showResult, setShowResult] = useState(!!initialId);
  const [upvotes, setUpvotes] = useState(42);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const mockComplaint = {
    id: complaintId || "LOK12345",
    category: "Water Supply",
    location: "Sector 15, Delhi",
    dateFiled: "20 Dec 2024",
    status: 2, // 0: Filed, 1: Verified, 2: Processing, 3: Resolved
    description: "Frequent water supply disruption in residential area affecting 200+ households.",
    remarks: "Assigned to Water Department. Pipeline repair work in progress.",
  };

  const timeline = [
    { status: "Filed", icon: FileCheck, completed: true },
    { status: "Verified", icon: CheckCircle, completed: true },
    { status: "In Process", icon: Wrench, completed: true },
    { status: "Resolved", icon: Clock, completed: false },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId && !mobile) {
      toast.error("Please enter Complaint ID or Mobile Number");
      return;
    }
    setShowResult(true);
    toast.success("Complaint found!");
  };

  const handleUpvote = () => {
    if (!hasUpvoted) {
      setUpvotes(upvotes + 1);
      setHasUpvoted(true);
      toast.success("Upvoted successfully!");
    } else {
      toast.info("You've already upvoted this complaint");
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
              Enter your Complaint ID or Mobile Number to track status
            </p>
          </div>

          {/* Search Form */}
          <Card className="gradient-card shadow-xl p-8 mb-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="complaintId">Complaint ID</Label>
                  <Input
                    id="complaintId"
                    placeholder="LOK12345"
                    value={complaintId}
                    onChange={(e) => setComplaintId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    placeholder="9876543210"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary-dark shadow-md">
                <Search className="w-5 h-5 mr-2" />
                Track Complaint
              </Button>
            </form>
          </Card>

          {/* Results */}
          {showResult && (
            <div className="space-y-8 animate-fade-in">
              {/* Status Timeline */}
              <Card className="gradient-card shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-8 text-center">Complaint Status</h2>

                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-8 left-0 right-0 h-1 bg-border">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
                      style={{ width: `${(mockComplaint.status / (timeline.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Timeline Steps */}
                  <div className="relative grid grid-cols-4 gap-4">
                    {timeline.map((step, index) => {
                      const Icon = step.icon;
                      const isCompleted = index <= mockComplaint.status;
                      const isActive = index === mockComplaint.status;

                      return (
                        <div key={index} className="flex flex-col items-center gap-3">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                              isCompleted
                                ? "bg-gradient-hero shadow-glow scale-110"
                                : "bg-muted border-2 border-border"
                            }`}
                          >
                            <Icon className={`w-8 h-8 ${isCompleted ? "text-white" : "text-muted-foreground"}`} />
                          </div>
                          <p
                            className={`text-sm font-medium text-center ${
                              isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.status}
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
                      <p className="font-medium">{mockComplaint.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date Filed</p>
                      <p className="font-medium">{mockComplaint.dateFiled}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Category</p>
                      <p className="font-medium">{mockComplaint.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p className="font-medium">{mockComplaint.location}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm leading-relaxed">{mockComplaint.description}</p>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-1">Latest Remarks</p>
                    <p className="text-sm leading-relaxed font-medium text-primary">{mockComplaint.remarks}</p>
                  </div>

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
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackComplaint;
