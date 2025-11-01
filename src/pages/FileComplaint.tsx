import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Upload, Sparkles, CheckCircle, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ComplaintTicket } from "@/components/ComplaintTicket";
import { toast } from "sonner";

const FileComplaint = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    category: "",
    description: "",
    location: "",
  });
  const [fileName, setFileName] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [complaintId, setComplaintId] = useState("");
  const [resolutionTime, setResolutionTime] = useState("");

  const categories = [
    "Water Supply",
    "Road & Transport",
    "Electricity",
    "Waste Management",
    "Public Health",
    "Education",
    "Law & Order",
    "Corruption",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      toast.success("File uploaded successfully");
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 1000) {
      setFormData({ ...formData, description: text });
      setCharCount(text.length);

      // Simulate AI suggestion
      if (text.length > 20 && !aiSuggestion) {
        setTimeout(() => {
          setAiSuggestion("AI Suggests: Water Supply Issue (86% confidence)");
        }, 500);
      }
    }
  };

  const handleVerify = async () => {
    if (!formData.fullName || !formData.mobile || !formData.category || !formData.description) {
      toast.error("Please fill all required fields before verification");
      return;
    }

    setIsVerifying(true);

    // Simulate AI verification process
    setTimeout(() => {
      // Check for duplicate complaints (mock check)
      const isDuplicate = Math.random() < 0.3; // 30% chance of duplicate
      
      if (isDuplicate) {
        toast.error("Similar complaint already exists in your area!", {
          description: "Consider upvoting the existing complaint instead",
          duration: 5000,
        });
        setIsVerifying(false);
        return;
      }

      // Check for fake/invalid images (mock check)
      const isFakeImage = fileName && Math.random() < 0.2; // 20% chance if file uploaded
      
      if (isFakeImage) {
        toast.error("Uploaded image appears to be invalid or fake", {
          description: "Please upload genuine evidence",
          duration: 5000,
        });
        setIsVerifying(false);
        return;
      }

      // Verification successful
      setIsVerified(true);
      setIsVerifying(false);
      toast.success("Complaint verified successfully! You can now submit.", {
        duration: 4000,
      });
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isVerified) {
      toast.error("Please verify your complaint first");
      return;
    }

    const newComplaintId = `LOK${Math.floor(Math.random() * 100000).toString().padStart(5, "0")}`;
    const date = new Date().toLocaleDateString("en-IN");
    
    // Calculate resolution time (7-14 days based on category)
    const resolutionDays = Math.floor(Math.random() * 8) + 7;
    const resolutionDate = new Date();
    resolutionDate.setDate(resolutionDate.getDate() + resolutionDays);
    const resolution = `${resolutionDays} days (by ${resolutionDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;

    // Store in localStorage
    localStorage.setItem("lastComplaintId", newComplaintId);
    localStorage.setItem("lastComplaintDate", date);

    setComplaintId(newComplaintId);
    setResolutionTime(resolution);
    setShowTicket(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">File a Complaint</h1>
            <p className="text-lg text-muted-foreground">
              Your grievance matters. Fill in the details below for swift resolution.
            </p>
          </div>

          {/* AI Suggestion Banner */}
          {aiSuggestion && (
            <Card className="mb-6 p-4 bg-secondary/10 border-secondary/30 animate-fade-in">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-secondary animate-pulse-slow" />
                <p className="text-sm font-medium text-secondary">{aiSuggestion}</p>
              </div>
            </Card>
          )}

          {/* Form */}
          <Card className="gradient-card shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Complaint Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Complaint Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your complaint in detail..."
                  className="min-h-32 resize-none"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {charCount}/1000 characters
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Enter location or address"
                    className="pl-10"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              {/* Map Embed */}
              <div className="space-y-2">
                <Label>Pin Location on Map</Label>
                <div className="w-full h-64 rounded-lg overflow-hidden border border-border">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.1983901719867!2d77.20902931508092!3d28.613939382421935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd371d9e7c4b%3A0x8e3f4c5cc6e4c7f3!2sIndia%20Gate!5e0!3m2!1sen!2sin!4v1629789012345!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Upload Evidence (Photo/Video/Audio)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="file"
                    className="hidden"
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file" className="flex flex-col items-center gap-3 cursor-pointer">
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    {fileName ? (
                      <p className="text-sm font-medium text-primary">{fileName}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Click to upload files</p>
                        <p className="text-xs text-muted-foreground">Max file size: 10MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Verify and Submit Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  type="button"
                  size="lg" 
                  variant={isVerified ? "default" : "outline"}
                  onClick={handleVerify}
                  disabled={isVerifying || isVerified}
                  className={`text-lg transition-all ${
                    isVerified 
                      ? "bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/50" 
                      : ""
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : isVerified ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Verified ✓
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Verify Complaint
                    </>
                  )}
                </Button>

                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={!isVerified}
                  className="text-lg bg-primary hover:bg-primary-dark shadow-md"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Submit Complaint
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
      
      <ComplaintTicket 
        open={showTicket}
        onClose={() => setShowTicket(false)}
        complaintId={complaintId}
        resolutionTime={resolutionTime}
      />
    </div>
  );
};

export default FileComplaint;
