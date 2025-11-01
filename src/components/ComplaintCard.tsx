import { useState } from "react";
import { MapPin, ThumbsUp, Calendar, Hash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Complaint } from "@/types/complaint";
import { toast } from "sonner";

interface ComplaintCardProps {
  complaint: Complaint;
  onUpvote: (id: string) => void;
}

export const ComplaintCard = ({ complaint, onUpvote }: ComplaintCardProps) => {
  const [isUpvoted, setIsUpvoted] = useState(complaint.hasUpvoted || false);
  const [upvoteCount, setUpvoteCount] = useState(complaint.upvotes);

  const handleUpvote = () => {
    if (isUpvoted) {
      setUpvoteCount(prev => prev - 1);
      setIsUpvoted(false);
      toast.info("Upvote removed");
    } else {
      setUpvoteCount(prev => prev + 1);
      setIsUpvoted(true);
      toast.success("Complaint upvoted!");
    }
    onUpvote(complaint.id);
  };

  const statusColors = {
    filed: "status-filed",
    verified: "status-verified",
    processing: "status-processing",
    resolved: "status-resolved"
  };

  return (
    <Card className="gradient-card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">{complaint.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
          </div>
          <span className={`status-badge ${statusColors[complaint.status]}`}>
            {complaint.status}
          </span>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 text-sm">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-primary">{complaint.category}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{complaint.location.address}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(complaint.date).toLocaleDateString('en-IN')}
            </div>
            <div className="flex items-center gap-1 font-medium">
              <ThumbsUp className="w-4 h-4" />
              {upvoteCount} upvotes
            </div>
          </div>
          
          <Button 
            size="sm" 
            variant={isUpvoted ? "default" : "outline"}
            onClick={handleUpvote}
            className="gap-2"
          >
            <ThumbsUp className={`w-4 h-4 ${isUpvoted ? "fill-current" : ""}`} />
            {isUpvoted ? "Upvoted" : "Upvote"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
