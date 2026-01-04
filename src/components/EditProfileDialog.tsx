import { useState } from "react";
import { User, Mail, Building, Briefcase, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileData {
  full_name: string;
  email: string;
  department: string | null;
  position: string | null;
  avatar_url: string | null;
}

interface EditProfileDialogProps {
  profileData: ProfileData | null;
  onProfileUpdated: () => void;
}

const EditProfileDialog = ({ profileData, onProfileUpdated }: EditProfileDialogProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profileData?.full_name || "",
    department: profileData?.department || "",
    position: profileData?.position || "",
    avatar_url: profileData?.avatar_url || "",
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from("complaint-media")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("complaint-media")
        .getPublicUrl(data.path);

      setFormData({ ...formData, avatar_url: urlData.publicUrl });
      toast.success("Profile picture uploaded!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          department: formData.department || null,
          position: formData.position || null,
          avatar_url: formData.avatar_url || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      onProfileUpdated();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Update form data when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && profileData) {
      setFormData({
        full_name: profileData.full_name || "",
        department: profileData.department || "",
        position: profileData.position || "",
        avatar_url: profileData.avatar_url || "",
      });
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <User className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={formData.avatar_url || ""} alt={formData.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {formData.full_name ? getInitials(formData.full_name) : "?"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>
            <p className="text-sm text-muted-foreground">Click the camera icon to upload a photo</p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="pl-10"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                value={profileData?.email || ""}
                className="pl-10 bg-muted"
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="pl-10"
                placeholder="Enter your department"
              />
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="pl-10"
                placeholder="Enter your position"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
