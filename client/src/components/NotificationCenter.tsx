import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCircle2 } from "lucide-react";

type NotificationItem = {
  id: number;
  message: string;
  isRead: number;
  createdAt: Date | string;
};

type NotificationCenterProps = {
  userId?: number;
  notifications?: NotificationItem[];
  onMarkRead?: (notificationId: number) => void;
  onRefresh?: () => void;
};

export default function NotificationCenter({
  userId,
  notifications: providedNotifications,
  onMarkRead,
  onRefresh,
}: NotificationCenterProps) {
  const notificationsQuery = trpc.systemLogs.notifications.list.useQuery(
    userId ? { userId } : undefined,
    { enabled: Boolean(userId) && providedNotifications === undefined, refetchInterval: 15_000 },
  );
  const markNotificationRead = trpc.systemLogs.notifications.update.useMutation({
    onSuccess: () => {
      onRefresh?.();
      void notificationsQuery.refetch();
    },
  });
  const notificationsList = providedNotifications ?? notificationsQuery.data ?? [];
  const unreadNotifications = notificationsList.filter(notification => notification.isRead === 0);

  const handleMarkRead = (notificationId: number) => {
    if (onMarkRead) {
      onMarkRead(notificationId);
      return;
    }
    markNotificationRead.mutate({ id: notificationId, isRead: 1 });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 shrink-0 rounded-lg"
          aria-label={`Notificaciones de socios: ${unreadNotifications.length} sin leer`}
        >
          <Bell className="h-4 w-4" />
          {unreadNotifications.length > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Avisos para socios</p>
              <p className="text-xs text-muted-foreground">Exportaciones y eventos relevantes de EDV</p>
            </div>
            <Badge variant="secondary">{unreadNotifications.length} nuevas</Badge>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {notificationsList.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">No hay notificaciones recientes.</div>
          ) : (
            notificationsList.slice(0, 8).map(notification => (
              <button
                key={notification.id}
                type="button"
                className={`w-full rounded-lg p-3 text-left transition-colors hover:bg-muted ${notification.isRead === 0 ? "bg-primary/[0.05]" : ""}`}
                onClick={() => {
                  if (notification.isRead === 0) handleMarkRead(notification.id);
                }}
              >
                <div className="flex gap-2">
                  <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${notification.isRead === 0 ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="min-w-0">
                    <p className="text-xs leading-5 text-foreground">{notification.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(notification.createdAt).toLocaleString("es-AR")}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
