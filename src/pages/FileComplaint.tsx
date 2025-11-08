import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Upload, Send, X, User, Mail, Phone } from "lucide-react";
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
    fullName: "",
    mobile: "",
    email: "",
    title: "",
    category: "",
    description: "",
    location: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [charCount, setCharCount] = useState(0);
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

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 1000) {
      setFormData({ ...formData, description: text });
      setCharCount(text.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.fullName || !formData.mobile || !formData.email || 
        !formData.title || !formData.category || !formData.description || !formData.location) {
      toast.error("Please fill all required fields");
      return;
    }

    // Validate mobile number
    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    // Validate email
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!user) {
      toast.error("Please login to submit a complaint");
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert complaint into database
      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          user_id: user.id,
          title: formData.title,
          description: `Contact: ${formData.fullName} | Phone: ${formData.mobile} | Email: ${formData.email}\n\n${formData.description}`,
          category: formData.category as any,
          location_address: formData.location,
        }])
        .select()
        .single();

      if (error) throw error;

      // Calculate estimated resolution time
      const resolutionDays = Math.floor(Math.random() * 8) + 7;
      const resolutionDate = new Date();
      resolutionDate.setDate(resolutionDate.getDate() + resolutionDays);
      const resolution = `${resolutionDays} days (by ${resolutionDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;

      setComplaintId(data.id);
      setResolutionTime(resolution);
      setShowTicket(true);
      
      toast.success("Complaint submitted successfully!");
      
      // Reset form
      setFormData({
        fullName: "",
        mobile: "",
        email: "",
        title: "",
        category: "",
        description: "",
        location: "",
      });
      setImages([]);
      setCharCount(0);
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

          {/* Form */}
          <Card className="gradient-card shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details Section */}
              <div className="space-y-6 pb-6 border-b border-border">
                <h2 className="text-xl font-semibold">Personal Details</h2>
                
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="mobile"
                      placeholder="Enter 10-digit mobile number"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="pl-10"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Complaint Details Section */}
              <div className="space-y-6 pt-2">
                <h2 className="text-xl font-semibold">Complaint Details</h2>

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

              {/* Image Upload (Optional) */}
              <div className="space-y-2">
                <Label>Upload Images (Optional - Max 5)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop supporting images
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
                  {images.length}/5 images uploaded
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Submitting Complaint...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Complaint
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Your complaint will be automatically assigned to the relevant department
                </p>
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
