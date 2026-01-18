import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/types/roles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, KeyRound, Building2 } from "lucide-react";

interface GoogleOnboardingDialogProps {
  isOpen: boolean;
  userId: string;
  userEmail: string;
  userName: string;
  onComplete: () => void;
}

export const GoogleOnboardingDialog = ({
  isOpen,
  userId,
  userEmail,
  userName,
  onComplete,
}: GoogleOnboardingDialogProps) => {
  const [role, setRole] = useState<UserRole>(UserRole.CITIZEN);
  const [department, setDepartment] = useState("");
  const [adminPasskey, setAdminPasskey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Validate officer passkey
    if (role === UserRole.OFFICER && adminPasskey !== "991949") {
      toast.error("Invalid officer passkey. Please contact administrator.");
      return;
    }

    if (role === UserRole.OFFICER && !department) {
      toast.error("Please select a department");
      return;
    }

    setIsLoading(true);
    try {
      // Update profile with department if officer
      if (role === UserRole.OFFICER) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ department })
          .eq("id", userId);

        if (profileError) throw profileError;
      }

      // Insert user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([{
          user_id: userId,
          role: role,
        }]);

      if (roleError) throw roleError;

      toast.success("Account setup complete!");
      onComplete();
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Welcome! Please select your role to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={userEmail} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={userName} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Select Your Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.CITIZEN}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Citizen
                  </div>
                </SelectItem>
                <SelectItem value={UserRole.OFFICER}>
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    Officer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === UserRole.OFFICER && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Officer Passkey
                </Label>
                <Input
                  type="password"
                  placeholder="Enter officer passkey"
                  value={adminPasskey}
                  onChange={(e) => setAdminPasskey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Contact your administrator for the passkey
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Department
                </Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Roads & Infrastructure">Roads & Infrastructure</SelectItem>
                    <SelectItem value="Water Supply">Water Supply</SelectItem>
                    <SelectItem value="Electricity">Electricity</SelectItem>
                    <SelectItem value="Sanitation">Sanitation</SelectItem>
                    <SelectItem value="Public Safety">Public Safety</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Environment">Environment</SelectItem>
                    <SelectItem value="Housing">Housing</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-dark"
        >
          {isLoading ? "Setting up..." : "Complete Setup"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
