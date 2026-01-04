import { useState } from "react";
import { Bell, Check, CheckCheck, Clock, AlertTriangle, FileText, Info, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "status_update":
        return <FileText className="w-5 h-5 text-primary" />;
      case "sla_warning":
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case "resolution":
        return <Check className="w-5 h-5 text-secondary" />;
      case "system":
        return <Info className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: Notification["type"]) => {
    switch (type) {
      case "status_update":
        return "Status Update";
      case "sla_warning":
        return "SLA Warning";
      case "resolution":
        return "Resolution";
      case "system":
        return "System";
      default:
        return "Notification";
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.complaint_id) {
      navigate(`/track-complaint?id=${notification.complaint_id}`);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.is_read;
    return n.type === activeTab;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay updated on your complaints and system alerts
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="status_update">Updates</TabsTrigger>
                <TabsTrigger value="resolution">Resolved</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground animate-spin" />
                    <p className="text-muted-foreground">Loading notifications...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No notifications found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          !notification.is_read ? "bg-primary/5 border-primary/20" : ""
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full bg-muted">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-medium ${!notification.is_read ? "text-primary" : ""}`}>
                                  {notification.title}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(notification.type)}
                                </Badge>
                                {!notification.is_read && (
                                  <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                                {notification.complaint_id && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    ID: {notification.complaint_id}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!notification.is_read && (
                              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
