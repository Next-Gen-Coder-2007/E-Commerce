import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bell,
  Package,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  Trash2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useNotifications, NotificationItem } from '../context/NotificationContext';

export const NotificationDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isOpen,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'order' | 'price_drop' | 'promo'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-neutral-900" />;
      case 'price_drop':
        return <Tag className="w-4 h-4 text-neutral-900" />;
      case 'promo':
        return <Sparkles className="w-4 h-4 text-neutral-900" />;
      case 'system':
      default:
        return <ShieldCheck className="w-4 h-4 text-neutral-900" />;
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.link) {
      closeNotifications();
      navigate(item.link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-neutral-900">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/30 backdrop-blur-xs transition-opacity"
        onClick={closeNotifications}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-neutral-100 flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                <Bell className="w-4 h-4 text-neutral-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl font-normal text-neutral-900">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-neutral-950 text-white">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400">Order updates, price alerts & news</p>
              </div>
            </div>

            <button
              onClick={closeNotifications}
              className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-50 transition-colors cursor-pointer"
              aria-label="Close Notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions & Filter Tabs */}
          <div className="px-6 py-3 border-b border-neutral-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'order', label: 'Orders' },
                { id: 'price_drop', label: 'Price Alerts' },
                { id: 'promo', label: 'Promos' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1 rounded-full transition-colors cursor-pointer text-[11px] font-medium ${
                    activeTab === tab.id
                      ? 'bg-neutral-950 text-white font-semibold'
                      : 'border border-neutral-200 text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-neutral-400 hover:text-neutral-900 cursor-pointer p-1 rounded transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 divide-y-0">
            {filteredNotifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
                <div className="w-14 h-14 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-300">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-base font-serif text-neutral-900">All Caught Up</h3>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                  You don't have any notifications in this category. We'll update you as soon as your orders dispatch or prices change.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                    item.read
                      ? 'bg-white border-neutral-100 hover:border-neutral-200'
                      : 'bg-neutral-50/70 border-neutral-200/90 shadow-2xs hover:border-neutral-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4
                          className={`text-xs tracking-tight truncate ${
                            item.read ? 'font-semibold text-neutral-700' : 'font-bold text-neutral-950'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      {item.link && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-900 hover:underline">
                          <span>View Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator dot */}
                  {!item.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-neutral-950" />
                  )}

                  {/* Delete button on hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(item.id);
                    }}
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-neutral-900 p-1 rounded transition-opacity cursor-pointer"
                    title="Dismiss"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 text-center">
            <span className="text-[11px] text-neutral-400">
              Push and real-time order alerts are active for your account.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
