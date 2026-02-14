import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Send, X, User, Mail, Phone, Sparkles, ShieldCheck, Loader2, AlertTriangle, CheckCircle2, ThumbsUp, Search } from "lucide-react";
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<{
    isDuplicate: boolean;
    confidence: number;
    matchingComplaintId?: string;
    matchingReason?: string;
    matchingComplaint?: {
      id: string;
      title: string;
      category: string;
      location_address: string;
      upvotes: number;
      status: string;
    };
  } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verified' | 'failed' | 'warning'>('idle');
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
    setVerificationStatus('idle');
    toast.success("Image removed");
  };

  // Re-validate images when category changes
  useEffect(() => {
    if (formData.category && images.length > 0) {
      setVerificationStatus('idle');
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

  const handleVerifyComplaint = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image to verify");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a category first");
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('idle');
    setDuplicateResult(null);

    try {
      // Validate all images and collect results directly
      const results: Array<{ match: boolean; confidence: number; imageQuality: string } | null> = [];

      for (let idx = 0; idx < images.length; idx++) {
        try {
          const base64 = await fileToBase64(images[idx]);
          const { data, error } = await supabase.functions.invoke("validate-complaint-image", {
            body: { imageBase64: base64, category: formData.category },
          });
          if (error) throw error;
          results.push(data);
        } catch {
          results.push(null);
        }
      }

      let allPassed = true;
      let anyWarning = false;

      for (const r of results) {
        if (r && !r.match && r.confidence >= 0.8) {
          allPassed = false;
          break;
        }
        if (r && (!r.match || r.imageQuality === 'blurry' || r.imageQuality === 'dark' || r.imageQuality === 'unclear')) {
          anyWarning = true;
        }
      }

      if (!allPassed) {
        setVerificationStatus('failed');
        toast.error("Image doesn't match the selected category! Upload a relevant image or switch to 'Other' category.");
      } else if (anyWarning) {
        setVerificationStatus('warning');
        toast.warning("Images verified with warnings. You can still submit, but consider uploading clearer images.");
      } else if (results.every(r => r === null)) {
        toast.warning("Could not verify images due to a temporary issue. You can still submit your complaint.");
        setVerificationStatus('warning');
      } else {
        setVerificationStatus('verified');
        toast.success("✅ All images verified successfully! Your complaint is ready to submit.");
      }

      // Run duplicate detection (only if verification didn't fail)
      if (allPassed) {
        setIsCheckingDuplicate(true);
        try {
          const firstImageBase64 = await fileToBase64(images[0]);
          const { data: dupData, error: dupError } = await supabase.functions.invoke("detect-duplicate-complaint", {
            body: {
              imageBase64: firstImageBase64,
              category: formData.category,
              locationLat: formData.locationLat,
              locationLng: formData.locationLng,
              title: formData.title,
              description: formData.description,
            },
          });
          if (!dupError && dupData?.isDuplicate) {
            setDuplicateResult(dupData);
            toast.warning("A similar complaint already exists in your area!");
          }
        } catch (dupErr) {
          console.error("Duplicate check failed (non-blocking):", dupErr);
        } finally {
          setIsCheckingDuplicate(false);
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
      toast.warning("Verification service temporarily unavailable. You can still submit your complaint.");
      setVerificationStatus('warning');
    } finally {
      setIsVerifying(false);
    }
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

    if (images.length > 0 && verificationStatus === 'idle') {
      toast.error("Please verify your images before submitting");
      return false;
    }

    if (hasBlockingMismatch()) {
      toast.error("One or more images don't match the selected category. Please upload real images.");
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
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <ImageValidationBadge
                          result={validationResults[idx] ?? null}
                          isValidating={validatingIndexes.has(idx)}
                          onApplySuggestion={handleApplySuggestion}
                          onApplyCategory={handleApplyCategory}
                          currentCategory={formData.category}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {images.length}/5 images selected
                </p>
              </div>

              {/* Verification Status Banner */}
              {verificationStatus === 'verified' && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-medium">Images Verified Successfully</p>
                    <p className="text-sm opacity-80">Your complaint images match the selected category. Ready to submit!</p>
                  </div>
                </div>
              )}
              {verificationStatus === 'failed' && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium">Image Does Not Match Category</p>
                    <p className="text-sm opacity-80">
                      The uploaded image(s) do not match the selected category "<strong>{formData.category}</strong>". Please:
                    </p>
                    <ul className="text-sm opacity-80 list-disc list-inside space-y-1">
                      <li>Upload a real image that matches your selected category</li>
                      <li>Or change the category to "<strong>Other</strong>" if your issue doesn't fit standard categories</li>
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: "Other" }));
                        setVerificationStatus('idle');
                        toast.info('Category changed to "Other". You can now re-verify or submit.');
                      }}
                    >
                      Switch to "Other" Category
                    </Button>
                  </div>
                </div>
              )}
              {verificationStatus === 'warning' && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-medium">Verified with Warnings</p>
                    <p className="text-sm opacity-80">Some images may have quality issues. You can still submit your complaint.</p>
                  </div>
                </div>
              )}

              {/* Duplicate Detection Alert */}
              {isCheckingDuplicate && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted border border-border">
                  <Loader2 className="w-5 h-5 shrink-0 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">Checking for similar complaints...</p>
                    <p className="text-sm text-muted-foreground">AI is comparing your complaint with existing ones in the area.</p>
                  </div>
                </div>
              )}

              {duplicateResult?.isDuplicate && duplicateResult.matchingComplaint && (
                <div className="p-5 rounded-lg bg-accent/50 border-2 border-accent">
                  <div className="flex items-start gap-3">
                    <Search className="w-6 h-6 shrink-0 text-primary mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-semibold text-lg">Similar Complaint Already Exists!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {duplicateResult.matchingReason}
                        </p>
                      </div>
                      <div className="bg-background rounded-md p-4 border border-border space-y-2">
                        <p className="font-medium">{duplicateResult.matchingComplaint.title}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded">{duplicateResult.matchingComplaint.category}</span>
                          <span className="bg-muted px-2 py-0.5 rounded">{duplicateResult.matchingComplaint.status}</span>
                          <span className="bg-muted px-2 py-0.5 rounded">📍 {duplicateResult.matchingComplaint.location_address}</span>
                          <span className="bg-muted px-2 py-0.5 rounded">👍 {duplicateResult.matchingComplaint.upvotes} upvotes</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          onClick={() => navigate(`/track-complaint?id=${duplicateResult.matchingComplaint!.id}`)}
                          className="flex-1"
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          View & Upvote This Complaint
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDuplicateResult(null)}
                          className="flex-1"
                        >
                          Submit Anyway
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verify & Submit Buttons */}
              <div className="flex flex-col gap-3 pt-6">
                {images.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleVerifyComplaint}
                    disabled={isVerifying || isCheckingDuplicate || images.length === 0 || !formData.category}
                    variant={verificationStatus === 'verified' ? 'outline' : 'secondary'}
                    className="w-full"
                    size="lg"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        AI is Analyzing Images...
                      </>
                    ) : verificationStatus === 'verified' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Re-Verify Images
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 mr-2" />
                        Verify Complaint Images
                      </>
                    )}
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || (images.length > 0 && verificationStatus !== 'verified' && verificationStatus !== 'warning')}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
                  {images.length > 0 && verificationStatus === 'idle'
                    ? "Please verify your images before submitting"
                    : "Your complaint will be automatically assigned to the relevant department"}
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default FileComplaint;