import { CheckCircle, Clock, Hash, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ComplaintTicketProps {
  open: boolean;
  onClose: () => void;
  complaintId: string;
  resolutionTime: string;
}

export const ComplaintTicket = ({ open, onClose, complaintId, resolutionTime }: ComplaintTicketProps) => {
  const navigate = useNavigate();
  
  const handleTrack = () => {
    onClose();
    navigate(`/track-complaint?id=${complaintId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Complaint Filed Successfully!</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center animate-scale-in">
              <CheckCircle className="w-12 h-12 text-secondary" />
            </div>
          </div>

          {/* Ticket Details */}
          <div className="space-y-4 bg-muted/50 rounded-lg p-6">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <Hash className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Complaint ID</p>
                <p className="text-lg font-bold font-mono text-primary">{complaintId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Filed On</p>
                <p className="font-semibold">{new Date().toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Expected Resolution</p>
                <p className="font-semibold text-accent">{resolutionTime}</p>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-primary/5 rounded-lg p-4 text-sm text-muted-foreground text-center">
            Save this Complaint ID to track your complaint status anytime
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={handleTrack} className="flex-1">
              Track Complaint
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
