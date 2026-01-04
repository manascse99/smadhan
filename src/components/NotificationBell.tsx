import { Bell, Check, CheckCheck, Clock, AlertTriangle, Info, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useNotifications();
  const navigate = useNavigate();

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "status_update":
        return <FileText className="w-4 h-4 text-primary" />;
      case "sla_warning":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "resolution":
        return <Check className="w-4 h-4 text-secondary" />;
      case "system":
        return <Info className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Bell className="w-4 h-4" />;
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-background">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !notification.is_read ? "bg-muted/50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      !notification.is_read ? "font-medium" : ""
                    }`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link to="/notifications">
              <ExternalLink className="w-4 h-4 mr-2" />
              View All Notifications
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
