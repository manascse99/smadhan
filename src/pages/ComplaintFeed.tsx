import { useState } from "react";
import { MapPin, ThumbsUp, Eye, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Complaint {
  id: string;
  title: string;
  category: string;
  location: string;
  status: "Filed" | "Verified" | "Processing" | "Resolved";
  upvotes: number;
  date: string;
  description: string;
}

const ComplaintFeed = () => {
  const [sortBy, setSortBy] = useState("newest");
  const [filterDept, setFilterDept] = useState("all");

  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: "LOK12345",
      title: "Water Supply Disruption",
      category: "Water Supply",
      location: "Sector 15, Delhi",
      status: "Processing",
      upvotes: 42,
      date: "20 Dec 2024",
      description: "Frequent water supply disruption affecting 200+ households in residential area.",
    },
    {
      id: "LOK12344",
      title: "Damaged Road Causing Accidents",
      category: "Road & Transport",
      location: "MG Road, Bangalore",
      status: "Verified",
      upvotes: 128,
      date: "19 Dec 2024",
      description: "Large pothole causing frequent accidents and traffic jams during peak hours.",
    },
    {
      id: "LOK12343",
      title: "Power Outage in Industrial Area",
      category: "Electricity",
      location: "Phase 2, Noida",
      status: "Resolved",
      upvotes: 89,
      date: "18 Dec 2024",
      description: "Prolonged power cuts affecting businesses and manufacturing units in industrial zone.",
    },
    {
      id: "LOK12342",
      title: "Garbage Not Collected for 10 Days",
      category: "Waste Management",
      location: "Koramangala, Bangalore",
      status: "Filed",
      upvotes: 67,
      date: "17 Dec 2024",
      description: "Waste accumulation causing health hazards and foul smell in residential colony.",
    },
    {
      id: "LOK12341",
      title: "Street Lights Not Working",
      category: "Electricity",
      location: "Connaught Place, Delhi",
      status: "Processing",
      upvotes: 54,
      date: "16 Dec 2024",
      description: "Multiple street lights not functional for over 2 weeks, causing safety concerns.",
    },
    {
      id: "LOK12340",
      title: "Hospital Staff Shortage",
      category: "Public Health",
      location: "Government Hospital, Mumbai",
      status: "Verified",
      upvotes: 203,
      date: "15 Dec 2024",
      description: "Severe shortage of doctors and nurses leading to long waiting times for patients.",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Filed":
        return "status-filed";
      case "Verified":
        return "status-verified";
      case "Processing":
        return "status-processing";
      case "Resolved":
        return "status-resolved";
      default:
        return "status-filed";
    }
  };

  const handleUpvote = (id: string) => {
    setComplaints(
      complaints.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c))
    );
    toast.success("Upvoted successfully!");
  };

  const sortedComplaints = [...complaints].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return b.upvotes - a.upvotes;
    }
  });

  const filteredComplaints =
    filterDept === "all"
      ? sortedComplaints
      : sortedComplaints.filter((c) => c.category === filterDept);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Public Complaint Feed</h1>
          <p className="text-lg text-muted-foreground">
            View and support complaints filed by fellow citizens
          </p>
        </div>

        {/* Filters & Sort */}
        <Card className="gradient-card shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Most Upvoted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Department</label>
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Water Supply">Water Supply</SelectItem>
                  <SelectItem value="Road & Transport">Road & Transport</SelectItem>
                  <SelectItem value="Electricity">Electricity</SelectItem>
                  <SelectItem value="Waste Management">Waste Management</SelectItem>
                  <SelectItem value="Public Health">Public Health</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Complaints Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {filteredComplaints.map((complaint) => (
            <Card
              key={complaint.id}
              className="gradient-card shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{complaint.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{complaint.date}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {complaint.description}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{complaint.location}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpvote(complaint.id)}
                      className="hover:bg-secondary hover:text-secondary-foreground"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {complaint.upvotes}
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Nearby Complaints Section */}
        <Card className="gradient-card shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Nearby Complaints</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredComplaints.slice(0, 3).map((complaint) => (
              <div
                key={complaint.id}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <p className="font-medium mb-2">{complaint.title}</p>
                <p className="text-xs text-muted-foreground mb-3">{complaint.location}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{complaint.date}</span>
                  <div className="flex items-center gap-1 text-xs">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{complaint.upvotes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ComplaintFeed;
