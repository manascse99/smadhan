import { Link } from "react-router-dom";
import { FileText, Search, BarChart3, TrendingUp, CheckCircle, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

const Index = () => {
  const [stats, setStats] = useState({ filed: 0, resolved: 0, departments: 0 });

  useEffect(() => {
    // Animate counters
    const targetStats = { filed: 2847, resolved: 2156, departments: 48 };
    const duration = 2000;
    const steps = 60;
    const increment = {
      filed: targetStats.filed / steps,
      resolved: targetStats.resolved / steps,
      departments: targetStats.departments / steps,
    };

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setStats(targetStats);
        clearInterval(interval);
      } else {
        setStats({
          filed: Math.floor(increment.filed * currentStep),
          resolved: Math.floor(increment.resolved * currentStep),
          departments: Math.floor(increment.departments * currentStep),
        });
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-secondary text-white py-20">
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-fade-in">
              Empowering Citizens Through
              <span className="block mt-2">Smart Governance</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Your voice matters. File, track, and resolve grievances with transparency.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/95 shadow-lg text-base px-8">
                <Link to="/file-complaint">
                  <FileText className="w-5 h-5 mr-2" />
                  File Complaint
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-secondary text-white hover:bg-secondary/90 shadow-lg text-base px-8">
                <Link to="/track-complaint">
                  <Search className="w-5 h-5 mr-2" />
                  Track Complaint
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90 shadow-lg text-base px-8">
                <Link to="/dashboard">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Dashboard
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: FileText, label: "Complaints Filed", value: stats.filed },
              { icon: CheckCircle, label: "Resolved", value: stats.resolved },
              { icon: Users, label: "Active Departments", value: stats.departments },
            ].map((stat, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center hover:bg-white/20 transition-colors">
                <stat.icon className="w-10 h-10 mx-auto mb-3 text-white" />
                <div className="text-3xl font-bold mb-2 text-white">{stat.value.toLocaleString()}</div>
                <div className="text-sm text-white/90">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A seamless, transparent process from filing to resolution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "File Your Complaint",
                description: "Submit detailed grievances with location, photos, and category. AI suggests the right department automatically.",
                icon: FileText,
                color: "primary",
              },
              {
                title: "Real-Time Tracking",
                description: "Monitor your complaint's progress through every stage with live updates and transparent timelines.",
                icon: TrendingUp,
                color: "accent",
              },
              {
                title: "Swift Resolution",
                description: "Assigned officers work efficiently. Blockchain ensures accountability and prevents tampering.",
                icon: CheckCircle,
                color: "secondary",
              },
            ].map((feature, index) => (
              <Card key={index} className="gradient-card border-0 shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className={`w-16 h-16 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-8 h-8 text-${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <Card className="gradient-hero text-white border-0 p-12 shadow-2xl max-w-4xl mx-auto">
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to Make Your Voice Heard?</h2>
              <p className="text-xl text-white/90">
                Join thousands of citizens using Lok Samadhan for transparent governance
              </p>
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl text-lg px-8">
                <Link to="/file-complaint">
                  Get Started Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
