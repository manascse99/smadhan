import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Send, X, User, Mail, Phone, Sparkles } from "lucide-react";
import ImageValidationBadge from "@/components/ImageValidationBadge";
import { useImageValidation } from "@/hooks/useImageValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationPicker from "@/components/LocationPicker";
import AuthDialog from "@/components/AuthDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FileComplaint = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    title: "",
    category: "",
    description: "",
    location: "",
    locationLat: undefined as number | undefined,
    locationLng: undefined as number | undefined,
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const previewInputRef = useRef<HTMLInputElement | null>(null);
  const [charCount, setCharCount] = useState(0);
  const { validationResults, validatingIndexes, validateImage, removeValidation, hasBlockingMismatch } = useImageValidation();

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

  // Pre-fill user data if authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            fullName: prev.fullName || profile.full_name || "",
            email: prev.email || profile.email || user.email || "",
          }));
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast.error("Maximum 5 images allowed");
      e.target.value = "";
      return;
    }

    const newUrls = files.map((file) => URL.createObjectURL(file));
    const startIndex = images.length;
    setImages((prev) => [...prev, ...files]);
    setImagePreviewUrls((prev) => [...prev, ...newUrls]);

    // Trigger AI validation for each new image
    files.forEach((file, i) => {
      validateImage(file, startIndex + i, formData.category);
    });

    toast.success(`${files.length} image(s) added`);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    removeValidation(index);
    toast.success("Image removed");
  };

  // Re-validate images when category changes
  useEffect(() => {
    if (formData.category && images.length > 0) {
      images.forEach((file, idx) => {
        validateImage(file, idx, formData.category);
      });
    }
  }, [formData.category]);

  const handleApplySuggestion = (description: string) => {
    if (!formData.description) {
      setFormData((prev) => ({ ...prev, description }));
      setCharCount(description.length);
      toast.success("AI description applied!");
    } else {
      const combined = `${formData.description}\n${description}`;
      if (combined.length <= 1000) {
        setFormData((prev) => ({ ...prev, description: combined }));
        setCharCount(combined.length);
        toast.success("AI description appended!");
      } else {
        toast.error("Description would exceed 1000 characters");
      }
    }
  };

  const handleApplyCategory = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
    toast.success(`Category changed to "${category}"`);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 1000) {
      setFormData({ ...formData, description: text });
      setCharCount(text.length);
    }
  };

  const uploadImages = async (userId: string, complaintId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${userId}/${complaintId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('complaint-media')
        .upload(fileName, image);
      
      if (error) {
        console.error('Image upload error:', error);
        continue;
      }
      
      const { data: urlData } = supabase.storage
        .from('complaint-media')
        .getPublicUrl(data.path);
      
      uploadedUrls.push(urlData.publicUrl);
    }
    
    return uploadedUrls;
  };

  const validateForm = (): boolean => {
    if (!formData.fullName || !formData.mobile || !formData.email || 
        !formData.title || !formData.category || !formData.description || !formData.location) {
      toast.error("Please fill all required fields");
      return false;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const submitComplaint = useCallback(async (currentUser: { id: string }) => {
    if (!currentUser) return;

    setIsSubmitting(true);

    try {
      // First create the complaint
      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          user_id: currentUser.id,
          title: formData.title,
          description: `Contact: ${formData.fullName} | Phone: ${formData.mobile} | Email: ${formData.email}\n\n${formData.description}`,
          category: formData.category as any,
          location_address: formData.location,
          location_lat: formData.locationLat || null,
          location_lng: formData.locationLng || null,
        }])
        .select()
        .single();

      if (error) throw error;

      // Upload images if any
      if (images.length > 0) {
        const imageUrls = await uploadImages(currentUser.id, data.id);
        
        if (imageUrls.length > 0) {
          await supabase
            .from('complaints')
            .update({ image_urls: imageUrls })
            .eq('id', data.id);
        }
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-complaint-confirmation', {
          body: {
            email: formData.email,
            name: formData.fullName,
            complaintId: data.id,
            title: formData.title,
            category: formData.category,
            description: formData.description,
            location: formData.location,
            department: formData.category,
          }
        });
        console.log('Confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      toast.success(`Complaint submitted successfully! Tracking ID: ${data.id}`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || "Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
      setPendingSubmit(false);
    }
  }, [formData, images, navigate]);

  // Auto-submit when user becomes authenticated after auth dialog
  useEffect(() => {
    if (pendingSubmit && user && isAuthenticated) {
      submitComplaint(user);
    }
  }, [pendingSubmit, user, isAuthenticated, submitComplaint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // If not authenticated, show auth dialog
    if (!isAuthenticated || !user) {
      setPendingSubmit(true);
      setShowAuthDialog(true);
      return;
    }

    // User is authenticated, submit directly
    submitComplaint(user);
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    // The useEffect will handle the auto-submit when user becomes authenticated
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
            {!isAuthenticated && (
              <p className="text-sm text-primary mt-2">
                You can fill the form first. Login is only required when submitting.
              </p>
            )}
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
                <LocationPicker
                  value={formData.location}
                  onChange={(address, lat, lng) => 
                    setFormData({ 
                      ...formData, 
                      location: address, 
                      locationLat: lat, 
                      locationLng: lng 
                    })
                  }
                />
              </div>

              {/* Image Upload (Optional) */}
              <div className="space-y-2">
                <Label>Upload Images (Optional - Max 5)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <label htmlFor="complaint-images-input" className="block cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload supporting images
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG/JPG • Up to 5 files
                    </p>
                  </label>
                  <Input
                    ref={previewInputRef}
                    id="complaint-images-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {images.map((_, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={imagePreviewUrls[idx] ?? ""}
                          alt={`Uploaded image ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                          loading="lazy"
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
                  {images.length}/5 images selected
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
                      {isAuthenticated ? "Submit Complaint" : "Login & Submit Complaint"}
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

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => {
          setShowAuthDialog(false);
          setPendingSubmit(false);
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default FileComplaint;