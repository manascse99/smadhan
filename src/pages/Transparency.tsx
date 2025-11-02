import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Transparency = () => {
  const [copiedHash, setCopiedHash] = useState("");
  const { user } = useAuth();

  // Map complaints to user IDs - in production this would come from backend
  const userComplaints: Record<string, string> = {
    "LOK12345": "1", // Test User's complaints
    "LOK12346": "1",
    "LOK12344": "2",
    "LOK12343": "3",
  };

  const allTransactions = [
    {
      id: "TXN001",
      complaintId: "LOK12345",
      hash: "0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead79fade1c0d57a7a",
      timestamp: "2024-12-20 10:45:23 AM",
      action: "Complaint Filed",
    },
    {
      id: "TXN002",
      complaintId: "LOK12345",
      hash: "0x8a3bcde2f1e68b8bg77bc5fbe8afade2f1e68b8bg77bc5fbe8afade2f1e68b8b",
      timestamp: "2024-12-20 11:30:45 AM",
      action: "Complaint Verified",
    },
    {
      id: "TXN003",
      complaintId: "LOK12346",
      hash: "0x9c4def3g2f79c9ch88cd6gch9bgbef3g2f79c9ch88cd6gch9bgbef3g2f79c9c",
      timestamp: "2024-12-19 09:15:10 AM",
      action: "Complaint Filed",
    },
    {
      id: "TXN004",
      complaintId: "LOK12344",
      hash: "0xa5efg4h3g80d0di99de7hdi0chcfg4h3g80d0di99de7hdi0chcfg4h3g80d0d",
      timestamp: "2024-12-18 02:20:33 PM",
      action: "Complaint Filed",
    },
    {
      id: "TXN005",
      complaintId: "LOK12343",
      hash: "0xb6fgh5i4h91e1ej00ef8iej1didfg5i4h91e1ej00ef8iej1didfg5i4h91e1e",
      timestamp: "2024-12-17 03:45:12 PM",
      action: "Complaint Resolved",
    },
  ];

  // Filter transactions to show only user's complaints
  const transactions = user 
    ? allTransactions.filter(txn => userComplaints[txn.complaintId] === user.id)
    : [];

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.success("Hash copied to clipboard!");
    setTimeout(() => setCopiedHash(""), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blockchain Transparency</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every action is permanently recorded on the blockchain, ensuring complete transparency and preventing tampering
          </p>
        </div>

        {/* Blockchain Visualization */}
        <Card className="gradient-card shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">Immutable Record Chain</h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8">
            {[
              { title: "Filed", desc: "Complaint Registered" },
              { title: "Verified", desc: "AI Validated" },
              { title: "Routed", desc: "Dept Assigned" },
              { title: "Secured", desc: "Polygon Chain" }
            ].map((block, index) => (
              <div key={index} className="flex items-center">
                <div className="relative">
                  <div 
                    className="w-32 h-32 rounded-xl flex items-center justify-center animate-float relative z-10"
                    style={{ 
                      animationDelay: `${index * 0.3}s`,
                      background: 'linear-gradient(135deg, hsl(220, 80%, 55%) 0%, hsl(220, 85%, 45%) 50%, hsl(145, 65%, 50%) 100%)',
                      boxShadow: '0 0 30px hsl(220, 80%, 55%, 0.6), 0 8px 24px hsla(220, 15%, 20%, 0.2)'
                    }}
                  >
                    <div className="text-center p-2">
                      <div className="text-xl font-bold text-white mb-1">{block.title}</div>
                      <div className="text-xs text-white leading-tight">{block.desc}</div>
                    </div>
                  </div>
                  {/* Animated Glow effect */}
                  <div 
                    className="absolute inset-0 rounded-xl blur-xl animate-glow" 
                    style={{ 
                      animationDelay: `${index * 0.3}s`,
                      background: 'hsl(220, 80%, 55%, 0.4)'
                    }}
                  />
                </div>
                {index < 3 && (
                  <div className="hidden md:block relative w-16 h-1 bg-border overflow-hidden">
                    <div 
                      className="absolute inset-0 h-full animate-pulse-slow"
                      style={{ 
                        animationDelay: `${index * 0.5}s`,
                        background: 'linear-gradient(90deg, hsl(220, 80%, 55%), hsl(145, 65%, 50%))',
                        boxShadow: '0 0 12px hsl(220, 80%, 55%)'
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-primary">Secured by Polygon Blockchain</p>
            <p className="text-xs text-muted-foreground">
              Decentralized • Tamper-Proof • Permanent
            </p>
          </div>
        </Card>

        {/* Transaction Records */}
        <Card className="gradient-card shadow-xl overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-2xl font-bold">Recent Transactions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              All complaint actions recorded on-chain
            </p>
          </div>

          <div className="divide-y divide-border">
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">
                  {user ? "No transactions found for your complaints." : "Please log in to view your complaint transactions."}
                </p>
              </div>
            ) : (
              transactions.map((txn, index) => (
              <div
                key={index}
                className="p-6 hover:bg-muted/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono px-3 py-1 rounded-full bg-primary/10 text-primary">
                        {txn.id}
                      </span>
                      <span className="text-sm font-medium">{txn.action}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Complaint: {txn.complaintId}</span>
                      <span>•</span>
                      <span>{txn.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 lg:w-80">
                      <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                      <div className="font-mono text-xs bg-muted px-3 py-2 rounded-lg truncate">
                        {txn.hash}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(txn.hash)}
                      className="flex-shrink-0"
                    >
                      {copiedHash === txn.hash ? (
                        <Check className="w-4 h-4 text-secondary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </Card>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Immutable Records",
              description: "Once recorded, data cannot be altered or deleted, ensuring permanent accountability.",
            },
            {
              title: "Complete Transparency",
              description: "Every action is visible and verifiable by citizens, departments, and auditors.",
            },
            {
              title: "Tamper-Proof",
              description: "Cryptographic security prevents unauthorized modifications to complaint records.",
            },
          ].map((item, index) => (
            <Card key={index} className="gradient-card shadow-lg p-6 text-center">
              <h3 className="text-lg font-bold mb-3">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Transparency;
