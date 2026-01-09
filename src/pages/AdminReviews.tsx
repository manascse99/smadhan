import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Check, X, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Review {
  id: string;
  name: string;
  email: string;
  rating: number;
  review: string;
  is_approved: boolean;
  created_at: string;
}

const AdminReviews = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (user && user.role !== "admin" && user.role !== "officer") {
      navigate("/dashboard");
      return;
    }
    fetchAllReviews();
  }, [isAuthenticated, user, navigate]);

  const fetchAllReviews = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch reviews");
    } else {
      setReviews(data || []);
    }
    setIsLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) {
      toast.error("Failed to approve review");
    } else {
      toast.success("Review approved");
      setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: true } : r));
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: false })
      .eq('id', id);

    if (error) {
      toast.error("Failed to reject review");
    } else {
      toast.success("Review rejected");
      setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: false } : r));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete review");
    } else {
      toast.success("Review deleted");
      setReviews(reviews.filter(r => r.id !== id));
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );

  const pendingCount = reviews.filter(r => !r.is_approved).length;
  const approvedCount = reviews.filter(r => r.is_approved).length;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Reviews</h1>
            <p className="text-muted-foreground">Approve or reject user reviews</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-2xl font-bold">{reviews.length}</div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending Approval</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </Card>
        </div>

        {/* Reviews Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No reviews found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="max-w-md">Review</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.name}</div>
                        <div className="text-sm text-muted-foreground">{review.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2">{review.review}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(review.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={review.is_approved ? "default" : "secondary"}>
                        {review.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!review.is_approved && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleApprove(review.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {review.is_approved && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 hover:text-orange-700"
                            onClick={() => handleReject(review.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Review</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this review? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(review.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default AdminReviews;