import { Mail, Phone, MapPin, Send, Star, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Review {
  id: string;
  name: string;
  rating: number;
  review: string;
  created_at: string;
}

const Contact = () => {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [reviewData, setReviewData] = useState({
    name: "",
    email: "",
    rating: 5,
    review: "",
  });

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (user) {
      setReviewData(prev => ({
        ...prev,
        name: user.fullName || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('id, name, rating, review, created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (data) {
      setReviews(data);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill all required fields");
      return;
    }
    toast.success("Message sent successfully! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewData.name || !reviewData.email || !reviewData.review) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user?.id || null,
          name: reviewData.name,
          email: reviewData.email,
          rating: reviewData.rating,
          review: reviewData.review,
        });

      if (error) throw error;

      toast.success("Thank you for your review! It will be visible after approval.");
      setReviewData({
        name: user?.fullName || "",
        email: user?.email || "",
        rating: 5,
        review: "",
      });
    } catch (error: any) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onChange?.(star)}
            className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions or suggestions? We'd love to hear from you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="gradient-card shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-sm text-muted-foreground">support@loksamadhan.gov.in</p>
                  <p className="text-sm text-muted-foreground">info@loksamadhan.gov.in</p>
                </div>
              </div>
            </Card>

            <Card className="gradient-card shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Phone</h3>
                  <p className="text-sm text-muted-foreground">Toll-Free: 1800-123-4567</p>
                  <p className="text-sm text-muted-foreground">Mon-Fri: 9AM - 6PM</p>
                </div>
              </div>
            </Card>

            <Card className="gradient-card shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Address</h3>
                  <p className="text-sm text-muted-foreground">
                    Lok Samadhan Headquarters<br />
                    Government Complex, Block A<br />
                    New Delhi - 110001, India
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="lg:col-span-2 gradient-card shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="What is this regarding?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us how we can help you..."
                  className="min-h-32 resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary-dark shadow-md">
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </Button>
            </form>
          </Card>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">What People Say</h2>
            <p className="text-muted-foreground">Read reviews from our users</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{review.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-muted-foreground">{review.review}</p>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
                </Card>
              )}
            </div>

            {/* Review Form */}
            <Card className="gradient-card shadow-xl p-6 h-fit">
              <h3 className="text-xl font-bold mb-4">Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="review-name">Your Name *</Label>
                  <Input
                    id="review-name"
                    placeholder="Enter your name"
                    value={reviewData.name}
                    onChange={(e) => setReviewData({ ...reviewData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-email">Email *</Label>
                  <Input
                    id="review-email"
                    type="email"
                    placeholder="you@example.com"
                    value={reviewData.email}
                    onChange={(e) => setReviewData({ ...reviewData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rating *</Label>
                  {renderStars(reviewData.rating, true, (r) => setReviewData({ ...reviewData, rating: r }))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-text">Your Review *</Label>
                  <Textarea
                    id="review-text"
                    placeholder="Share your experience..."
                    className="min-h-24 resize-none"
                    value={reviewData.review}
                    onChange={(e) => setReviewData({ ...reviewData, review: e.target.value })}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-dark"
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            </Card>
          </div>
        </div>

        {/* Map */}
        <Card className="mt-12 overflow-hidden shadow-xl max-w-6xl mx-auto">
          <div className="h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.1983901719867!2d77.20902931508092!3d28.613939382421935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd371d9e7c4b%3A0x8e3f4c5cc6e4c7f3!2sIndia%20Gate!5e0!3m2!1sen!2sin!4v1629789012345!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;