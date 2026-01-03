import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface Notification {
  id: number;
  type: "success" | "warning" | "error" | "info";
  message: string;
  details?: string;
}

interface NotificationContextType {
  addNotification: (
    type: Notification["type"],
    message: string,
    details?: string,
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

let notificationId = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (type: Notification["type"], message: string, details?: string) => {
      const id = ++notificationId;
      setNotifications((prev) => [...prev, { id, type, message, details }]);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    },
    [],
  );

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const typeStyles = {
    success: "bg-green-900 border-green-500 text-green-100",
    warning: "bg-yellow-900 border-yellow-500 text-yellow-100",
    error: "bg-red-900 border-red-500 text-red-100",
    info: "bg-blue-900 border-blue-500 text-blue-100",
  };

  const typeIcons = {
    success: "✔",
    warning: "!",
    error: "✗",
    info: "ℹ",
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      {/* Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`${typeStyles[notification.type]} border-2 rounded shadow-lg p-3 animate-slide-in cursor-pointer`}
            onClick={() => removeNotification(notification.id)}
          >
            <div className="flex items-start gap-2">
              <span className="font-bold text-lg">
                {typeIcons[notification.type]}
              </span>
              <div className="flex-1">
                <div className="font-bold text-sm">{notification.message}</div>
                {notification.details && (
                  <div className="text-xs mt-1 opacity-80">
                    {notification.details}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
}

// Global notification functions (for use outside React components)
let globalAddNotification: NotificationContextType["addNotification"] | null =
  null;

export function setGlobalNotificationHandler(
  handler: NotificationContextType["addNotification"],
) {
  globalAddNotification = handler;
}

export function showSuccessNotification(message: string, details?: string) {
  globalAddNotification?.("success", message, details);
}

export function showWarningNotification(message: string, details?: string) {
  globalAddNotification?.("warning", message, details);
}

export function showErrorNotification(message: string, details?: string) {
  globalAddNotification?.("error", message, details);
}

export function showInfoNotification(message: string, details?: string) {
  globalAddNotification?.("info", message, details);
}
