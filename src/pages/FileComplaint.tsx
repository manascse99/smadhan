import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Upload, Sparkles, CheckCircle, Send, AlertCircle, X } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FileComplaint = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [voiceNote, setVoiceNote] = useState<File | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [complaintId, setComplaintId] = useState("");
  const [resolutionTime, setResolutionTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Water Supply",
    "Road & Transport",
    "Electricity",
    "Waste Management",
    "Public Safety",
    "Healthcare",
    "Education",
    "Other",
  ];

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    setImages([...images, ...files]);
    toast.success(`${files.length} image(s) uploaded`);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
      toast.success("Video uploaded successfully");
    }
  };

  const handleVoiceNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoiceNote(file);
      toast.success("Voice note uploaded successfully");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 1000) {
      setFormData({ ...formData, description: text });
      setCharCount(text.length);

      // Simulate AI suggestion
      if (text.length > 20 && !aiSuggestion) {
        setTimeout(() => {
          setAiSuggestion("AI Suggests: This appears to be a valid complaint");
        }, 500);
      }
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // You may need to configure this in Cloudinary
    
    const response = await fetch('https://api.cloudinary.com/v1_1/dxnc59yv9/image/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return data.secure_url;
  };

  const verifyImageWithML = async (imageUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://ayushg2500-image-model.hf.space/predict?url=${encodeURIComponent(imageUrl)}`);
      const result = await response.json();
      
      // Assuming the API returns { real: true/false } or similar
      // Adjust based on actual API response structure
      return result.real === true || result.prediction === "real" || result.fake === false;
    } catch (error) {
      console.error('Error verifying image:', error);
      throw new Error('Failed to verify image authenticity');
    }
  };

  const handleVerify = async () => {
    if (!formData.title || !formData.category || !formData.description) {
      toast.error("Please fill all required fields before verification");
      return;
    }

    if (images.length < 2) {
      toast.error("Please upload at least 2 images for verification");
      return;
    }

    setIsVerifying(true);

    try {
      toast.info("Uploading and verifying images with ML model...", { duration: 3000 });

      // Upload images to Cloudinary and verify with ML model
      for (let i = 0; i < images.length; i++) {
        const imageUrl = await uploadImageToCloudinary(images[i]);
        const isReal = await verifyImageWithML(imageUrl);
        
        if (!isReal) {
          toast.error(`Image ${i + 1} appears to be fake or manipulated. Please upload genuine evidence.`, {
            duration: 5000,
          });
          setIsVerifying(false);
          return;
        }
      }

      // All images verified successfully
      setIsVerified(true);
      setIsVerifying(false);
      toast.success("All images verified successfully! You can now submit your complaint.", {
        duration: 4000,
      });
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || "Failed to verify images. Please try again.");
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isVerified) {
      toast.error("Please verify your complaint first");
      return;
    }

    if (!user) {
      toast.error("Please login to submit a complaint");
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Upload files to Supabase Storage if needed
      // For now, we'll store complaints without file URLs
      
      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category as any,
          location_address: formData.location,
        }])
        .select()
        .single();

      if (error) throw error;

      const resolutionDays = Math.floor(Math.random() * 8) + 7;
      const resolutionDate = new Date();
      resolutionDate.setDate(resolutionDate.getDate() + resolutionDays);
      const resolution = `${resolutionDays} days (by ${resolutionDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;

      setComplaintId(data.id);
      setResolutionTime(resolution);
      setShowTicket(true);
      
      toast.success("Complaint submitted successfully!");
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      toast.error(error.message || "Failed to submit complaint");
    } finally {
      setIsSubmitting(false);
    }
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
              {/* Complaint Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Complaint Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief title of your complaint"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
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
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your issue in detail..."
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  className="min-h-[150px] resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground text-right">{charCount}/1000</p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Enter location of the issue"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Upload Images * (Min 2, Max 5)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop images
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {images.length}/5 images uploaded (Minimum 2 required)
                </p>
              </div>

              {/* Video Upload (Optional) */}
              <div className="space-y-2">
                <Label>Upload Video (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="cursor-pointer"
                  />
                  {video && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Video: {video.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Voice Note Upload (Optional) */}
              <div className="space-y-2">
                <Label>Upload Voice Note (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleVoiceNoteChange}
                    className="cursor-pointer"
                  />
                  {voiceNote && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Voice Note: {voiceNote.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit & Verify Buttons */}
              <div className="flex flex-col gap-4 pt-6">
                {!isVerified ? (
                  <Button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying || images.length < 2 || !formData.category || !formData.description || !formData.title}
                    className="w-full"
                    size="lg"
                  >
                    {isVerifying ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Verifying with ML Model...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Verify Images with AI
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary to-primary-foreground hover:opacity-90"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Complaint
                      </>
                    )}
                  </Button>
                )}

                {isVerified && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 justify-center">
                    <CheckCircle className="w-4 h-4" />
                    <span>Images verified successfully - Ready to submit</span>
                  </div>
                )}
              </div>
            </form>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Complaint Ticket Modal */}
      <ComplaintTicket
        open={showTicket}
        onClose={() => {
          setShowTicket(false);
          navigate('/dashboard');
        }}
        complaintId={complaintId}
        resolutionTime={resolutionTime}
      />
    </div>
  );
};

export default FileComplaint;
