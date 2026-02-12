import { Shield, Zap, Users, Target, FileText, Search, BarChart3, Bell, CheckCircle, Brain, MapPin, Star, Lock, HeadphonesIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Every complaint is recorded on an immutable blockchain, ensuring transparency and preventing tampering.",
    },
    {
      icon: Zap,
      title: "AI-Powered Intelligence",
      description: "Machine learning algorithms automatically categorize complaints and predict resolution times for efficiency.",
    },
    {
      icon: Users,
      title: "Citizen Empowerment",
      description: "Give citizens a powerful voice through upvoting, tracking, and transparent communication with departments.",
    },
    {
      icon: Target,
      title: "Data-Driven Insights",
      description: "Advanced analytics help identify problem areas and optimize resource allocation across departments.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="gradient-hero text-white py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">About Lok Samadhan</h1>
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                Transforming governance through technology. We're building a transparent, efficient, and citizen-centric grievance resolution platform for modern India.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="gradient-card shadow-xl p-12 text-center">
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  To empower every Indian citizen with a platform that ensures their grievances are heard, tracked, and resolved efficiently. We believe in transparent governance where technology bridges the gap between citizens and administration, creating a more responsive and accountable system.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Powered by Innovation</h2>
              <p className="text-xl text-muted-foreground">
                Cutting-edge technology for modern governance
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="gradient-card shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { value: "2,847", label: "Complaints Resolved" },
                { value: "48", label: "Active Departments" },
                { value: "98%", label: "Citizen Satisfaction" },
                { value: "24hrs", label: "Avg. Response Time" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="gradient-card shadow-xl p-12">
                <h2 className="text-3xl font-bold mb-6 text-center">Our Vision</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    We envision a future where every citizen's voice is amplified through technology, where grievances are resolved swiftly, and where government departments are held accountable through transparent, blockchain-verified records.
                  </p>
                  <p>
                    By combining artificial intelligence, blockchain technology, and user-centric design, Lok Samadhan is setting a new standard for digital governance in India and beyond.
                  </p>
                  <p>
                    Our platform doesn't just connect citizens to government—it transforms the entire ecosystem of public service delivery, making it more responsive, efficient, and trustworthy.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
