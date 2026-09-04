import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'price_drop' | 'promo' | 'system';
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'novacommerce_notifications';

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Order #NOV-9281 Confirmed',
    message: 'Your minimalist essentials have been verified and queued for same-day dispatch.',
    type: 'order',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    read: false,
    link: '/orders',
  },
  {
    id: 'notif-2',
    title: 'Price Drop Alert (-20%)',
    message: 'Oh My Bod! Sunscreen Lotion dropped to $16.00 in the Clean Beauty collection.',
    type: 'price_drop',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Complimentary Express Delivery',
    message: 'All qualifying marketplace orders over $50 now ship with free express delivery.',
    type: 'promo',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
  },
  {
    id: 'notif-4',
    title: 'Marketplace Security Verified',
    message: 'End-to-end TLS 1.3 encryption and verified merchant credentials are fully active.',
    type: 'system',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const [isOpen, setIsOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Ignore
    }
  }, [notifications]);

  // Global custom event listener for in-app trigger dispatch
  useEffect(() => {
    const handleNewNotification = (e: any) => {
      if (e.detail?.title && e.detail?.message) {
        addNotification({
          title: e.detail.title,
          message: e.detail.message,
          type: e.detail.type || 'system',
          link: e.detail.link,
        });
      }
    };
    window.addEventListener('new-in-app-notification', handleNewNotification);
    return () => {
      window.removeEventListener('new-in-app-notification', handleNewNotification);
    };
  }, []);

  const openNotifications = () => setIsOpen(true);
  const closeNotifications = () => setIsOpen(false);
  const toggleNotifications = () => setIsOpen((prev) => !prev);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: NotificationItem = {
        ...item,
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        openNotifications,
        closeNotifications,
        toggleNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
