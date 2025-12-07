export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  upvotes: number;
  status: 'filed' | 'verified' | 'processing' | 'resolved';
  date: string;
  imageUrl?: string;
  imageUrls?: string[];
  hasUpvoted?: boolean;
}

export const mockComplaints: Complaint[] = [
  {
    id: "LOK12345",
    title: "Broken Water Pipeline",
    description: "Major water leakage on MG Road causing water wastage and road damage",
    category: "Water Supply",
    location: { address: "MG Road, Sector 21", lat: 28.613939, lng: 77.209023 },
    upvotes: 45,
    status: "processing",
    date: "2024-10-28",
    hasUpvoted: false
  },
  {
    id: "LOK12346",
    title: "Pothole on Main Street",
    description: "Large pothole causing accidents, needs immediate repair",
    category: "Road & Transport",
    location: { address: "Main Street, Sector 18", lat: 28.614239, lng: 77.210023 },
    upvotes: 32,
    status: "filed",
    date: "2024-10-29",
    hasUpvoted: false
  },
  {
    id: "LOK12347",
    title: "Street Light Not Working",
    description: "Multiple street lights not working in residential area",
    category: "Electricity",
    location: { address: "Green Park, Sector 15", lat: 28.612939, lng: 77.208023 },
    upvotes: 18,
    status: "verified",
    date: "2024-10-30",
    hasUpvoted: false
  },
  {
    id: "LOK12348",
    title: "Garbage Not Collected",
    description: "Waste accumulation for past 3 days in residential society",
    category: "Waste Management",
    location: { address: "Rose Garden, Sector 12", lat: 28.615139, lng: 77.211023 },
    upvotes: 67,
    status: "processing",
    date: "2024-10-27",
    hasUpvoted: false
  }
];
