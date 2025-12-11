import { useState } from "react";
import { MapPin, ThumbsUp, Calendar, Hash, Eye, Image, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Complaint } from "@/types/complaint";
import { toast } from "sonner";
import { SatisfactionSurvey } from "./SatisfactionSurvey";

interface ComplaintCardProps {
  complaint: Complaint;
  onUpvote: (id: string) => void;
  onFeedbackSubmit?: () => void;
}

export const ComplaintCard = ({ complaint, onUpvote, onFeedbackSubmit }: ComplaintCardProps) => {
  const [isUpvoted, setIsUpvoted] = useState(complaint.hasUpvoted || false);
  const [upvoteCount, setUpvoteCount] = useState(complaint.upvotes);
  const [showDetails, setShowDetails] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(
    complaint.satisfactionRating !== undefined && complaint.satisfactionRating !== null
  );

  const isResolved = complaint.status === 'resolved';
  const needsFeedback = isResolved && !hasSubmittedFeedback;

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

  const statusColors: Record<string, string> = {
    filed: "status-filed",
    verified: "status-verified",
    processing: "status-processing",
    resolved: "status-resolved",
    escalated: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    fund_required: "bg-purple-500/10 text-purple-600 border-purple-500/20"
  };

  const handleFeedbackSubmit = () => {
    setHasSubmittedFeedback(true);
    setShowSurvey(false);
    onFeedbackSubmit?.();
  };

  // Get all images (support both imageUrl and imageUrls)
  const allImages = [
    ...(complaint.imageUrl ? [complaint.imageUrl] : []),
    ...(complaint.imageUrls || [])
  ];
  const hasImages = allImages.length > 0;
  const previewImage = allImages[0];

  return (
    <>
      <Card className="gradient-card p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer" onClick={() => setShowDetails(true)}>
        <div className="space-y-4">
          {/* Image Preview */}
          {previewImage && (
            <div className="w-full h-48 rounded-lg overflow-hidden relative">
              <img 
                src={previewImage} 
                alt={complaint.title}
                className="w-full h-full object-cover"
              />
              {allImages.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  +{allImages.length - 1}
                </div>
              )}
            </div>
          )}

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
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(true);
                }}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
              <Button 
                size="sm" 
                variant={isUpvoted ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpvote();
                }}
                className="gap-2"
              >
                <ThumbsUp className={`w-4 h-4 ${isUpvoted ? "fill-current" : ""}`} />
                {isUpvoted ? "Upvoted" : "Upvote"}
              </Button>
            </div>
          </div>

          {/* Satisfaction Survey for Resolved Complaints */}
          {needsFeedback && !showSurvey && (
            <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-700">Your complaint is resolved!</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSurvey(true);
                  }}
                  className="gap-1 border-green-500/30 hover:bg-green-500/10"
                >
                  Rate Experience
                </Button>
              </div>
            </div>
          )}

          {/* Show satisfaction rating if already submitted */}
          {hasSubmittedFeedback && complaint.satisfactionRating && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Your rating:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= complaint.satisfactionRating! 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Inline Survey */}
          {showSurvey && (
            <SatisfactionSurvey 
              complaintId={complaint.id} 
              onSubmit={handleFeedbackSubmit}
            />
          )}
        </div>
      </Card>

      {/* Full Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{complaint.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              ID: {complaint.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Images Gallery */}
            {hasImages && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Attached Media ({allImages.length})
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {allImages.map((url, index) => (
                    <div key={index} className="rounded-lg overflow-hidden">
                      <img 
                        src={url} 
                        alt={`${complaint.title} - Image ${index + 1}`}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(url, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`status-badge ${statusColors[complaint.status]}`}>
                {complaint.status}
              </span>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <h3 className="font-semibold">Category</h3>
              <p className="text-muted-foreground">{complaint.category}</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              <p className="text-muted-foreground">{complaint.description}</p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <h3 className="font-semibold">Location</h3>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{complaint.location.address}</span>
              </div>
            </div>

            {/* Date Filed */}
            <div className="space-y-2">
              <h3 className="font-semibold">Date Filed</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(complaint.date).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            {/* Upvotes */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 font-medium">
                <ThumbsUp className="w-5 h-5" />
                <span>{upvoteCount} people support this</span>
              </div>
              <Button 
                variant={isUpvoted ? "default" : "outline"}
                onClick={handleUpvote}
                className="gap-2"
              >
                <ThumbsUp className={`w-4 h-4 ${isUpvoted ? "fill-current" : ""}`} />
                {isUpvoted ? "Upvoted" : "Upvote"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
